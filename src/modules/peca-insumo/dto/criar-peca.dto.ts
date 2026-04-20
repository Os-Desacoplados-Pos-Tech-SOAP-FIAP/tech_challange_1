import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

import { TipoPecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';

export class CriarPecaDto {
  @ApiProperty({ example: 'PEC-001' })
  @IsString()
  @MinLength(2)
  codigo!: string;

  @ApiProperty({ example: 'Filtro de óleo' })
  @IsString()
  @MinLength(2)
  nome!: string;

  @ApiProperty({ enum: TipoPecaInsumo, example: TipoPecaInsumo.PECA })
  @IsEnum(TipoPecaInsumo)
  tipo!: TipoPecaInsumo;

  @ApiProperty({ example: 35.9 })
  @IsNumber()
  @Min(0)
  valorUnitario!: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  quantidadeEstoque!: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  estoqueMinimo!: number;
}
