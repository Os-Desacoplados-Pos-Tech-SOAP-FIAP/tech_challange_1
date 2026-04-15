import { ApiProperty } from '@nestjs/swagger';

import { PecaInsumo, TipoPecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';

export class PecaResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() codigo!: string;
  @ApiProperty() nome!: string;
  @ApiProperty({ enum: TipoPecaInsumo }) tipo!: TipoPecaInsumo;
  @ApiProperty() valorUnitario!: number;
  @ApiProperty() quantidadeEstoque!: number;
  @ApiProperty() estoqueMinimo!: number;
  @ApiProperty() abaixoDoMinimo!: boolean;
  @ApiProperty() criadoEm!: Date;
  @ApiProperty() atualizadoEm!: Date;

  static fromDomain(p: PecaInsumo): PecaResponseDto {
    return {
      id: p.id.toValue(),
      codigo: p.codigo.value,
      nome: p.nome,
      tipo: p.tipo,
      valorUnitario: p.valorUnitario.value,
      quantidadeEstoque: p.estoque.quantidade,
      estoqueMinimo: p.estoque.minimo,
      abaixoDoMinimo: p.estoque.abaixoDoMinimo(),
      criadoEm: p.criadoEm,
      atualizadoEm: p.atualizadoEm,
    };
  }
}
