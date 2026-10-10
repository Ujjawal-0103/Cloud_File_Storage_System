import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/cloud_file_storage_db';

    const adapter = new PrismaPg({
      connectionString: dbUrl,
    });

    super({ adapter });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      throw new Error(
        '[CloudRage Fatal Error] DATABASE_URL environment variable is not defined in production!\n' +
        'Please configure DATABASE_URL in Render Dashboard -> Environment.'
      );
    }
    await this.$connect();
  }
}

