import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export interface IHashProvider {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

@Injectable()
export class BcryptHashProvider implements IHashProvider {
  private readonly saltRounds = 12;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
