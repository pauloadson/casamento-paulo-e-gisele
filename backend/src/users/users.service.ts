import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is in src/prisma/
import { SystemLogsService } from '../system-logs/system-logs.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async findOne(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(username: string, passwordPlain: string) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordPlain, salt);
    const res = await this.prisma.user.create({
      data: { username, password },
    });
    this.systemLogs.logAction('CRIAR_USUARIO', `Conta admin '${username}' foi criada.`, 'Sistema');
    return res;
  }

  async count() {
    return this.prisma.user.count();
  }

  async updatePassword(username: string, passwordPlain: string) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordPlain, salt);
    const res = await this.prisma.user.update({
      where: { username },
      data: { password },
    });
    this.systemLogs.logAction('ATUALIZAR_SENHA', `Senha da conta admin '${username}' foi atualizada.`, 'Sistema');
    return res;
  }
}
