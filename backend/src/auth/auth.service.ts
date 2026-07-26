import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SystemLogsService } from '../system-logs/system-logs.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private systemLogs: SystemLogsService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      this.systemLogs.logAction('LOGIN', `Usuário '${username}' acessou o Painel de Controle.`, username);
      const { password, ...result } = user;
      return result;
    }
    this.systemLogs.logAction('LOGIN_FALHOU', `Tentativa incorreta de login para a conta '${username}'.`, username || 'Desconhecido');
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }
}
