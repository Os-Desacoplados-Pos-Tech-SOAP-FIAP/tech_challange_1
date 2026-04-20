import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class RecusarOrcamentoDto {
  @ApiProperty({ enum: ['TOTAL', 'PARCIAL'] })
  @IsIn(['TOTAL', 'PARCIAL'])
  motivo!: 'TOTAL' | 'PARCIAL';
}
