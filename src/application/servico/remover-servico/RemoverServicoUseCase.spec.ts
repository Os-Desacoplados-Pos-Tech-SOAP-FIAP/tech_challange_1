import { NotFoundException } from '@nestjs/common';

import { Servico } from '../../../domain/servico/entities/Servico';
import { IServicoRepository } from '../../../domain/servico/repositories/IServicoRepository';
import { UniqueID } from '../../../domain/shared/UniqueID';
import { RemoverServicoUseCase } from './RemoverServicoUseCase';

class InMemoryServicoRepository implements IServicoRepository {
  public servicos: Servico[] = [];
  async salvar(s: Servico) { this.servicos.push(s); }
  async buscarPorId(id: UniqueID) { return this.servicos.find(s => s.id.equals(id)) ?? null; }
  async listar() { return this.servicos; }
  async remover(id: UniqueID) { this.servicos = this.servicos.filter(s => !s.id.equals(id)); }
}

describe('RemoverServicoUseCase', () => {
  let repo: InMemoryServicoRepository;
  let useCase: RemoverServicoUseCase;
  let servico: Servico;

  beforeEach(() => {
    repo = new InMemoryServicoRepository();
    useCase = new RemoverServicoUseCase(repo);
    servico = Servico.criar({ nome: 'Troca de Óleo', descricao: 'Desc', valorPadrao: 100 });
    repo.servicos.push(servico);
  });

  it('remove serviço existente', async () => {
    await useCase.execute(servico.id.toValue());
    expect(repo.servicos).toHaveLength(0);
  });

  it('lança NotFoundException para serviço inexistente', async () => {
    await expect(useCase.execute(new UniqueID().toValue())).rejects.toBeInstanceOf(NotFoundException);
  });
});
