import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { UsersController } from './interface/users.controller';
import { UsersRepository } from './infrastructure/users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
