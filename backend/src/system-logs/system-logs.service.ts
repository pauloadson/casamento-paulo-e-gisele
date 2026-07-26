import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger('SystemAudit');

  constructor(private readonly prisma: PrismaService) {}

  async logAction(action: string, details: string, performedBy: string = 'Sistema'): Promise<void> {
    this.logger.log(`[${action}] (${performedBy}): ${details}`);
    try {
      await this.prisma.systemLog.create({
        data: {
          action,
          details,
          performedBy,
        },
      });
    } catch (err) {
      this.logger.error(`Falha ao salvar log no banco de dados: ${err.message}`);
    }
  }

  async findAll() {
    return this.prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
  }
}
