import { Module } from '@nestjs/common';
import { ProductsService } from './application/products.service';
import { ProductsController } from './interface/products.controller';
import { ProductsRepository } from './infrastructure/products.repository';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
