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
import { ConsultarOrcamentoPublicoUseCase } from './ConsultarOrcamentoPublicoUseCase';

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

  adicionar(record: OrcamentoTokenRecord) {
    this.records.push(record);
  }

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
    if (r) r.usado = true;
  }
}

function criarOSEmAguardandoAprovacao(): OrdemDeServico {
  const os = OrdemDeServico.criar({
    numero: 1,
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

describe('ConsultarOrcamentoPublicoUseCase', () => {
  let osRepo: InMemoryOSRepository;
  let tokenRepo: InMemoryTokenRepository;
  let useCase: ConsultarOrcamentoPublicoUseCase;

  beforeEach(() => {
    osRepo = new InMemoryOSRepository();
    tokenRepo = new InMemoryTokenRepository();
    useCase = new ConsultarOrcamentoPublicoUseCase(osRepo, tokenRepo);
  });

  it('retorna a OS quando token e número são válidos', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-valido');

    const resultado = await useCase.execute(os.numero.value, record.token);
    expect(resultado.id.equals(os.id)).toBe(true);
  });

  it('lança NotFoundException quando token não existe', async () => {
    await expect(useCase.execute(1, 'token-inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança UnauthorizedException quando token já foi usado', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-usado');
    await tokenRepo.marcarComoUsado(record.id);

    await expect(useCase.execute(os.numero.value, record.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança NotFoundException quando OS não existe', async () => {
    const record = await tokenRepo.criar(new UniqueID().toValue(), 'token-sem-os');

    await expect(useCase.execute(1, record.token)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança DomainError quando número informado não corresponde à OS do token', async () => {
    const os = criarOSEmAguardandoAprovacao();
    osRepo.oss.push(os);
    const record = await tokenRepo.criar(os.id.toValue(), 'token-numero-errado');

    await expect(useCase.execute(9999, record.token)).rejects.toBeInstanceOf(DomainError);
  });
});
