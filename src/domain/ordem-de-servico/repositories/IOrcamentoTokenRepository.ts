export interface OrcamentoTokenRecord {
  id: string;
  ordemDeServicoId: string;
  token: string;
  usado: boolean;
  criadoEm: Date;
  usadoEm: Date | null;
}

export interface IOrcamentoTokenRepository {
  criar(ordemDeServicoId: string, token: string): Promise<OrcamentoTokenRecord>;
  buscarPorToken(token: string): Promise<OrcamentoTokenRecord | null>;
  marcarComoUsado(id: string): Promise<void>;
}
