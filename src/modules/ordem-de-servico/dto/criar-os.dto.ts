import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarOSDto {
  @ApiProperty({ description: 'ID do cliente dono do veículo' })
  @IsUUID()
  clienteId!: string;

  @ApiProperty({ description: 'ID do veículo; deve pertencer ao cliente informado' })
  @IsUUID()
  veiculoId!: string;

  @ApiProperty({ required: false, description: 'Observações livres sobre o atendimento' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
