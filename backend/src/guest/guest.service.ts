import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class GuestService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async create(data: any) {
    const statusMsg = data.isConfirmed ? 'CONFIRMOU presença!' : 'informou que NÃO poderá comparecer.';
    this.systemLogs.logAction('RSVP', `Convidado '${data.name}' ${statusMsg} (Tel: ${data.phone || 'Sem tel'})`, `Convidado: ${data.name}`);

    // Se não tiver telefone (o que é raro no nosso front), apenas cria
    if (!data.phone) {
      const guestWithoutPhone = await this.prisma.guest.create({
        data: {
          name: data.name,
          phone: data.phone,
          isConfirmed: data.isConfirmed,
          message: data.message,
        },
      });
      
      await this.prisma.auditLog.create({
        data: {
          guestId: guestWithoutPhone.id,
          action: 'CREATE_RSVP_NO_PHONE',
          newStatus: data.isConfirmed,
        },
      });
      
      return guestWithoutPhone;
    }

    // Busca se já existe um convidado com esse celular
    const existingGuest = await this.prisma.guest.findUnique({
      where: { phone: data.phone },
    });

    if (existingGuest) {
      // Atualiza o convidado com as novas informações
      const updatedGuest = await this.prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          isConfirmed: data.isConfirmed,
          name: data.name, // atualiza o nome caso a pessoa tenha corrigido
          message: data.message, // atualiza a mensagem
        },
      });

      // Salva a alteração na tabela de auditoria
      await this.prisma.auditLog.create({
        data: {
          guestId: existingGuest.id,
          action: 'REPEATED_RSVP_UPDATE',
          oldStatus: existingGuest.isConfirmed,
          newStatus: data.isConfirmed,
        },
      });

      // Retornar o usuário atualizado faz o controller dar sucesso, 
      // então pro Frontend vai parecer que enviou normalmente!
      return updatedGuest;
    }

    // Caso não exista, cria um novo convidado
    const newGuest = await this.prisma.guest.create({
      data: {
        name: data.name,
        phone: data.phone,
        isConfirmed: data.isConfirmed,
        message: data.message,
      },
    });

    // Salva a alteração na tabela de auditoria
    await this.prisma.auditLog.create({
      data: {
        guestId: newGuest.id,
        action: 'CREATE_RSVP',
        newStatus: data.isConfirmed,
      },
    });

    return newGuest;
  }

  async findAll() {
    return this.prisma.guest.findMany({
      include: {
        auditLogs: true, // Inclui o histórico de alterações ao listar os convidados
      }
    });
  }

  async remove(id: number) {
    const g = await this.prisma.guest.findUnique({ where: { id } }).catch(() => null);
    this.systemLogs.logAction('EXCLUIR_CONVIDADO', `Convidado '${g?.name || id}' foi removido do sistema.`, 'admin');

    // Remove os registros de auditoria vinculados antes de deletar o convidado
    await this.prisma.auditLog.deleteMany({
      where: { guestId: id },
    });

    return this.prisma.guest.delete({
      where: { id },
    });
  }
}
