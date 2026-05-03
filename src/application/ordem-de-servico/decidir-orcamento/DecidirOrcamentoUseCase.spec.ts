import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { TipoItemOrcamento } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import {
  IOrcamentoTokenRepository,
  OrcamentoTokenRecord,
} from '../../../domain/ordem-de-servico/repositories/IOrcamentoTokenRepository';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { DomainError } from '../../../domain/shared/DomainError';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { DecidirOrcamentoUseCase } from './DecidirOrcamentoUseCase';

class InMemoryOSRepository implements IOrdemDeServicoRepository {
  public oss: OrdemDeServico[] = [];
  async salvar(os: OrdemDeServico) {
    const i = this.oss.findIndex((x) => x.id.equals(os.id));
    if (i >= 0) this.oss[i] = os;
    else this.oss.push(os);
  }
  async buscarPorId(id: UniqueID) {
    return this.oss.find((o) => o.id.equals(id)) ?? null;
  }
  async buscarPorNumero(n: number) {
    return this.oss.find((o) => o.numero.value === n) ?? null;
  }
  async buscarPorItemOrcamentoId(id: UniqueID) {
    return this.oss.find((o) => o.itensOrcamento.some((i) => i.id.equals(id))) ?? null;
  }
  async listar() {
    return this.oss;
  }
  async proximoNumero() {
    return this.oss.length + 1;
  }
  async tempoMedioExecucaoMinutos() {
    return 0;
  }
  async tempoMedioExecucaoPorServico() {
    return [];
  }
}

class InMemoryTokenRepository implements IOrcamentoTokenRepository {
  private records: OrcamentoTokenRecord[] = [];

  async criar(ordemDeServicoId: string, token: string): Promise<OrcamentoTokenRecord> {
    const record: OrcamentoTokenRecord = {
      id: new UniqueID().toValue(),
      ordemDeServicoId,
      token,
      usado: false,
      criadoEm: new Date(),
      usadoEm: null,
    };
    this.records.push(record);
    return record;
  }

  async buscarPorToken(token: string): Promise<OrcamentoTokenRecord | null> {
    return this.records.find((r) => r.token === token) ?? null;
  }

  async marcarComoUsado(id: string): Promise<void> {
    const r = this.records.find((x) => x.id === id);
    if (r) {
      r.usado = true;
      r.usadoEm = new Date();
    }
  }
}

function criarOSEmAguardandoAprovacao(numero = 1): OrdemDeServico {
  const os = OrdemDeServico.criar({
    numero,
    clienteId: new UniqueID().toValue(),
    veiculoId: new UniqueID().toValue(),
  });
  os.adicionarItem({
    tipo: TipoItemOrcamento.SERVICO,
    referenciaId: new UniqueID().toValue(),
    descricao: 'Troca de óleo',
    quantidade: 1,
    valorUnitario: 100,
  });
  os.avancarStatus();
  return os;
}

describe('DecidirOrcamentoUseCase', () => {
  let osRepo: InMemoryOSRepository;
  let tokenRepo: InMemoryTokenRepository;
  let useCase: DecidirOrcamentoUseCase;

  beforeEach(() => {
    osRepo = new InMemoryOSRepository();
    tokenRepo = new InMemoryTokenRepository();
    useCase = new DecidirOrcamentoUseCase(osRepo, tokenRepo);
  });

  it('aprova orçamento com decisão APROVADA', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-aprovado');

    const resultado = await useCase.execute({
      numero: os.numero.value,
      token: record.token,
      decisao: 'APROVADA',
    });

    expect(resultado.status.value).toBe('APROVADA');
  });

  it('reprova orçamento com decisão REPROVADA', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-reprovado');

    const resultado = await useCase.execute({
      numero: os.numero.value,
      token: record.token,
      decisao: 'REPROVADA',
    });

    expect(resultado.status.value).toBe('REPROVADA');
  });

  it('lança NotFoundException quando token não existe', async () => {
    await expect(
      useCase.execute({ numero: 1, token: 'inexistente', decisao: 'APROVADA' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança UnauthorizedException quando token já foi usado', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-ja-usado');
    await tokenRepo.marcarComoUsado(record.id);

    await expect(
      useCase.execute({ numero: os.numero.value, token: record.token, decisao: 'APROVADA' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança NotFoundException quando OS não existe no repositório', async () => {
    const record = await tokenRepo.criar(new UniqueID().toValue(), 'token-sem-os');

    await expect(
      useCase.execute({ numero: 1, token: record.token, decisao: 'APROVADA' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança DomainError quando número não corresponde à OS do token', async () => {
    const os = criarOSEmAguardandoAprovacao(42);
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-numero-errado');

    await expect(
      useCase.execute({ numero: 999, token: record.token, decisao: 'APROVADA' }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('marca o token como usado após decisão', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-marcar');

    await useCase.execute({ numero: os.numero.value, token: record.token, decisao: 'APROVADA' });

    const tokenAtualizado = await tokenRepo.buscarPorToken(record.token);
    expect(tokenAtualizado?.usado).toBe(true);
  });
});
