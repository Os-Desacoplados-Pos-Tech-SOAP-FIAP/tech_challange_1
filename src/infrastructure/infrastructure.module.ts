import { Global, Module } from '@nestjs/common';

import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { BcryptHashProvider } from './auth/hash.provider';
import { PrismaService } from './database/prisma/prisma.service';
import { ConsoleEmailProvider } from './email/EmailProvider';
import { PrismaClienteRepository } from './repositories/PrismaClienteRepository';
import { PrismaInsumoRepository } from './repositories/PrismaInsumoRepository';
import { PrismaOrcamentoTokenRepository } from './repositories/PrismaOrcamentoTokenRepository';
import { PrismaOrdemDeServicoRepository } from './repositories/PrismaOrdemDeServicoRepository';
import { PrismaServicoRepository } from './repositories/PrismaServicoRepository';
import { PrismaVeiculoRepository } from './repositories/PrismaVeiculoRepository';

const repositoryProviders = [
  { provide: INJECTION_TOKENS.CLIENTE_REPOSITORY, useClass: PrismaClienteRepository },
  { provide: INJECTION_TOKENS.VEICULO_REPOSITORY, useClass: PrismaVeiculoRepository },
  {
    provide: INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY,
    useClass: PrismaOrdemDeServicoRepository,
  },
  { provide: INJECTION_TOKENS.SERVICO_REPOSITORY, useClass: PrismaServicoRepository },
  { provide: INJECTION_TOKENS.INSUMO_REPOSITORY, useClass: PrismaInsumoRepository },
  {
    provide: INJECTION_TOKENS.ORCAMENTO_TOKEN_REPOSITORY,
    useClass: PrismaOrcamentoTokenRepository,
  },
  { provide: INJECTION_TOKENS.HASH_PROVIDER, useClass: BcryptHashProvider },
  { provide: INJECTION_TOKENS.EMAIL_PROVIDER, useClass: ConsoleEmailProvider },
];

@Global()
@Module({
  providers: [PrismaService, ...repositoryProviders],
  exports: [PrismaService, ...repositoryProviders.map((p) => p.provide)],
})
export class InfrastructureModule {}
