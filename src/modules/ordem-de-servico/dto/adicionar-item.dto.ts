import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AdicionarItemDto {
  @ApiProperty({ enum: ['SERVICO', 'INSUMO'] })
  @IsIn(['SERVICO', 'INSUMO'])
  tipo!: 'SERVICO' | 'INSUMO';

  @ApiProperty({ required: false, description: 'Obrigatório quando tipo = SERVICO' })
  @IsOptional()
  @IsUUID()
  servicoId?: string;

  @ApiProperty({ required: false, description: 'Obrigatório quando tipo = INSUMO' })
  @IsOptional()
  @IsUUID()
  insumoId?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade!: number;
}
