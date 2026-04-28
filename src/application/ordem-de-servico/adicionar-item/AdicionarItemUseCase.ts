import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKENS } from '../../../common/constants/injection-tokens';
import { ensureFound } from '../../../common/utils/ensure-found';
import { EstoqueReservado } from '../../../domain/insumo/events/EstoqueReservado';
import { IInsumoRepository } from '../../../domain/insumo/repositories/IInsumoRepository';
import { TipoItemOrcamento } from '../../../domain/ordem-de-servico/entities/ItemOrcamento';
import { OrdemDeServico } from '../../../domain/ordem-de-servico/entities/OrdemDeServico';
import { IOrdemDeServicoRepository } from '../../../domain/ordem-de-servico/repositories/IOrdemDeServicoRepository';
import { IServicoRepository } from '../../../domain/servico/repositories/IServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';

export type AdicionarItemInput =
  | {
      ordemDeServicoId: string;
      tipo: 'SERVICO';
      servicoId: string;
      quantidade: number;
    }
  | {
      ordemDeServicoId: string;
      tipo: 'INSUMO';
      insumoId: string;
      quantidade: number;
    };

@Injectable()
export class AdicionarItemUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ORDEM_DE_SERVICO_REPOSITORY)
    private readonly osRepository: IOrdemDeServicoRepository,
    @Inject(INJECTION_TOKENS.INSUMO_REPOSITORY)
    private readonly insumoRepository: IInsumoRepository,
    @Inject(INJECTION_TOKENS.SERVICO_REPOSITORY)
    private readonly servicoRepository: IServicoRepository,
  ) {}

  async execute(input: AdicionarItemInput): Promise<OrdemDeServico> {
    const os = ensureFound(
      await this.osRepository.buscarPorId(new UniqueID(input.ordemDeServicoId)),
      'OS',
    );

    if (input.tipo === 'SERVICO') {
      const servico = ensureFound(
        await this.servicoRepository.buscarPorId(new UniqueID(input.servicoId)),
        'Serviço',
      );
      os.adicionarItem({
        tipo: TipoItemOrcamento.SERVICO,
        referenciaId: servico.id.toValue(),
        descricao: servico.nome,
        quantidade: input.quantidade,
        valorUnitario: servico.valorPadrao.value,
      });
      await this.osRepository.salvar(os);
      return os;
    }

    const insumo = ensureFound(
      await this.insumoRepository.buscarPorId(new UniqueID(input.insumoId)),
      'Insumo',
    );
    insumo.reservar(input.quantidade);
    insumo.addDomainEvent(new EstoqueReservado(insumo.id, input.quantidade));
    os.adicionarItem({
      tipo: TipoItemOrcamento.INSUMO,
      referenciaId: insumo.id.toValue(),
      descricao: insumo.nome,
      quantidade: input.quantidade,
      valorUnitario: insumo.valorUnitario.value,
    });
    await this.insumoRepository.salvar(insumo);
    await this.osRepository.salvar(os);
    return os;
  }
}
