import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { IServicoRepository } from '../../../domain/servico/repositories/IServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

@Injectable()
export class RemoverServicoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.SERVICO_REPOSITORY)
    private readonly servicoRepository: IServicoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const servico = await this.servicoRepository.buscarPorId(new UniqueID(id));
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    await this.servicoRepository.remover(new UniqueID(id));
  }
}
