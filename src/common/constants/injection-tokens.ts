export const INJECTION_TOKENS = {
  CLIENTE_REPOSITORY: Symbol('IClienteRepository'),
  VEICULO_REPOSITORY: Symbol('IVeiculoRepository'),
  ORDEM_DE_SERVICO_REPOSITORY: Symbol('IOrdemDeServicoRepository'),
  SERVICO_REPOSITORY: Symbol('IServicoRepository'),
  PECA_INSUMO_REPOSITORY: Symbol('IPecaInsumoRepository'),
  HASH_PROVIDER: Symbol('IHashProvider'),
} as const;
