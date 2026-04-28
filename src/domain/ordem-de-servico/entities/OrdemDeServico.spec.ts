import { DomainError } from '../../shared/DomainError';
import { UniqueID } from '../../shared/UniqueID';
import { StatusOSEnum } from '../value-objects/StatusOS';
import { TipoItemOrcamento } from './ItemOrcamento';
import { OrdemDeServico } from './OrdemDeServico';

const makeOS = () =>
  OrdemDeServico.criar({
    numero: 1,
    clienteId: new UniqueID().toValue(),
    veiculoId: new UniqueID().toValue(),
    observacoes: 'obs',
  });

const adicionarServico = (os: OrdemDeServico, descricao = 'Alinhamento') => {
  os.adicionarItem({
    tipo: TipoItemOrcamento.SERVICO,
    referenciaId: new UniqueID().toValue(),
    descricao,
    quantidade: 1,
    valorUnitario: 100,
  });
  return os.itensOrcamento[os.itensOrcamento.length - 1];
};

const makeOSAprovada = () => {
  const os = makeOS();
  adicionarServico(os);
  os.avancarStatus();
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

  it('cria OS com itens iniciais já em EM_DIAGNOSTICO', () => {
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
    expect(os.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
  });

  describe('adicionarItem', () => {
    it('adiciona item em status RECEBIDA e avança para EM_DIAGNOSTICO', () => {
      const os = makeOS();
      adicionarServico(os);
      expect(os.itensOrcamento).toHaveLength(1);
      expect(os.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
    });

    it('mantém EM_DIAGNOSTICO ao adicionar segundo item', () => {
      const os = makeOS();
      adicionarServico(os);
      adicionarServico(os, 'Balanceamento');
      expect(os.status.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
      expect(os.itensOrcamento).toHaveLength(2);
    });

    it('lança DomainError ao adicionar item após aprovação', () => {
      const os = makeOSAprovada();
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
  });

  describe('avancarStatus', () => {
    it('avança EM_DIAGNOSTICO → AGUARDANDO_APROVACAO quando há item', () => {
      const os = makeOS();
      adicionarServico(os);
      os.avancarStatus();
      expect(os.status.value).toBe(StatusOSEnum.AGUARDANDO_APROVACAO);
    });

    it('lança DomainError em RECEBIDA (sem item, fluxo automático)', () => {
      const os = makeOS();
      expect(() => os.avancarStatus()).toThrow(DomainError);
    });

    it('lança DomainError em AGUARDANDO_APROVACAO (depende do cliente via token)', () => {
      const os = makeOS();
      adicionarServico(os);
      os.avancarStatus();
      expect(() => os.avancarStatus()).toThrow(DomainError);
    });

    it('lança DomainError em APROVADA (depende de iniciar execução)', () => {
      const os = makeOSAprovada();
      expect(() => os.avancarStatus()).toThrow(DomainError);
    });

    it('avança FINALIZADA → ENTREGUE', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      os.registrarPontoExecucao(item.id.toValue(), new UniqueID().toValue());
      os.registrarPontoExecucao(item.id.toValue(), new UniqueID().toValue());
      expect(os.status.value).toBe(StatusOSEnum.FINALIZADA);
      os.avancarStatus();
      expect(os.status.value).toBe(StatusOSEnum.ENTREGUE);
    });

    it('lança DomainError em ENTREGUE (terminal)', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      os.registrarPontoExecucao(item.id.toValue(), new UniqueID().toValue());
      os.registrarPontoExecucao(item.id.toValue(), new UniqueID().toValue());
      os.avancarStatus();
      expect(() => os.avancarStatus()).toThrow(DomainError);
    });
  });

  describe('aprovarOrcamento / recusarOrcamento', () => {
    it('aprova orçamento e fica em APROVADA (sem pular para EM_EXECUCAO)', () => {
      const os = makeOS();
      adicionarServico(os);
      os.avancarStatus();
      os.aprovarOrcamento();
      expect(os.status.value).toBe(StatusOSEnum.APROVADA);
    });

    it('lança DomainError ao aprovar fora de AGUARDANDO_APROVACAO', () => {
      const os = makeOS();
      expect(() => os.aprovarOrcamento()).toThrow(DomainError);
    });

    it('recusa orçamento e fica em REPROVADA (sem ir para CANCELADA)', () => {
      const os = makeOS();
      adicionarServico(os);
      os.avancarStatus();
      os.recusarOrcamento('TOTAL');
      expect(os.status.value).toBe(StatusOSEnum.REPROVADA);
    });

    it('lança DomainError ao recusar fora de AGUARDANDO_APROVACAO', () => {
      const os = makeOS();
      expect(() => os.recusarOrcamento('TOTAL')).toThrow(DomainError);
    });
  });

  describe('registrarPontoExecucao', () => {
    it('1ª chamada cria execução com inicio e auto-transiciona APROVADA → EM_EXECUCAO', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      const mecanicoId = new UniqueID().toValue();
      os.registrarPontoExecucao(item.id.toValue(), mecanicoId);
      expect(os.execucoes).toHaveLength(1);
      expect(os.execucoes[0].inicio).toBeInstanceOf(Date);
      expect(os.execucoes[0].fim).toBeUndefined();
      expect(os.execucoes[0].mecanicoId.toValue()).toBe(mecanicoId);
      expect(os.status.value).toBe(StatusOSEnum.EM_EXECUCAO);
    });

    it('2ª chamada finaliza execução e transiciona EM_EXECUCAO → FINALIZADA quando todos itens SERVICO terminaram', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      const mecanicoId = new UniqueID().toValue();
      os.registrarPontoExecucao(item.id.toValue(), mecanicoId);
      os.registrarPontoExecucao(item.id.toValue(), mecanicoId);
      expect(os.execucoes[0].fim).toBeInstanceOf(Date);
      expect(os.status.value).toBe(StatusOSEnum.FINALIZADA);
    });

    it('não finaliza OS enquanto houver outros SERVICOs sem terminar', () => {
      const os = makeOS();
      adicionarServico(os, 'Alinhamento');
      adicionarServico(os, 'Balanceamento');
      os.avancarStatus();
      os.aprovarOrcamento();
      const [item1, item2] = os.itensOrcamento;
      const mec = new UniqueID().toValue();
      os.registrarPontoExecucao(item1.id.toValue(), mec);
      os.registrarPontoExecucao(item1.id.toValue(), mec);
      expect(os.status.value).toBe(StatusOSEnum.EM_EXECUCAO);
      os.registrarPontoExecucao(item2.id.toValue(), mec);
      os.registrarPontoExecucao(item2.id.toValue(), mec);
      expect(os.status.value).toBe(StatusOSEnum.FINALIZADA);
    });

    it('3ª chamada lança DomainError (já finalizada)', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      const mec = new UniqueID().toValue();
      os.registrarPontoExecucao(item.id.toValue(), mec);
      os.registrarPontoExecucao(item.id.toValue(), mec);
      expect(() => os.registrarPontoExecucao(item.id.toValue(), mec)).toThrow(DomainError);
    });

    it('rejeita item INSUMO', () => {
      const os = makeOS();
      os.adicionarItem({
        tipo: TipoItemOrcamento.INSUMO,
        referenciaId: new UniqueID().toValue(),
        descricao: 'Filtro',
        quantidade: 1,
        valorUnitario: 30,
      });
      // Avança fluxo: EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → APROVADA
      os.avancarStatus();
      os.aprovarOrcamento();
      const item = os.itensOrcamento[0];
      expect(() => os.registrarPontoExecucao(item.id.toValue(), new UniqueID().toValue())).toThrow(
        DomainError,
      );
    });

    it('rejeita item inexistente', () => {
      const os = makeOSAprovada();
      expect(() =>
        os.registrarPontoExecucao(new UniqueID().toValue(), new UniqueID().toValue()),
      ).toThrow(DomainError);
    });

    it('rejeita execução fora de APROVADA/EM_EXECUCAO', () => {
      const os = makeOS();
      adicionarServico(os);
      const item = os.itensOrcamento[0];
      // OS está em EM_DIAGNOSTICO
      expect(() =>
        os.registrarPontoExecucao(item.id.toValue(), new UniqueID().toValue()),
      ).toThrow(DomainError);
    });
  });

  describe('eventos de transição', () => {
    it('dispara DiagnosticoConcluido e OrcamentoEnviado ao avançar para AGUARDANDO_APROVACAO', () => {
      const os = makeOS();
      adicionarServico(os);
      os.clearEvents();
      os.avancarStatus();
      const names = os.domainEvents.map((e) => e.constructor.name);
      expect(names).toContain('DiagnosticoConcluido');
      expect(names).toContain('OrcamentoEnviado');
    });

    it('dispara OSFinalizada ao auto-transicionar para FINALIZADA', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      const mec = new UniqueID().toValue();
      os.registrarPontoExecucao(item.id.toValue(), mec);
      os.clearEvents();
      os.registrarPontoExecucao(item.id.toValue(), mec);
      const names = os.domainEvents.map((e) => e.constructor.name);
      expect(names).toContain('OSFinalizada');
    });

    it('dispara OSEntregue ao avançar para ENTREGUE', () => {
      const os = makeOSAprovada();
      const item = os.itensOrcamento[0];
      const mec = new UniqueID().toValue();
      os.registrarPontoExecucao(item.id.toValue(), mec);
      os.registrarPontoExecucao(item.id.toValue(), mec);
      os.clearEvents();
      os.avancarStatus();
      const names = os.domainEvents.map((e) => e.constructor.name);
      expect(names).toContain('OSEntregue');
    });

    it('dispara OrcamentoAprovado ao aprovar', () => {
      const os = makeOS();
      adicionarServico(os);
      os.avancarStatus();
      os.clearEvents();
      os.aprovarOrcamento();
      const names = os.domainEvents.map((e) => e.constructor.name);
      expect(names).toContain('OrcamentoAprovado');
    });

    it('dispara OrcamentoRecusado ao reprovar', () => {
      const os = makeOS();
      adicionarServico(os);
      os.avancarStatus();
      os.clearEvents();
      os.recusarOrcamento('TOTAL');
      const names = os.domainEvents.map((e) => e.constructor.name);
      expect(names).toContain('OrcamentoRecusado');
    });
  });
});
