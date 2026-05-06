import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { ProductsRepository } from '../infrastructure/products.repository';
import { CreateProductDto } from '../interface/dto/create-product.dto';
import { UpdateProductDto } from '../interface/dto/update-product.dto';
import { ProductQueryDto } from '../interface/dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly listCacheKeys = new Set<string>();

  constructor(
    private readonly repository: ProductsRepository,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get cacheTtl() {
    return this.configService.get<number>('PRODUCT_CACHE_TTL', 60000);
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.repository.create(createProductDto);
    await this.invalidateListCache();
    this.logger.log(`Product created: ${product.id}`);
    return product;
  }

  async findAll(query: ProductQueryDto) {
    const cacheKey = `products_list_${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      category,
      isActive,
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await this.repository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
      select: this.repository.productSelect,
    });

    const result = {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    this.listCacheKeys.add(cacheKey);
    await this.cacheManager.set(cacheKey, result, this.cacheTtl);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = `product_${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const product = await this.repository.findOne(
      { id },
      this.repository.productSelect,
    );
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    await this.cacheManager.set(cacheKey, product, this.cacheTtl);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // ensure exists

    const product = await this.repository.update({
      where: { id },
      data: updateProductDto,
    });
    await this.invalidateProductCache(id);
    this.logger.log(`Product updated: ${id}`);
    return product;
  }

  async remove(id: string) {
    await this.findOne(id); // ensure exists

    const product = await this.repository.softRemove({ id });
    await this.invalidateProductCache(id);
    this.logger.log(`Product soft-deleted: ${id}`);
    return product;
  }

  private async invalidateProductCache(id: string) {
    await this.cacheManager.del(`product_${id}`);
    await this.invalidateListCache();
  }

  private async invalidateListCache() {
    await Promise.all(
      [...this.listCacheKeys].map((k) => this.cacheManager.del(k)),
    );
    this.listCacheKeys.clear();
  }
}
