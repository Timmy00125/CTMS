import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    const poolConfig: PoolConfig = {
      connectionString,
      max: 20, // Maximum number of clients in the pool
      min: 5, // Minimum number of idle clients
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Fail fast if connection takes > 5s
      maxUses: 7500, // Close and replace a connection after it has been used 7500 times
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;

    // Log pool events for monitoring
    this.pool.on('connect', () => {
      console.debug('Database pool: new client connected');
    });

    this.pool.on('error', (err) => {
      console.error('Database pool: unexpected error on idle client', err);
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.info(
      `Database pool initialized (max: ${this.pool.options.max} connections)`,
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    console.info('Database pool closed');
  }

  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}
