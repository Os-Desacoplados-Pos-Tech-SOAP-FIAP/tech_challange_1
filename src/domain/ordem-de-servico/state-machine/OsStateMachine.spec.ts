import { DomainError } from '../../shared/DomainError';
import { StatusOSEnum } from '../value-objects/StatusOS';
import { OsStateMachine } from './OsStateMachine';

describe('OsStateMachine', () => {
  describe('canTransition', () => {
    it('aceita transições conhecidas', () => {
      expect(
        OsStateMachine.canTransition(StatusOSEnum.RECEBIDA, StatusOSEnum.EM_DIAGNOSTICO),
      ).toBe(true);
      expect(
        OsStateMachine.canTransition(StatusOSEnum.APROVADA, StatusOSEnum.EM_EXECUCAO),
      ).toBe(true);
      expect(
        OsStateMachine.canTransition(StatusOSEnum.FINALIZADA, StatusOSEnum.ENTREGUE),
      ).toBe(true);
    });

    it('rejeita transições inválidas', () => {
      expect(
        OsStateMachine.canTransition(StatusOSEnum.RECEBIDA, StatusOSEnum.EM_EXECUCAO),
      ).toBe(false);
      expect(
        OsStateMachine.canTransition(StatusOSEnum.ENTREGUE, StatusOSEnum.EM_DIAGNOSTICO),
      ).toBe(false);
      expect(
        OsStateMachine.canTransition(StatusOSEnum.REPROVADA, StatusOSEnum.APROVADA),
      ).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('lança DomainError em transição inválida', () => {
      expect(() =>
        OsStateMachine.assertTransition(StatusOSEnum.RECEBIDA, StatusOSEnum.EM_EXECUCAO),
      ).toThrow(DomainError);
    });

    it('passa em transição válida', () => {
      expect(() =>
        OsStateMachine.assertTransition(StatusOSEnum.APROVADA, StatusOSEnum.EM_EXECUCAO),
      ).not.toThrow();
    });
  });

  describe('transitionsFrom', () => {
    it('lista transições de AGUARDANDO_APROVACAO (aprovada ou reprovada)', () => {
      const t = OsStateMachine.transitionsFrom(StatusOSEnum.AGUARDANDO_APROVACAO);
      expect(t.map((x) => x.to).sort()).toEqual(
        [StatusOSEnum.APROVADA, StatusOSEnum.REPROVADA].sort(),
      );
    });

    it('ENTREGUE e REPROVADA são terminais', () => {
      expect(OsStateMachine.transitionsFrom(StatusOSEnum.ENTREGUE)).toEqual([]);
      expect(OsStateMachine.transitionsFrom(StatusOSEnum.REPROVADA)).toEqual([]);
    });
  });
});
