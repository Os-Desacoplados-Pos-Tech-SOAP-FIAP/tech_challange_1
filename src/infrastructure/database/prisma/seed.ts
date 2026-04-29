import {
   PerfilAcesso,
   PrismaClient,
   StatusOS,
   TipoCliente,
   TipoInsumo,
   TipoItemOrcamento,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_MARKER = '[SEED]';

// IDs fixos — UUIDs v4 válidos (RFC 4122). Padrão: 00000000-0000-4{cat}-8000-00000000000{seq}
// cat: 0=usuário, 1=cliente, 2=veículo, 3=serviço, 4=insumo, 5=item-execução
const ID = {
   usuario: {
      admin:     '00000000-0000-4000-8000-000000000001',
      atendente: '00000000-0000-4000-8000-000000000002',
      mecanico1: '00000000-0000-4000-8000-000000000003',
      mecanico2: '00000000-0000-4000-8000-000000000004',
   },
   cliente: {
      ana:      '00000000-0000-4001-8000-000000000001',
      carlos:   '00000000-0000-4001-8000-000000000002',
      fernanda: '00000000-0000-4001-8000-000000000003',
      joao:     '00000000-0000-4001-8000-000000000004',
      maria:    '00000000-0000-4001-8000-000000000005',
      acme:     '00000000-0000-4001-8000-000000000006',
   },
   veiculo: {
      civic:    '00000000-0000-4002-8000-000000000001',
      uno:      '00000000-0000-4002-8000-000000000002',
      daily:    '00000000-0000-4002-8000-000000000003',
      gol:      '00000000-0000-4002-8000-000000000004',
      onix:     '00000000-0000-4002-8000-000000000005',
      sprinter: '00000000-0000-4002-8000-000000000006',
   },
   servico: {
      alinhamento:  '00000000-0000-4003-8000-000000000001',
      balanceamento:'00000000-0000-4003-8000-000000000002',
      limpezaBicos: '00000000-0000-4003-8000-000000000003',
      revisaoGeral: '00000000-0000-4003-8000-000000000004',
      pastilhas:    '00000000-0000-4003-8000-000000000005',
      trocaOleo:    '00000000-0000-4003-8000-000000000006',
   },
   insumo: {
      oleo5w30:   '00000000-0000-4004-8000-000000000001',
      filtroOleo: '00000000-0000-4004-8000-000000000002',
      pastilha:   '00000000-0000-4004-8000-000000000003',
      correia:    '00000000-0000-4004-8000-000000000004',
      pneu:       '00000000-0000-4004-8000-000000000005',
      bateria:    '00000000-0000-4004-8000-000000000006',
   },
};

async function main(): Promise<void> {
   console.log('Executando seed...');

   const SENHA_ADMIN = 'admin123';
   const SENHA_PADRAO = 'senha123';
   const hashSenha = (plain: string) => bcrypt.hash(plain, 12);
   const digits = (value: string) => value.replace(/\D/g, '');

   // --- Limpeza: remover serviços duplicados e de teste ---
   const nomesParaManter = [
      'Troca de óleo',
      'Alinhamento',
      'Balanceamento',
      'Troca de pastilhas',
      'Revisão geral',
      'Limpeza de bicos',
   ];
   for (const nome of nomesParaManter) {
      const todos = await prisma.servico.findMany({ where: { nome }, orderBy: { id: 'asc' } });
      if (todos.length > 1) {
         await prisma.servico.deleteMany({
            where: { id: { in: todos.slice(1).map((s) => s.id) } },
         });
      }
   }
   await prisma.servico.deleteMany({
      where: { nome: { notIn: nomesParaManter } },
   });

   // --- Usuários ---
   await prisma.usuario.upsert({
      where: { email: 'admin@oficina.local' },
      update: {},
      create: {
         id: ID.usuario.admin,
         nome: 'Administrador',
         email: 'admin@oficina.local',
         senha: await hashSenha(SENHA_ADMIN),
         perfil: PerfilAcesso.ADMINISTRADOR,
      },
   });

   await prisma.usuario.upsert({
      where: { email: 'atendente@oficina.local' },
      update: {},
      create: {
         id: ID.usuario.atendente,
         nome: 'Carla Atendente',
         email: 'atendente@oficina.local',
         senha: await hashSenha(SENHA_PADRAO),
         perfil: PerfilAcesso.ATENDENTE,
      },
   });

   const mecanico1 = await prisma.usuario.upsert({
      where: { email: 'mecanico1@oficina.local' },
      update: {},
      create: {
         id: ID.usuario.mecanico1,
         nome: 'Pedro Mecânico',
         email: 'mecanico1@oficina.local',
         senha: await hashSenha(SENHA_PADRAO),
         perfil: PerfilAcesso.MECANICO,
      },
   });

   const mecanico2 = await prisma.usuario.upsert({
      where: { email: 'mecanico2@oficina.local' },
      update: {},
      create: {
         id: ID.usuario.mecanico2,
         nome: 'Rafael Mecânico',
         email: 'mecanico2@oficina.local',
         senha: await hashSenha(SENHA_PADRAO),
         perfil: PerfilAcesso.MECANICO,
      },
   });

   // --- Clientes (6) ---
   const ana = await prisma.cliente.upsert({
      where: { documento: digits('620.324.110-59') },
      update: {},
      create: {
         id: ID.cliente.ana,
         tipo: TipoCliente.PF,
         documento: digits('620.324.110-59'),
         nome: 'Ana Lima',
         email: 'ana@email.com',
         telefone: digits('(31) 97777-0000'),
      },
   });

   const carlos = await prisma.cliente.upsert({
      where: { documento: digits('049.435.860-23') },
      update: {},
      create: {
         id: ID.cliente.carlos,
         tipo: TipoCliente.PF,
         documento: digits('049.435.860-23'),
         nome: 'Carlos Ferreira',
         email: 'carlos.ferreira@gmail.com',
         telefone: digits('(21) 97654-3210'),
      },
   });

   const fernanda = await prisma.cliente.upsert({
      where: { documento: digits('467.749.620-09') },
      update: {},
      create: {
         id: ID.cliente.fernanda,
         tipo: TipoCliente.PF,
         documento: digits('467.749.620-09'),
         nome: 'Fernanda Souza Ribeiro',
         email: 'fernanda.ribeiro@gmail.com',
         telefone: digits('(11) 98234-5671'),
      },
   });

   const joao = await prisma.cliente.upsert({
      where: { documento: digits('587.603.570-02') },
      update: {},
      create: {
         id: ID.cliente.joao,
         tipo: TipoCliente.PF,
         documento: digits('587.603.570-02'),
         nome: 'João Silva',
         email: 'joao@email.com',
         telefone: digits('(31) 99999-0000'),
      },
   });

   const maria = await prisma.cliente.upsert({
      where: { documento: digits('370.252.660-94') },
      update: {},
      create: {
         id: ID.cliente.maria,
         tipo: TipoCliente.PF,
         documento: digits('370.252.660-94'),
         nome: 'Maria Souza',
         email: 'maria@email.com',
         telefone: digits('(31) 98888-0000'),
      },
   });

   const acme = await prisma.cliente.upsert({
      where: { documento: digits('46.483.933/0001-88') },
      update: {},
      create: {
         id: ID.cliente.acme,
         tipo: TipoCliente.PJ,
         documento: digits('46.483.933/0001-88'),
         nome: 'Transportadora ACME LTDA',
         email: 'contato@acme.com.br',
         telefone: digits('(31) 3333-4444'),
      },
   });

   // --- Veículos (6 — um por cliente) ---
   const veiculoAna = await prisma.veiculo.upsert({
      where: { placa: 'LIM4H56' },
      update: {},
      create: {
         id: ID.veiculo.civic,
         placa: 'LIM4H56',
         marca: 'Honda',
         modelo: 'Civic',
         ano: 2017,
         clienteId: ana.id,
      },
   });

   const veiculoCarlos = await prisma.veiculo.upsert({
      where: { placa: 'ABC2D34' },
      update: { clienteId: carlos.id },
      create: {
         id: ID.veiculo.uno,
         placa: 'ABC2D34',
         marca: 'Fiat',
         modelo: 'Uno',
         ano: 2019,
         clienteId: carlos.id,
      },
   });

   const veiculoFernanda = await prisma.veiculo.upsert({
      where: { placa: 'ACM2A02' },
      update: { clienteId: fernanda.id },
      create: {
         id: ID.veiculo.daily,
         placa: 'ACM2A02',
         marca: 'Iveco',
         modelo: 'Daily',
         ano: 2018,
         clienteId: fernanda.id,
      },
   });

   const veiculoJoao = await prisma.veiculo.upsert({
      where: { placa: 'ABC1D23' },
      update: {},
      create: {
         id: ID.veiculo.gol,
         placa: 'ABC1D23',
         marca: 'Volkswagen',
         modelo: 'Gol',
         ano: 2022,
         clienteId: joao.id,
      },
   });

   const veiculoMaria = await prisma.veiculo.upsert({
      where: { placa: 'DEF3G45' },
      update: {},
      create: {
         id: ID.veiculo.onix,
         placa: 'DEF3G45',
         marca: 'Chevrolet',
         modelo: 'Onix',
         ano: 2021,
         clienteId: maria.id,
      },
   });

   const veiculoAcme = await prisma.veiculo.upsert({
      where: { placa: 'ACM1A01' },
      update: {},
      create: {
         id: ID.veiculo.sprinter,
         placa: 'ACM1A01',
         marca: 'Mercedes-Benz',
         modelo: 'Sprinter',
         ano: 2020,
         clienteId: acme.id,
      },
   });

   // --- Serviços (6) ---
   const ensureServico = async (id: string, nome: string, descricao: string, valorPadrao: number) => {
      const existing = await prisma.servico.findFirst({ where: { nome } });
      if (existing) return existing;
      return prisma.servico.create({ data: { id, nome, descricao, valorPadrao } });
   };

   const servicoAlinhamento = await ensureServico(
      ID.servico.alinhamento,
      'Alinhamento',
      'Alinhamento da direção dianteira e traseira',
      90,
   );
   const servicoBalanceamento = await ensureServico(
      ID.servico.balanceamento,
      'Balanceamento',
      'Balanceamento das quatro rodas',
      80,
   );
   await ensureServico(
      ID.servico.limpezaBicos,
      'Limpeza de bicos',
      'Limpeza e teste ultrassônico dos injetores de combustível',
      160,
   );
   const servicoRevisao = await ensureServico(
      ID.servico.revisaoGeral,
      'Revisão geral',
      'Revisão completa do veículo com checagem de todos os sistemas',
      600,
   );
   const servicoPastilhas = await ensureServico(
      ID.servico.pastilhas,
      'Troca de pastilhas',
      'Troca das pastilhas de freio dianteiras',
      250,
   );
   const servicoOleo = await ensureServico(
      ID.servico.trocaOleo,
      'Troca de óleo',
      'Troca completa de óleo do motor e filtro',
      120.5,
   );

   // --- Insumos (6) ---
   const oleoMotor = await prisma.insumo.upsert({
      where: { codigo: 'INS-001' },
      update: {},
      create: {
         id: ID.insumo.oleo5w30,
         codigo: 'INS-001',
         nome: 'Óleo 5W30 1L',
         tipo: TipoInsumo.INSUMO,
         valorUnitario: 45,
         quantidadeEstoque: 100,
         estoqueMinimo: 10,
      },
   });

   const filtroOleo = await prisma.insumo.upsert({
      where: { codigo: 'PEC-001' },
      update: {},
      create: {
         id: ID.insumo.filtroOleo,
         codigo: 'PEC-001',
         nome: 'Filtro de óleo',
         tipo: TipoInsumo.PECA,
         valorUnitario: 35.9,
         quantidadeEstoque: 50,
         estoqueMinimo: 5,
      },
   });

   const pastilhaFreio = await prisma.insumo.upsert({
      where: { codigo: 'PEC-002' },
      update: {},
      create: {
         id: ID.insumo.pastilha,
         codigo: 'PEC-002',
         nome: 'Pastilha de freio dianteira',
         tipo: TipoInsumo.PECA,
         valorUnitario: 180,
         quantidadeEstoque: 30,
         estoqueMinimo: 4,
      },
   });

   const correia = await prisma.insumo.upsert({
      where: { codigo: 'PEC-003' },
      update: {},
      create: {
         id: ID.insumo.correia,
         codigo: 'PEC-003',
         nome: 'Correia dentada',
         tipo: TipoInsumo.PECA,
         valorUnitario: 220,
         quantidadeEstoque: 15,
         estoqueMinimo: 3,
      },
   });

   const pneu = await prisma.insumo.upsert({
      where: { codigo: 'PEC-004' },
      update: {},
      create: {
         id: ID.insumo.pneu,
         codigo: 'PEC-004',
         nome: 'Pneu aro 15',
         tipo: TipoInsumo.PECA,
         valorUnitario: 420,
         quantidadeEstoque: 20,
         estoqueMinimo: 4,
      },
   });

   await prisma.insumo.upsert({
      where: { codigo: 'PEC-005' },
      update: {},
      create: {
         id: ID.insumo.bateria,
         codigo: 'PEC-005',
         nome: 'Bateria de 60Ah',
         tipo: TipoInsumo.PECA,
         valorUnitario: 650.75,
         quantidadeEstoque: 12,
         estoqueMinimo: 3,
      },
   });

   // --- Ordens de Serviço ---
   const osJaSemeada = await prisma.ordemDeServico.findFirst({
      where: { observacoes: { contains: SEED_MARKER } },
   });
   if (osJaSemeada) {
      console.log('Ordens de serviço de seed já existem, pulando criação de OS.');
      console.log('Seed concluído. Usuários: 4. Clientes: 6. Veículos: 6. Serviços: 6. Insumos: 6.');
      return;
   }

   const agora = new Date();
   const horasAtras = (h: number) => new Date(agora.getTime() - h * 60 * 60 * 1000);

   // 1. RECEBIDA — ACME/Sprinter
   await prisma.ordemDeServico.create({
      data: {
         clienteId: acme.id,
         veiculoId: veiculoAcme.id,
         status: StatusOS.RECEBIDA,
         valorEstimado: 0,
         observacoes: `${SEED_MARKER} Veículo recém-chegado, aguardando avaliação inicial`,
      },
   });

   // 2. EM_DIAGNOSTICO — João/Gol
   await prisma.ordemDeServico.create({
      data: {
         clienteId: joao.id,
         veiculoId: veiculoJoao.id,
         status: StatusOS.EM_DIAGNOSTICO,
         valorEstimado: 0,
         observacoes: `${SEED_MARKER} Cliente relatou ruído na suspensão dianteira, em investigação`,
      },
   });

   // 3. AGUARDANDO_APROVACAO — Carlos/Uno
   await prisma.ordemDeServico.create({
      data: {
         clienteId: carlos.id,
         veiculoId: veiculoCarlos.id,
         status: StatusOS.AGUARDANDO_APROVACAO,
         valorEstimado: 430.4,
         observacoes: `${SEED_MARKER} Orçamento enviado ao cliente, aguardando aprovação`,
         itensOrcamento: {
            create: [
               {
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoOleo.id,
                  descricao: 'Troca de óleo',
                  quantidade: 1,
                  valorUnitario: 120.5,
                  valorTotal: 120.5,
               },
               {
                  tipo: TipoItemOrcamento.INSUMO,
                  referenciaId: filtroOleo.id,
                  descricao: 'Filtro de óleo',
                  quantidade: 1,
                  valorUnitario: 35.9,
                  valorTotal: 35.9,
               },
               {
                  tipo: TipoItemOrcamento.INSUMO,
                  referenciaId: oleoMotor.id,
                  descricao: 'Óleo 5W30',
                  quantidade: 4,
                  valorUnitario: 45,
                  valorTotal: 180,
               },
               {
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoAlinhamento.id,
                  descricao: 'Alinhamento',
                  quantidade: 1,
                  valorUnitario: 90,
                  valorTotal: 90,
               },
            ],
         },
      },
   });

   // 4. EM_EXECUCAO — Fernanda/Daily
   const itemPastilhasId = '00000000-0000-4005-8000-000000000001';
   await prisma.ordemDeServico.create({
      data: {
         clienteId: fernanda.id,
         veiculoId: veiculoFernanda.id,
         status: StatusOS.EM_EXECUCAO,
         valorEstimado: 470,
         observacoes: `${SEED_MARKER} Troca de pastilhas aprovada, mecânico executando`,
         itensOrcamento: {
            create: [
               {
                  id: itemPastilhasId,
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoPastilhas.id,
                  descricao: 'Troca de pastilhas',
                  quantidade: 1,
                  valorUnitario: 250,
                  valorTotal: 250,
               },
               {
                  tipo: TipoItemOrcamento.INSUMO,
                  referenciaId: pastilhaFreio.id,
                  descricao: 'Pastilha dianteira',
                  quantidade: 1,
                  valorUnitario: 180,
                  valorTotal: 180,
               },
               {
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoBalanceamento.id,
                  descricao: 'Balanceamento',
                  quantidade: 1,
                  valorUnitario: 80,
                  valorTotal: 80,
               },
            ],
         },
         execucoes: {
            create: [
               {
                  itemOrcamentoId: itemPastilhasId,
                  servicoId: servicoPastilhas.id,
                  mecanicoId: mecanico1.id,
                  inicio: horasAtras(2),
                  fim: null,
               },
            ],
         },
      },
   });

   // 5. FINALIZADA — Maria/Onix
   const itemRevisaoId = '00000000-0000-4005-8000-000000000002';
   await prisma.ordemDeServico.create({
      data: {
         clienteId: maria.id,
         veiculoId: veiculoMaria.id,
         status: StatusOS.FINALIZADA,
         valorEstimado: 855.9,
         observacoes: `${SEED_MARKER} Serviço concluído, aguardando cliente retirar`,
         itensOrcamento: {
            create: [
               {
                  id: itemRevisaoId,
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoRevisao.id,
                  descricao: 'Revisão geral',
                  quantidade: 1,
                  valorUnitario: 600,
                  valorTotal: 600,
               },
               {
                  tipo: TipoItemOrcamento.INSUMO,
                  referenciaId: correia.id,
                  descricao: 'Correia dentada',
                  quantidade: 1,
                  valorUnitario: 220,
                  valorTotal: 220,
               },
               {
                  tipo: TipoItemOrcamento.INSUMO,
                  referenciaId: filtroOleo.id,
                  descricao: 'Filtro de óleo',
                  quantidade: 1,
                  valorUnitario: 35.9,
                  valorTotal: 35.9,
               },
            ],
         },
         execucoes: {
            create: [
               {
                  itemOrcamentoId: itemRevisaoId,
                  servicoId: servicoRevisao.id,
                  mecanicoId: mecanico2.id,
                  inicio: horasAtras(10),
                  fim: horasAtras(8),
                  tempoExecucaoMinutos: 120,
               },
            ],
         },
      },
   });

   // 6. ENTREGUE — Ana/Civic
   const itemAlinhamentoId = '00000000-0000-4005-8000-000000000003';
   await prisma.ordemDeServico.create({
      data: {
         clienteId: ana.id,
         veiculoId: veiculoAna.id,
         status: StatusOS.ENTREGUE,
         valorEstimado: 1740,
         observacoes: `${SEED_MARKER} Cliente retirou o veículo, pagamento realizado`,
         itensOrcamento: {
            create: [
               {
                  tipo: TipoItemOrcamento.INSUMO,
                  referenciaId: pneu.id,
                  descricao: 'Pneu aro 15',
                  quantidade: 4,
                  valorUnitario: 420,
                  valorTotal: 1680,
               },
               {
                  id: itemAlinhamentoId,
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoAlinhamento.id,
                  descricao: 'Alinhamento',
                  quantidade: 1,
                  valorUnitario: 90,
                  valorTotal: 90,
               },
            ],
         },
         execucoes: {
            create: [
               {
                  itemOrcamentoId: itemAlinhamentoId,
                  servicoId: servicoAlinhamento.id,
                  mecanicoId: mecanico1.id,
                  inicio: horasAtras(48),
                  fim: horasAtras(45),
                  tempoExecucaoMinutos: 180,
               },
            ],
         },
      },
   });

   // 7. REPROVADA — Carlos/Uno
   await prisma.ordemDeServico.create({
      data: {
         clienteId: carlos.id,
         veiculoId: veiculoCarlos.id,
         status: StatusOS.REPROVADA,
         valorEstimado: 600,
         observacoes: `${SEED_MARKER} Cliente optou por realizar o serviço em outra oficina`,
         itensOrcamento: {
            create: [
               {
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoRevisao.id,
                  descricao: 'Revisão geral',
                  quantidade: 1,
                  valorUnitario: 600,
                  valorTotal: 600,
               },
            ],
         },
      },
   });

   console.log(
      'Seed concluído. Usuários: 4. Clientes: 6. Veículos: 6. Serviços: 6. Insumos: 6. OS: 7 (uma em cada status).',
   );
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
