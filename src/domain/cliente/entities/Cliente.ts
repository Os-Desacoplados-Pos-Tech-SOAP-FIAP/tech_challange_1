import { AggregateRoot } from '../../shared/AggregateRoot';
import { DomainError } from '../../shared/DomainError';
import { EntityProps } from '../../shared/Entity';
import { UniqueID } from '../../shared/UniqueID';
import { ClienteCadastrado } from '../events/ClienteCadastrado';
import { CNPJ } from '../value-objects/CNPJ';
import { CPF } from '../value-objects/CPF';
import { Email } from '../value-objects/Email';
import { Telefone } from '../value-objects/Telefone';

export enum TipoCliente {
  PF = 'PF',
  PJ = 'PJ',
}

export interface ClienteProps extends EntityProps {
  tipo: TipoCliente;
  cpfCnpj: CPF | CNPJ;
  nome: string;
  email: Email;
  telefone?: Telefone;
}

export interface NovoClienteInput {
  tipo: TipoCliente;
  cpfCnpj: string;
  nome: string;
  email: string;
  telefone?: string;
}

export class Cliente extends AggregateRoot<ClienteProps> {
  private constructor(props: ClienteProps, id?: UniqueID) {
    super(props, id);
  }

  public static criar(input: NovoClienteInput): Cliente {
    if (!input.nome || input.nome.trim().length < 3) {
      throw new DomainError('Nome do cliente deve ter ao menos 3 caracteres', 'NOME_INVALIDO');
    }
    const cpfCnpj =
      input.tipo === TipoCliente.PF ? CPF.create(input.cpfCnpj) : CNPJ.create(input.cpfCnpj);
    const email = Email.create(input.email);
    const telefone = input.telefone ? Telefone.create(input.telefone) : undefined;

    const cliente = new Cliente({
      tipo: input.tipo,
      cpfCnpj,
      nome: input.nome.trim(),
      email,
      telefone,
    });

    cliente.addDomainEvent(new ClienteCadastrado(cliente.id));
    return cliente;
  }

  public static restaurar(props: ClienteProps, id: UniqueID): Cliente {
    return new Cliente(props, id);
  }

  public get tipo(): TipoCliente {
    return this.props.tipo;
  }

  public get cpfCnpj(): CPF | CNPJ {
    return this.props.cpfCnpj;
  }

  public get nome(): string {
    return this.props.nome;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get telefone(): Telefone | undefined {
    return this.props.telefone;
  }

  public atualizar(input: Partial<Pick<NovoClienteInput, 'nome' | 'email' | 'telefone'>>): void {
    if (input.nome !== undefined) {
      if (input.nome.trim().length < 3) {
        throw new DomainError('Nome do cliente deve ter ao menos 3 caracteres', 'NOME_INVALIDO');
      }
      this.props.nome = input.nome.trim();
    }
    if (input.email !== undefined) {
      this.props.email = Email.create(input.email);
    }
    if (input.telefone !== undefined) {
      this.props.telefone = input.telefone ? Telefone.create(input.telefone) : undefined;
    }
    this.touch();
  }
}
