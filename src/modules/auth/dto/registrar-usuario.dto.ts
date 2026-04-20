import { ApiProperty } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class RegistrarUsuarioDto {
  @ApiProperty({ example: 'Maria Atendente' })
  @IsString()
  @MinLength(3)
  nome!: string;

  @ApiProperty({ example: 'maria@oficina.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  @MinLength(6)
  senha!: string;

  @ApiProperty({ enum: PerfilAcesso, example: PerfilAcesso.ATENDENTE })
  @IsEnum(PerfilAcesso)
  perfil!: PerfilAcesso;
}
