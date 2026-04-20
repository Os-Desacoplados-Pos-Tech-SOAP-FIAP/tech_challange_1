import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { NovaPecaInsumoInput, PecaInsumo } from '../../../domain/peca-insumo/entities/PecaInsumo';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';

@Injectable()
export class CadastrarPecaUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PECA_INSUMO_REPOSITORY)
    private readonly pecaRepository: IPecaInsumoRepository,
  ) {}

  async execute(input: NovaPecaInsumoInput): Promise<PecaInsumo> {
    const peca = PecaInsumo.criar(input);
    const existente = await this.pecaRepository.buscarPorCodigo(peca.codigo.value);
    if (existente) {
      throw new ConflictException('Já existe peça/insumo com este código');
    }
    await this.pecaRepository.salvar(peca);
    return peca;
  }
}
