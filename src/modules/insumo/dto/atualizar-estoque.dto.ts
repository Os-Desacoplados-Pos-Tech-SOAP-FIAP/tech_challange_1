import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AtualizarEstoqueDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(0)
  quantidade!: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimo?: number;
}
