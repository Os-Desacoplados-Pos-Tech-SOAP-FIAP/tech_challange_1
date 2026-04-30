import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';
import type { Request } from 'express';

import { LoginUseCase } from '../../application/auth/login/LoginUseCase';
import { RegistrarUsuarioUseCase } from '../../application/auth/registrar-usuario/RegistrarUsuarioUseCase';
import { Public } from '../../common/decorators/public.decorator';
import {
  ApiAuthResponses,
  ApiValidationResponses,
} from '../../common/decorators/swagger';
import { JwtPayload } from '../../infrastructure/auth/jwt.strategy';
import { LoginResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registrarUsuarioUseCase: RegistrarUsuarioUseCase,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Autentica usuário e retorna token JWT',
    description: 'Valida credenciais (email/senha) e devolve o token de acesso.',
  })
  @ApiResponse({ status: 200, description: 'Token JWT retornado com sucesso', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou usuário inativo' })
  @ApiValidationResponses()
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto.email, dto.senha);
  }

  @Public()
  @Post('registrar')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registra um novo usuário',
    description:
      'Permite o cadastro do primeiro usuário sem autenticação. Após o primeiro, requer JWT válido com perfil ADMINISTRADOR.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async registrar(@Body() dto: RegistrarUsuarioDto, @Req() req: Request) {
    let solicitantePerfil: PerfilAcesso | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(authHeader.slice(7));
        solicitantePerfil = payload.perfil;
      } catch {
        throw new UnauthorizedException('Token inválido');
      }
    }

    return this.registrarUsuarioUseCase.execute({
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      perfil: dto.perfil,
      solicitantePerfil,
    });
  }
}
