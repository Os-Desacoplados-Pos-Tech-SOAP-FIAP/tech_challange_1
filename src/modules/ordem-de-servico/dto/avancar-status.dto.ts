import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { StatusOSEnum } from '../../../domain/ordem-de-servico/value-objects/StatusOS';

export class AvancarStatusDto {
  @ApiProperty({ enum: StatusOSEnum })
  @IsEnum(StatusOSEnum)
  novoStatus!: StatusOSEnum;
}
