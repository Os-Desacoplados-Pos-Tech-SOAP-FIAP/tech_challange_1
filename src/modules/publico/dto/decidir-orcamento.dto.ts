import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class DecidirOrcamentoDto {
  @ApiProperty({ description: 'Token recebido no email' })
  @IsString()
  @MinLength(8)
  token!: string;

  @ApiProperty({ enum: ['APROVADA', 'REPROVADA'] })
  @IsIn(['APROVADA', 'REPROVADA'])
  decisao!: 'APROVADA' | 'REPROVADA';
}
