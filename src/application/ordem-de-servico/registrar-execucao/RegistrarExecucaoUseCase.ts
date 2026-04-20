import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ExecucaoDeServico } from '../../../domain/ordem-de-servico/entities/ExecucaoDeServico';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import {
  BaixaEstoqueService,
  ItemBaixa,
} from '../../../domain/peca-insumo/services/BaixaEstoqueService';
import { IPecaInsumoRepository } from '../../../domain/peca-insumo/repositories/IPecaInsumoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

interface PecaUtilizadaInput {
  pecaInsumoId: string;
  quantidade: number;
}

export interface RegistrarExecucaoInput {
  ordemDeServicoId: string;
  servicoId: string;
  mecanicoId: string;
  inicio: Date;
  fim?: Date;
  observacoes?: string;
  pecasUtilizadas?: PecaUtilizadaInput[];
}

@Injectable()
export class RegistrarExecucaoUseCase {
  private readonly baixaEstoqueService = new BaixaEstoqueService();

  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.PECA_INSUMO_REPOSITORY)
    private readonly pecaRepository: IPecaInsumoRepository,
  ) {}

  async execute(input: RegistrarExecucaoInput): Promise<OrdemDeServico> {
    const os = await this.osRepository.buscarPorId(new UniqueID(input.ordemDeServicoId));
    if (!os) throw new NotFoundException('OS não encontrada');

    const execucao = ExecucaoDeServico.criar({
      servicoId: input.servicoId,
      mecanicoId: input.mecanicoId,
      inicio: input.inicio,
      fim: input.fim,
      observacoes: input.observacoes,
      pecasUtilizadas: input.pecasUtilizadas,
    });

    if (input.pecasUtilizadas && input.pecasUtilizadas.length > 0) {
      const itensBaixa: ItemBaixa[] = [];
      for (const p of input.pecasUtilizadas) {
        const peca = await this.pecaRepository.buscarPorId(new UniqueID(p.pecaInsumoId));
        if (!peca) {
          throw new NotFoundException(`Peça/insumo ${p.pecaInsumoId} não encontrada`);
        }
        itensBaixa.push({ peca, quantidade: p.quantidade });
      }
      this.baixaEstoqueService.executar(itensBaixa);
      for (const item of itensBaixa) {
        await this.pecaRepository.salvar(item.peca);
      }
    }

    os.registrarExecucao(execucao);
    await this.osRepository.salvar(os);
    return os;
  }
}
