import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilAcesso } from '@prisma/client';

import { LoginUseCase } from '../../application/auth/login/LoginUseCase';
import { RegistrarUsuarioUseCase } from '../../application/auth/registrar-usuario/RegistrarUsuarioUseCase';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthResponses,
  ApiValidationResponses,
} from '../../common/decorators/swagger';
import { UsuarioAutenticado } from '../../infrastructure/auth/jwt.strategy';
import { LoginResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registrarUsuarioUseCase: RegistrarUsuarioUseCase,
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

  @Roles(PerfilAcesso.ADMINISTRADOR)
  @Post('registrar')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registra um novo usuário',
    description: 'Requer JWT válido com perfil ADMINISTRADOR.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiAuthResponses()
  @ApiValidationResponses()
  async registrar(@Body() dto: RegistrarUsuarioDto, @CurrentUser() user?: UsuarioAutenticado) {
    return this.registrarUsuarioUseCase.execute({
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      perfil: dto.perfil,
      solicitantePerfil: user?.perfil,
    });
  }
}
