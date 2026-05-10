import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    const poolConfig: PoolConfig = {
      connectionString,
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      maxUses: 7500,
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;

    this.pool.on('connect', () => {
      this.logger.debug('Database pool: new client connected');
    });

    this.pool.on('error', (err) => {
      this.logger.error('Database pool: unexpected error on idle client', err);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(
      `Database pool initialized (max: ${this.pool.options.max} connections)`,
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database pool closed');
  }

  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}
