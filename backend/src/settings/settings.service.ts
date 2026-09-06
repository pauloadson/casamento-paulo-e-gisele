import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService
  ) {}

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }

  async updateSettings(data: Record<string, string>) {
    for (const key of Object.keys(data)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value: data[key] },
        create: { key, value: data[key] },
      });
    }

    await this.systemLogs.logAction(
      'ATUALIZAR CONFIGURAÇÃO',
      'Os números de contato dos noivos foram alterados',
      'Admin'
    );

    return this.getSettings();
  }
}
