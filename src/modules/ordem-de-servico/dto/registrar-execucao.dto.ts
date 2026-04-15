import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PecaUtilizadaDto {
  @ApiProperty()
  @IsUUID()
  pecaInsumoId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantidade!: number;
}

export class RegistrarExecucaoDto {
  @ApiProperty()
  @IsUUID()
  servicoId!: string;

  @ApiProperty()
  @IsUUID()
  mecanicoId!: string;

  @ApiProperty({ example: '2026-04-15T08:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  inicio!: Date;

  @ApiProperty({ required: false, example: '2026-04-15T09:30:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fim?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ type: [PecaUtilizadaDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PecaUtilizadaDto)
  pecasUtilizadas?: PecaUtilizadaDto[];
}
