import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

import { TipoCliente } from '../../../domain/cliente/entities/Cliente';

export class CriarClienteDto {
  @ApiProperty({ enum: TipoCliente, example: TipoCliente.PF })
  @IsEnum(TipoCliente)
  tipo!: TipoCliente;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty()
  cpfCnpj!: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(3)
  nome!: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '(31) 99999-0000', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;
}
