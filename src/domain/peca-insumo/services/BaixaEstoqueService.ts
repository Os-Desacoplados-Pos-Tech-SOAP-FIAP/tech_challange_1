import { DomainError } from '../../shared/DomainError';
import { PecaInsumo } from '../entities/PecaInsumo';

export interface ItemBaixa {
  peca: PecaInsumo;
  quantidade: number;
}

export class BaixaEstoqueService {
  public executar(itens: ItemBaixa[]): void {
    if (!itens.length) {
      throw new DomainError('Nenhum item informado para baixa de estoque', 'BAIXA_VAZIA');
    }
    for (const item of itens) {
      item.peca.baixarEstoque(item.quantidade);
    }
  }
}
