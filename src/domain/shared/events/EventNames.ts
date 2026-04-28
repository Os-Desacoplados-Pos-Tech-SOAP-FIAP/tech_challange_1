export const EVENTS = {
  CLIENTE_CADASTRADO: Symbol.for('cliente.cadastrado'),
  VEICULO_CADASTRADO: Symbol.for('veiculo.cadastrado'),

  OS_CRIADA: Symbol.for('os.criada'),
  OS_DIAGNOSTICO_CONCLUIDO: Symbol.for('os.diagnostico_concluido'),
  OS_ORCAMENTO_ENVIADO: Symbol.for('os.orcamento_enviado'),
  OS_ORCAMENTO_APROVADO: Symbol.for('os.orcamento_aprovado'),
  OS_ORCAMENTO_RECUSADO: Symbol.for('os.orcamento_recusado'),
  OS_FINALIZADA: Symbol.for('os.finalizada'),
  OS_ENTREGUE: Symbol.for('os.entregue'),
  OS_SERVICO_EXECUTADO: Symbol.for('os.servico_executado'),

  ESTOQUE_BAIXADO: Symbol.for('estoque.baixado'),
  ESTOQUE_RESERVADO: Symbol.for('estoque.reservado'),
  ESTOQUE_RESERVA_LIBERADA: Symbol.for('estoque.reserva_liberada'),
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
