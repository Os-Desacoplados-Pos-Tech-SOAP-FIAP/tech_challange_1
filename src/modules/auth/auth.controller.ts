import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { LoginUseCase } from '../../application/auth/login/LoginUseCase';
import { RegistrarUsuarioUseCase } from '../../application/auth/registrar-usuario/RegistrarUsuarioUseCase';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
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
  @ApiOperation({ summary: 'Autentica usuário e retorna token JWT' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto.email, dto.senha);
  }

  @Public()
  @Post('registrar')
  @ApiOperation({
    summary:
      'Registra usuário. Primeiro usuário é público; demais exigem JWT válido com perfil ADMINISTRADOR',
  })
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
