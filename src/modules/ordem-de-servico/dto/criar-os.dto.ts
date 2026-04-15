import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { TipoItemOrcamento } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';

export class ItemOrcamentoDto {
  @ApiProperty({ enum: TipoItemOrcamento })
  @IsEnum(TipoItemOrcamento)
  tipo!: TipoItemOrcamento;

  @ApiProperty()
  @IsUUID()
  referenciaId!: string;

  @ApiProperty()
  @IsString()
  descricao!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantidade!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorUnitario!: number;
}

export class CriarOSDto {
  @ApiProperty()
  @IsUUID()
  clienteId!: string;

  @ApiProperty()
  @IsUUID()
  veiculoId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ type: [ItemOrcamentoDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrcamentoDto)
  itensIniciais?: ItemOrcamentoDto[];
}
