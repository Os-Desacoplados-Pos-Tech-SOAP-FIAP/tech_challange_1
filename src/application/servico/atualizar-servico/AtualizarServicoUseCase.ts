import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { Servico } from '../../../domain/servico/entities/Servico';
import { IServicoRepository } from '../../../domain/servico/repositories/IServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface AtualizarServicoInput {
  id: string;
  nome?: string;
  descricao?: string;
  valorPadrao?: number;
  ativo?: boolean;
}

@Injectable()
export class AtualizarServicoUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.SERVICO_REPOSITORY)
    private readonly servicoRepository: IServicoRepository,
  ) {}

  async execute(input: AtualizarServicoInput): Promise<Servico> {
    const servico = await this.servicoRepository.buscarPorId(new UniqueID(input.id));
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    servico.atualizar(input);
    await this.servicoRepository.salvar(servico);
    return servico;
  }
}
