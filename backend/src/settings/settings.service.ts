import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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
    return this.getSettings();
  }
}
