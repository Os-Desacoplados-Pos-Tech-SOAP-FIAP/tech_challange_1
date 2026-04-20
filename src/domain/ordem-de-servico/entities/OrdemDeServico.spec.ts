import { DomainError } from '../../shared/DomainError';
import { UniqueID } from '../../shared/UniqueID';
import { StatusOS, StatusOSEnum } from '../value-objects/StatusOS';
import { ExecucaoDeServico } from './ExecucaoDeServico';
import { TipoItemOrcamento } from './ItemOrcamento';
import { OrdemDeServico } from './OrdemDeServico';

const makeOS = () =>
  OrdemDeServico.criar({
    numero: 1,
    clienteId: new UniqueID().toValue(),
    veiculoId: new UniqueID().toValue(),
    observacoes: 'obs',
  });

const makeOSEmExecucao = () => {
  const os = makeOS();
  os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
  os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
  os.aprovarOrcamento();
  return os;
};

describe('OrdemDeServico', () => {
  it('cria OS no status RECEBIDA', () => {
    const os = makeOS();
    expect(os.status.value).toBe(StatusOSEnum.RECEBIDA);
  });

  it('dispara evento OSCriada ao criar', () => {
    const os = makeOS();
    const names = os.domainEvents.map((e) => e.constructor.name);
    expect(names).toContain('OSCriada');
  });

  it('cria OS com itens iniciais', () => {
    const os = OrdemDeServico.criar({
      numero: 2,
      clienteId: new UniqueID().toValue(),
      veiculoId: new UniqueID().toValue(),
      itensIniciais: [
        {
          tipo: TipoItemOrcamento.SERVICO,
          referenciaId: new UniqueID().toValue(),
          descricao: 'Troca de óleo',
          quantidade: 1,
          valorUnitario: 100,
        },
      ],
    });
    expect(os.itensOrcamento).toHaveLength(1);
    expect(os.valorEstimado.value).toBe(100);
  });

  it('adiciona item em status RECEBIDA', () => {
    const os = makeOS();
    os.adicionarItem({
      tipo: TipoItemOrcamento.SERVICO,
      referenciaId: new UniqueID().toValue(),
      descricao: 'Alinhamento',
      quantidade: 1,
      valorUnitario: 80,
    });
    expect(os.itensOrcamento).toHaveLength(1);
  });

  it('lança DomainError ao adicionar item após aprovação', () => {
    const os = makeOSEmExecucao();
    expect(() =>
      os.adicionarItem({
        tipo: TipoItemOrcamento.SERVICO,
        referenciaId: new UniqueID().toValue(),
        descricao: 'Extra',
        quantidade: 1,
        valorUnitario: 50,
      }),
    ).toThrow(DomainError);
  });

  it('transiciona para EM_DIAGNOSTICO', () => {
    const os = makeOS();
    os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
    expect(os.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
  });

  it('dispara DiagnosticoConcluido e OrcamentoEnviado ao ir para AGUARDANDO_APROVACAO', () => {
    const os = makeOS();
    os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
    os.clearEvents();
    os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
    const names = os.domainEvents.map((e) => e.constructor.name);
    expect(names).toContain('DiagnosticoConcluido');
    expect(names).toContain('OrcamentoEnviado');
  });

  it('aprova orçamento e muda para EM_EXECUCAO', () => {
    const os = makeOS();
    os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
    os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
    os.aprovarOrcamento();
    expect(os.status.value).toBe(StatusOSEnum.EM_EXECUCAO);
  });

  it('lança DomainError ao aprovar orçamento fora de AGUARDANDO_APROVACAO', () => {
    const os = makeOS();
    expect(() => os.aprovarOrcamento()).toThrow(DomainError);
  });

  it('recusa orçamento TOTAL e cancela OS', () => {
    const os = makeOS();
    os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
    os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
    os.recusarOrcamento('TOTAL');
    expect(os.status.value).toBe(StatusOSEnum.CANCELADA);
  });

  it('recusa orçamento PARCIAL e volta para EM_DIAGNOSTICO', () => {
    const os = makeOS();
    os.transicionarPara(StatusOSEnum.EM_DIAGNOSTICO);
    os.transicionarPara(StatusOSEnum.AGUARDANDO_APROVACAO);
    os.recusarOrcamento('PARCIAL');
    expect(os.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
  });

  it('lança DomainError ao recusar orçamento fora de AGUARDANDO_APROVACAO', () => {
    const os = makeOS();
    expect(() => os.recusarOrcamento('TOTAL')).toThrow(DomainError);
  });

  it('registra execução em EM_EXECUCAO', () => {
    const os = makeOSEmExecucao();
    const execucao = ExecucaoDeServico.criar({
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date('2024-01-01T08:00:00'),
      fim: new Date('2024-01-01T10:00:00'),
    });
    os.registrarExecucao(execucao);
    expect(os.execucoes).toHaveLength(1);
  });

  it('lança DomainError ao registrar execução fora de EM_EXECUCAO', () => {
    const os = makeOS();
    const execucao = ExecucaoDeServico.criar({
      servicoId: new UniqueID().toValue(),
      mecanicoId: new UniqueID().toValue(),
      inicio: new Date(),
    });
    expect(() => os.registrarExecucao(execucao)).toThrow(DomainError);
  });

  it('dispara OSFinalizada ao transicionar para FINALIZADA', () => {
    const os = makeOSEmExecucao();
    os.clearEvents();
    os.transicionarPara(StatusOSEnum.FINALIZADA);
    const names = os.domainEvents.map((e) => e.constructor.name);
    expect(names).toContain('OSFinalizada');
  });

  it('dispara OSEntregue ao transicionar para ENTREGUE', () => {
    const os = makeOSEmExecucao();
    os.transicionarPara(StatusOSEnum.FINALIZADA);
    os.clearEvents();
    os.transicionarPara(StatusOSEnum.ENTREGUE);
    const names = os.domainEvents.map((e) => e.constructor.name);
    expect(names).toContain('OSEntregue');
  });
});
