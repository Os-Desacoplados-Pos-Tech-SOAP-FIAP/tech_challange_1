import { DomainError } from '../../shared/DomainError';
import { StatusOS, StatusOSEnum } from './StatusOS';

describe('StatusOS', () => {
  it('estado inicial é RECEBIDA', () => {
    const status = StatusOS.inicial();
    expect(status.value).toBe(StatusOSEnum.RECEBIDA);
  });

  it('permite transições válidas do fluxo completo', () => {
    let s = StatusOS.inicial();
    s = s.transicionar(StatusOSEnum.EM_DIAGNOSTICO);
    s = s.transicionar(StatusOSEnum.AGUARDANDO_APROVACAO);
    s = s.transicionar(StatusOSEnum.APROVADA);
    s = s.transicionar(StatusOSEnum.EM_EXECUCAO);
    s = s.transicionar(StatusOSEnum.FINALIZADA);
    s = s.transicionar(StatusOSEnum.ENTREGUE);
    expect(s.value).toBe(StatusOSEnum.ENTREGUE);
  });

  it('bloqueia transições inválidas', () => {
    const s = StatusOS.inicial();
    expect(() => s.transicionar(StatusOSEnum.EM_EXECUCAO)).toThrow(DomainError);
    expect(() => s.transicionar(StatusOSEnum.FINALIZADA)).toThrow(DomainError);
    expect(() => s.transicionar(StatusOSEnum.ENTREGUE)).toThrow(DomainError);
  });

  it('ENTREGUE é um estado terminal', () => {
    const s = StatusOS.create(StatusOSEnum.ENTREGUE);
    expect(s.podeTransicionarPara(StatusOSEnum.RECEBIDA)).toBe(false);
    expect(s.podeTransicionarPara(StatusOSEnum.EM_EXECUCAO)).toBe(false);
  });

  it('REPROVADA é um estado terminal', () => {
    const s = StatusOS.create(StatusOSEnum.REPROVADA);
    expect(s.podeTransicionarPara(StatusOSEnum.APROVADA)).toBe(false);
    expect(s.podeTransicionarPara(StatusOSEnum.EM_EXECUCAO)).toBe(false);
  });
});
