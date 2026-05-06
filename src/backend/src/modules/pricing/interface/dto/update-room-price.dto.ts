import { PartialType } from '@nestjs/swagger';
import { CreateRoomPriceDto } from './create-room-price.dto';

export class UpdateRoomPriceDto extends PartialType(CreateRoomPriceDto) {}
