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

async function main(): Promise<void> {
   console.log('Executando seed...');

   const senhaAdminHash = await bcrypt.hash('admin123', 12);
   const senhaPadraoHash = await bcrypt.hash('senha123', 12);

   await prisma.usuario.upsert({
      where: { email: 'admin@oficina.local' },
      update: {},
      create: {
         nome: 'Administrador',
         email: 'admin@oficina.local',
         senha: senhaAdminHash,
         perfil: PerfilAcesso.ADMINISTRADOR,
      },
   });

   await prisma.usuario.upsert({
      where: { email: 'atendente@oficina.local' },
      update: {},
      create: {
         nome: 'Carla Atendente',
         email: 'atendente@oficina.local',
         senha: senhaPadraoHash,
         perfil: PerfilAcesso.ATENDENTE,
      },
   });

   const mecanico1 = await prisma.usuario.upsert({
      where: { email: 'mecanico1@oficina.local' },
      update: {},
      create: {
         nome: 'Pedro Mecânico',
         email: 'mecanico1@oficina.local',
         senha: senhaPadraoHash,
         perfil: PerfilAcesso.MECANICO,
      },
   });

   const mecanico2 = await prisma.usuario.upsert({
      where: { email: 'mecanico2@oficina.local' },
      update: {},
      create: {
         nome: 'Rafael Mecânico',
         email: 'mecanico2@oficina.local',
         senha: senhaPadraoHash,
         perfil: PerfilAcesso.MECANICO,
      },
   });

   const joao = await prisma.cliente.upsert({
      where: { documento: '587.603.570-02' },
      update: {},
      create: {
         tipo: TipoCliente.PF,
         documento: '587.603.570-02',
         nome: 'João Silva',
         email: 'joao@email.com',
         telefone: '(31) 99999-0000',
      },
   });

   const maria = await prisma.cliente.upsert({
      where: { documento: '370.252.660-94' },
      update: {},
      create: {
         tipo: TipoCliente.PF,
         documento: '370.252.660-94',
         nome: 'Maria Souza',
         email: 'maria@email.com',
         telefone: '(31) 98888-0000',
      },
   });

   const ana = await prisma.cliente.upsert({
      where: { documento: '329.567.570-83' },
      update: {},
      create: {
         tipo: TipoCliente.PF,
         documento: '329.567.570-83',
         nome: 'Ana Lima',
         email: 'ana@email.com',
         telefone: '(31) 97777-0000',
      },
   });

   const acme = await prisma.cliente.upsert({
      where: { documento: '46.483.933/0001-88' },
      update: {},
      create: {
         tipo: TipoCliente.PJ,
         documento: '46.483.933/0001-88',
         nome: 'Transportadora ACME LTDA',
         email: 'contato@acme.com.br',
         telefone: '(31) 3333-4444',
      },
   });

   const veiculoJoaoGol = await prisma.veiculo.upsert({
      where: { placa: 'ABC1D23' },
      update: {},
      create: {
         placa: 'ABC1D23',
         marca: 'Volkswagen',
         modelo: 'Gol',
         ano: 2022,
         clienteId: joao.id,
      },
   });

   const veiculoJoaoUno = await prisma.veiculo.upsert({
      where: { placa: 'ABC2D34' },
      update: {},
      create: {
         placa: 'ABC2D34',
         marca: 'Fiat',
         modelo: 'Uno',
         ano: 2019,
         clienteId: joao.id,
      },
   });

   const veiculoMaria = await prisma.veiculo.upsert({
      where: { placa: 'DEF3G45' },
      update: {},
      create: {
         placa: 'DEF3G45',
         marca: 'Chevrolet',
         modelo: 'Onix',
         ano: 2021,
         clienteId: maria.id,
      },
   });

   const veiculoAna = await prisma.veiculo.upsert({
      where: { placa: 'LIM4H56' },
      update: {},
      create: {
         placa: 'LIM4H56',
         marca: 'Honda',
         modelo: 'Civic',
         ano: 2017,
         clienteId: ana.id,
      },
   });

   const veiculoAcmeSprinter = await prisma.veiculo.upsert({
      where: { placa: 'ACM1A01' },
      update: {},
      create: {
         placa: 'ACM1A01',
         marca: 'Mercedes-Benz',
         modelo: 'Sprinter',
         ano: 2020,
         clienteId: acme.id,
      },
   });

   const veiculoAcmeDaily = await prisma.veiculo.upsert({
      where: { placa: 'ACM2A02' },
      update: {},
      create: {
         placa: 'ACM2A02',
         marca: 'Iveco',
         modelo: 'Daily',
         ano: 2018,
         clienteId: acme.id,
      },
   });

   const ensureServico = async (nome: string, descricao: string, valorPadrao: number) => {
      const existing = await prisma.servico.findFirst({ where: { nome } });
      if (existing) return existing;
      return prisma.servico.create({ data: { nome, descricao, valorPadrao } });
   };

   const servicoOleo = await ensureServico(
      'Troca de óleo',
      'Troca completa de óleo do motor e filtro',
      120.5,
   );
   const servicoAlinhamento = await ensureServico(
      'Alinhamento',
      'Alinhamento da direção',
      90,
   );
   const servicoBalanceamento = await ensureServico(
      'Balanceamento',
      'Balanceamento das quatro rodas',
      80,
   );
   const servicoPastilhas = await ensureServico(
      'Troca de pastilhas',
      'Troca das pastilhas de freio dianteiras',
      250,
   );
   const servicoRevisao = await ensureServico(
      'Revisão geral',
      'Revisão completa do veículo',
      600,
   );

   const filtroOleo = await prisma.insumo.upsert({
      where: { codigo: 'PEC-001' },
      update: {},
      create: {
         codigo: 'PEC-001',
         nome: 'Filtro de óleo',
         tipo: TipoInsumo.PECA,
         valorUnitario: 35.9,
         quantidadeEstoque: 50,
         estoqueMinimo: 5,
      },
   });

   const oleoMotor = await prisma.insumo.upsert({
      where: { codigo: 'INS-001' },
      update: {},
      create: {
         codigo: 'INS-001',
         nome: 'Óleo 5W30 1L',
         tipo: TipoInsumo.INSUMO,
         valorUnitario: 45,
         quantidadeEstoque: 100,
         estoqueMinimo: 10,
      },
   });

   const pastilhaFreio = await prisma.insumo.upsert({
      where: { codigo: 'PEC-002' },
      update: {},
      create: {
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
         codigo: 'PEC-004',
         nome: 'Pneu aro 15',
         tipo: TipoInsumo.PECA,
         valorUnitario: 420,
         quantidadeEstoque: 20,
         estoqueMinimo: 4,
      },
   });

   const osJaSemeada = await prisma.ordemDeServico.findFirst({
      where: { observacoes: { contains: SEED_MARKER } },
   });
   if (osJaSemeada) {
      console.log('Ordens de serviço de seed já existem, pulando criação de OS.');
      console.log('Seed concluído.');
      return;
   }

   const agora = new Date();
   const horasAtras = (h: number) => new Date(agora.getTime() - h * 60 * 60 * 1000);

   // 1. RECEBIDA — ACME/Sprinter: veículo acabou de chegar, ainda sem avaliação
   await prisma.ordemDeServico.create({
      data: {
         clienteId: acme.id,
         veiculoId: veiculoAcmeSprinter.id,
         status: StatusOS.RECEBIDA,
         valorEstimado: 0,
         observacoes: `${SEED_MARKER} Veículo recém-chegado, aguardando avaliação inicial`,
      },
   });

   // 2. EM_DIAGNOSTICO — João/Gol: mecânico avaliando ruído na suspensão
   await prisma.ordemDeServico.create({
      data: {
         clienteId: joao.id,
         veiculoId: veiculoJoaoGol.id,
         status: StatusOS.EM_DIAGNOSTICO,
         valorEstimado: 0,
         observacoes: `${SEED_MARKER} Cliente relatou ruído na suspensão dianteira, em investigação`,
      },
   });

   // 3. AGUARDANDO_APROVACAO — João/Uno: orçamento montado aguardando cliente
   //    (mesmo cliente do item 2, veículo diferente → cenário "cliente com mais de uma OS aberta")
   await prisma.ordemDeServico.create({
      data: {
         clienteId: joao.id,
         veiculoId: veiculoJoaoUno.id,
         status: StatusOS.AGUARDANDO_APROVACAO,
         valorEstimado: 430.5,
         observacoes: `${SEED_MARKER} Orçamento enviado ao cliente via whatsapp`,
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
                  valorUnitario: 35,
                  valorTotal: 35,
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
                  valorUnitario: 95,
                  valorTotal: 95,
               },
            ],
         },
      },
   });

   // 4. EM_EXECUCAO — ACME/Daily: serviço em andamento, execução sem fim registrado
   //    (mesmo cliente do item 1, veículo diferente → PJ com duas OS abertas simultâneas)
   await prisma.ordemDeServico.create({
      data: {
         clienteId: acme.id,
         veiculoId: veiculoAcmeDaily.id,
         status: StatusOS.EM_EXECUCAO,
         valorEstimado: 470,
         observacoes: `${SEED_MARKER} Troca de pastilhas aprovada, mecânico executando`,
         itensOrcamento: {
            create: [
               {
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
                  valorUnitario: 40,
                  valorTotal: 40,
               },
            ],
         },
         execucoes: {
            create: [
               {
                  servicoId: servicoPastilhas.id,
                  mecanicoId: mecanico1.id,
                  inicio: horasAtras(2),
                  fim: null,
                  observacoes: 'Iniciando troca de pastilhas',
                  insumosUtilizados: {
                     create: [{ insumoId: pastilhaFreio.id, quantidade: 1 }],
                  },
               },
            ],
         },
      },
   });

   // 5. FINALIZADA — Maria/Onix: serviço concluído, aguardando retirada
   await prisma.ordemDeServico.create({
      data: {
         clienteId: maria.id,
         veiculoId: veiculoMaria.id,
         status: StatusOS.FINALIZADA,
         valorEstimado: 855,
         observacoes: `${SEED_MARKER} Serviço concluído, aguardando cliente retirar`,
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
                  valorUnitario: 35,
                  valorTotal: 35,
               },
            ],
         },
         execucoes: {
            create: [
               {
                  servicoId: servicoRevisao.id,
                  mecanicoId: mecanico2.id,
                  inicio: horasAtras(10),
                  fim: horasAtras(8),
                  tempoExecucaoMinutos: 120,
                  observacoes: 'Revisão completa incluindo troca de correia',
                  insumosUtilizados: {
                     create: [
                        { insumoId: correia.id, quantidade: 1 },
                        { insumoId: filtroOleo.id, quantidade: 1 },
                     ],
                  },
               },
            ],
         },
      },
   });

   // 6. ENTREGUE — Ana/Civic: fluxo completo, cliente já retirou
   await prisma.ordemDeServico.create({
      data: {
         clienteId: ana.id,
         veiculoId: veiculoAna.id,
         status: StatusOS.ENTREGUE,
         valorEstimado: 1700,
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
                  tipo: TipoItemOrcamento.SERVICO,
                  referenciaId: servicoAlinhamento.id,
                  descricao: 'Alinhamento',
                  quantidade: 1,
                  valorUnitario: 20,
                  valorTotal: 20,
               },
            ],
         },
         execucoes: {
            create: [
               {
                  servicoId: servicoAlinhamento.id,
                  mecanicoId: mecanico1.id,
                  inicio: horasAtras(48),
                  fim: horasAtras(45),
                  tempoExecucaoMinutos: 180,
                  observacoes: 'Troca dos quatro pneus com alinhamento',
                  insumosUtilizados: {
                     create: [{ insumoId: pneu.id, quantidade: 4 }],
                  },
               },
            ],
         },
      },
   });

   // 7. CANCELADA — Ana/Civic: cliente desistiu após orçamento
   await prisma.ordemDeServico.create({
      data: {
         clienteId: ana.id,
         veiculoId: veiculoAna.id,
         status: StatusOS.CANCELADA,
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
      'Seed concluído. Usuários: admin/atendente/2 mecânicos. Clientes: 4. Veículos: 6. OS: 7 (uma em cada status).',
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
