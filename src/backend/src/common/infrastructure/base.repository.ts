import { PrismaService } from '../../prisma/prisma.service';

/**
 * Typed delegate interface — eliminates `(prisma as any)[model]` access pattern.
 * Each concrete repository injects `prisma.<modelName>` which satisfies this shape.
 */

type SelectArg = Record<string, any>;

export interface ModelDelegate<
  T,
  CreateInput,
  UpdateInput,
  WhereUniqueInput,
  WhereInput,
  OrderByInput,
> {
  create(args: { data: CreateInput; select?: SelectArg }): Promise<T>;
  findMany(args: {
    skip?: number;
    take?: number;
    cursor?: WhereUniqueInput;
    where?: WhereInput;
    orderBy?: OrderByInput | OrderByInput[];
    select?: SelectArg;
  }): Promise<T[]>;
  findFirst(args: {
    where?: WhereInput;
    select?: SelectArg;
  }): Promise<T | null>;
  count(args: { where?: WhereInput }): Promise<number>;
  findUnique(args: {
    where: WhereUniqueInput;
    select?: SelectArg;
  }): Promise<T | null>;
  update(args: {
    where: WhereUniqueInput;
    data: UpdateInput | Record<string, unknown>;
  }): Promise<T>;
  delete(args: { where: WhereUniqueInput }): Promise<T>;
}

export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereUniqueInput,
  WhereInput,
  OrderByInput,
> {
  constructor(
    protected readonly prisma: PrismaService,

    protected readonly delegate: ModelDelegate<
      T,
      CreateInput,
      UpdateInput,
      WhereUniqueInput,
      WhereInput,
      OrderByInput
    >,
  ) {}

  async create(data: CreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: WhereUniqueInput;
    where?: WhereInput;
    orderBy?: OrderByInput | OrderByInput[];
    select?: SelectArg;
  }): Promise<[T[], number]> {
    const { skip, take, cursor, where, orderBy, select } = params;
    return Promise.all([
      this.delegate.findMany({ skip, take, cursor, where, orderBy, select }),
      this.delegate.count({ where }),
    ]);
  }

  async findOne(
    where: WhereUniqueInput,
    select?: SelectArg,
  ): Promise<T | null> {
    return this.delegate.findUnique({ where, select });
  }

  async findFirst(where: WhereInput, select?: SelectArg): Promise<T | null> {
    return this.delegate.findFirst({ where, select });
  }

  async update(params: {
    where: WhereUniqueInput;
    data: UpdateInput | Record<string, unknown>;
  }): Promise<T> {
    const { where, data } = params;
    return this.delegate.update({ where, data });
  }

  /** Hard delete — use softRemove for normal flows. */
  async remove(where: WhereUniqueInput): Promise<T> {
    return this.delegate.delete({ where });
  }

  /** Soft delete — sets deletedAt to now. Model must have a `deletedAt` field. */
  async softRemove(where: WhereUniqueInput): Promise<T> {
    return this.delegate.update({ where, data: { deletedAt: new Date() } });
  }
}
