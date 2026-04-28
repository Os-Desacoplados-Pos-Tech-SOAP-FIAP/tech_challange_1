export const INJECTION_TOKENS = {
  CLIENTE_REPOSITORY: Symbol('IClienteRepository'),
  VEICULO_REPOSITORY: Symbol('IVeiculoRepository'),
  ORDEM_DE_SERVICO_REPOSITORY: Symbol('IOrdemDeServicoRepository'),
  SERVICO_REPOSITORY: Symbol('IServicoRepository'),
  INSUMO_REPOSITORY: Symbol('IInsumoRepository'),
  ORCAMENTO_TOKEN_REPOSITORY: Symbol('IOrcamentoTokenRepository'),
  HASH_PROVIDER: Symbol('IHashProvider'),
  EMAIL_PROVIDER: Symbol('IEmailProvider'),
} as const;
