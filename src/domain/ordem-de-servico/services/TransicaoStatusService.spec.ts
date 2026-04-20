import { DomainError } from '../../shared/DomainError';
import { StatusOS, StatusOSEnum } from '../value-objects/StatusOS';
import { TransicaoStatusService } from './TransicaoStatusService';

describe('TransicaoStatusService', () => {
  const service = new TransicaoStatusService();

  it('transiciona RECEBIDA → EM_DIAGNOSTICO', () => {
    const status = StatusOS.create(StatusOSEnum.RECEBIDA);
    const novo = service.transicionar(status, StatusOSEnum.EM_DIAGNOSTICO);
    expect(novo.value).toBe(StatusOSEnum.EM_DIAGNOSTICO);
  });

  it('pode verificar transição válida', () => {
    const status = StatusOS.create(StatusOSEnum.RECEBIDA);
    expect(service.pode(status, StatusOSEnum.EM_DIAGNOSTICO)).toBe(true);
  });

  it('pode verificar transição inválida', () => {
    const status = StatusOS.create(StatusOSEnum.RECEBIDA);
    expect(service.pode(status, StatusOSEnum.ENTREGUE)).toBe(false);
  });

  it('lança DomainError em transição inválida', () => {
    const status = StatusOS.create(StatusOSEnum.ENTREGUE);
    expect(() => service.transicionar(status, StatusOSEnum.RECEBIDA)).toThrow(DomainError);
  });
});
