import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is in src/prisma/
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(username: string, passwordPlain: string) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordPlain, salt);
    return this.prisma.user.create({
      data: { username, password },
    });
  }

  async count() {
    return this.prisma.user.count();
  }

  async updatePassword(username: string, passwordPlain: string) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordPlain, salt);
    return this.prisma.user.update({
      where: { username },
      data: { password },
    });
  }
}
