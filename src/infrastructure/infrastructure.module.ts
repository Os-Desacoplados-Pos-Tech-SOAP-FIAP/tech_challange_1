import { Global, Module } from '@nestjs/common';

import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { BcryptHashProvider } from './auth/hash.provider';
import { PrismaService } from './database/prisma/prisma.service';
import { PrismaClienteRepository } from './repositories/PrismaClienteRepository';
import { PrismaOrdemDeServicoRepository } from './repositories/PrismaOrdemDeServicoRepository';
import { PrismaPecaInsumoRepository } from './repositories/PrismaPecaInsumoRepository';
import { PrismaServicoRepository } from './repositories/PrismaServicoRepository';
import { PrismaVeiculoRepository } from './repositories/PrismaVeiculoRepository';

const repositoryProviders = [
  {
    provide: INJECTION_TOKENS.CLIENTE_REPOSITORY,
    useClass: PrismaClienteRepository,
  },
  {
    provide: INJECTION_TOKENS.VEICULO_REPOSITORY,
    useClass: PrismaVeiculoRepository,
  },
  {
    provide: INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY,
    useClass: PrismaOrdemDeServicoRepository,
  },
  {
    provide: INJECTION_TOKENS.SERVICO_REPOSITORY,
    useClass: PrismaServicoRepository,
  },
  {
    provide: INJECTION_TOKENS.PECA_INSUMO_REPOSITORY,
    useClass: PrismaPecaInsumoRepository,
  },
  {
    provide: INJECTION_TOKENS.HASH_PROVIDER,
    useClass: BcryptHashProvider,
  },
];

@Global()
@Module({
  providers: [PrismaService, ...repositoryProviders],
  exports: [PrismaService, ...repositoryProviders.map((p) => p.provide)],
})
export class InfrastructureModule {}
