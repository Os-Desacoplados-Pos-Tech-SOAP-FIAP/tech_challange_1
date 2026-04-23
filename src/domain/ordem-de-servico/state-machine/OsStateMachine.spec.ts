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
        OsStateMachine.canTransition(StatusOSEnum.CANCELADA, StatusOSEnum.RECEBIDA),
      ).toBe(false);
    });
  });

  describe('allowsRole', () => {
    it('só CLIENTE aprova/reprova orçamento', () => {
      expect(
        OsStateMachine.allowsRole(
          StatusOSEnum.AGUARDANDO_APROVACAO,
          StatusOSEnum.APROVADA,
          'CLIENTE',
        ),
      ).toBe(true);
      expect(
        OsStateMachine.allowsRole(
          StatusOSEnum.AGUARDANDO_APROVACAO,
          StatusOSEnum.APROVADA,
          'ATENDENTE',
        ),
      ).toBe(false);
      expect(
        OsStateMachine.allowsRole(
          StatusOSEnum.AGUARDANDO_APROVACAO,
          StatusOSEnum.REPROVADA,
          'MECANICO',
        ),
      ).toBe(false);
    });

    it('só MECANICO envia diagnóstico para aprovação', () => {
      expect(
        OsStateMachine.allowsRole(
          StatusOSEnum.EM_DIAGNOSTICO,
          StatusOSEnum.AGUARDANDO_APROVACAO,
          'MECANICO',
        ),
      ).toBe(true);
      expect(
        OsStateMachine.allowsRole(
          StatusOSEnum.EM_DIAGNOSTICO,
          StatusOSEnum.AGUARDANDO_APROVACAO,
          'ATENDENTE',
        ),
      ).toBe(false);
    });

    it('ATENDENTE ou ADMINISTRADOR entrega OS finalizada', () => {
      expect(
        OsStateMachine.allowsRole(StatusOSEnum.FINALIZADA, StatusOSEnum.ENTREGUE, 'ATENDENTE'),
      ).toBe(true);
      expect(
        OsStateMachine.allowsRole(StatusOSEnum.FINALIZADA, StatusOSEnum.ENTREGUE, 'ADMINISTRADOR'),
      ).toBe(true);
      expect(
        OsStateMachine.allowsRole(StatusOSEnum.FINALIZADA, StatusOSEnum.ENTREGUE, 'MECANICO'),
      ).toBe(false);
    });
  });

  describe('assertTransition / assertRoleAllowed', () => {
    it('lança DomainError em transição inválida', () => {
      expect(() =>
        OsStateMachine.assertTransition(StatusOSEnum.RECEBIDA, StatusOSEnum.EM_EXECUCAO),
      ).toThrow(DomainError);
    });

    it('lança DomainError em perfil não autorizado', () => {
      expect(() =>
        OsStateMachine.assertRoleAllowed(
          StatusOSEnum.AGUARDANDO_APROVACAO,
          StatusOSEnum.APROVADA,
          'MECANICO',
        ),
      ).toThrow(DomainError);
    });

    it('aceita perfil autorizado', () => {
      expect(() =>
        OsStateMachine.assertRoleAllowed(
          StatusOSEnum.AGUARDANDO_APROVACAO,
          StatusOSEnum.APROVADA,
          'CLIENTE',
        ),
      ).not.toThrow();
    });
  });

  describe('transitionsFrom', () => {
    it('lista transições de um estado', () => {
      const t = OsStateMachine.transitionsFrom(StatusOSEnum.AGUARDANDO_APROVACAO);
      expect(t.map((x) => x.to).sort()).toEqual(
        [StatusOSEnum.APROVADA, StatusOSEnum.CANCELADA, StatusOSEnum.REPROVADA].sort(),
      );
    });

    it('ENTREGUE e CANCELADA são terminais', () => {
      expect(OsStateMachine.transitionsFrom(StatusOSEnum.ENTREGUE)).toEqual([]);
      expect(OsStateMachine.transitionsFrom(StatusOSEnum.CANCELADA)).toEqual([]);
    });
  });
});
