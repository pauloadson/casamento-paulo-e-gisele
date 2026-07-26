import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class GiftsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.giftCategory.count();
      if (count === 0) {
        await this.seedDefaultGifts();
        console.log('Default gift list seeded successfully into database.');
      }
    } catch (error) {
      console.warn('Could not check/seed default gift list during module init:', error.message);
    }
  }

  private async seedDefaultGifts() {
    const defaultCategories = [
      {
        name: 'Cozinha',
        icon: 'Utensils',
        items: [
          'Jogo de panelas', 'Formas', 'Travessas de vidro', 'Potes herméticos', 
          'Jogo de facas', 'Tábua de corte', 'Escorredor de louças', 
          'Concha, espátula e pegador', 'Jogo de utensílios de cozinha', 
          'Tigelas (bowls)', 'Jarra de água', 'Garrafa térmica', 'Pratos', 
          'Pratos de sobremesa', 'Copos', 'Taças', 'Xícaras de café', 
          'Canecas', 'Pires', 'Jogo americano', 'Lixeira para cozinha'
        ]
      },
      {
        name: 'Eletrodomésticos',
        icon: 'Coffee',
        items: [
          'Liquidificador', 'Batedeira', 'Sanduicheira', 'Air fryer', 'Micro-ondas'
        ]
      },
      {
        name: 'Sala',
        icon: 'Tv',
        items: [
          'Sofá', 'Rack ou painel para TV', 'Tapete', 'Cortinas', 'Almofadas'
        ]
      },
      {
        name: 'Quarto',
        icon: 'BedDouble',
        items: [
          'Cama box', 'Colchão', 'Jogo de lençóis', 'Edredom', 'Cobertor', 
          'Colcha', 'Cesto para roupas', 'Cortinas', 'Tapete'
        ]
      },
      {
        name: 'Banheiro',
        icon: 'Bath',
        items: [
          'Jogo de toalhas de banho', 'Toalhas de rosto', 'Lixeira', 
          'Porta-sabonete líquido', 'Cesto de roupas'
        ]
      },
      {
        name: 'Área de Serviço',
        icon: 'WashingMachine',
        items: [
          'Varal de chão', 'Baldes', 'Bacia', 'Pregadores de roupa', 
          'Tábua de passar', 'Ferro de passar', 'Vassoura', 'Rodo', 'Pá de lixo'
        ]
      },
      {
        name: 'Eletros Maiores',
        icon: 'Box',
        items: [
          'Geladeira', 'Fogão', 'Forno elétrico', 'Máquina de lavar roupas', 
          'Aspirador de pó', 'Televisão'
        ]
      }
    ];

    for (let i = 0; i < defaultCategories.length; i++) {
      const cat = defaultCategories[i];
      const createdCat = await this.prisma.giftCategory.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          sequence: i,
        },
      });

      for (const item of cat.items) {
        await this.prisma.giftItem.create({
          data: {
            categoryId: createdCat.id,
            name: item,
          },
        });
      }
    }
  }

  async findAll() {
    return this.prisma.giftCategory.findMany({
      orderBy: { sequence: 'asc' },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });
  }

  async createCategory(data: { name: string; icon?: string }, performedBy: string = 'admin') {
    const maxSeqCat = await this.prisma.giftCategory.findFirst({
      orderBy: { sequence: 'desc' },
    });
    const nextSeq = maxSeqCat ? maxSeqCat.sequence + 1 : 0;

    const res = await this.prisma.giftCategory.create({
      data: {
        name: data.name,
        icon: data.icon || 'Box',
        sequence: nextSeq,
      },
      include: { items: true },
    });
    this.systemLogs.logAction('CRIAR_CATEGORIA', `Nova categoria '${data.name}' foi criada.`, performedBy);
    return res;
  }

  async updateCategory(id: number, data: { name?: string; icon?: string; sequence?: number }, performedBy: string = 'admin') {
    const res = await this.prisma.giftCategory.update({
      where: { id },
      data,
      include: { items: true },
    });
    if (data.name) {
      this.systemLogs.logAction('EDITAR_CATEGORIA', `Categoria #${id} renomeada para '${data.name}'.`, performedBy);
    }
    return res;
  }

  async reorderCategories(order: { id: number; sequence: number }[], performedBy: string = 'admin') {
    const updatePromises = order.map((item) =>
      this.prisma.giftCategory.update({
        where: { id: item.id },
        data: { sequence: item.sequence },
      })
    );
    await Promise.all(updatePromises);
    this.systemLogs.logAction('REORDENAR_CATEGORIAS', 'A ordem de exibição das categorias foi alterada.', performedBy);
    return this.findAll();
  }

  async deleteCategory(id: number, performedBy: string = 'admin') {
    const cat = await this.prisma.giftCategory.findUnique({ where: { id } }).catch(() => null);
    const res = await this.prisma.giftCategory.delete({
      where: { id },
    });
    this.systemLogs.logAction('EXCLUIR_CATEGORIA', `Categoria '${cat?.name || id}' e todos os seus itens foram excluídos.`, performedBy);
    return res;
  }

  async createItem(data: { categoryId: number; name: string }, performedBy: string = 'admin') {
    const res = await this.prisma.giftItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
      },
    });
    this.systemLogs.logAction('CRIAR_ITEM', `Novo item '${data.name}' foi adicionado na lista.`, performedBy);
    return res;
  }

  async updateItem(id: number, data: { name?: string; isReceived?: boolean; givenBy?: string | null }, performedBy: string = 'admin') {
    const oldItem = await this.prisma.giftItem.findUnique({ where: { id } }).catch(() => null);
    const res = await this.prisma.giftItem.update({
      where: { id },
      data,
    });

    if (data.isReceived !== undefined && data.isReceived !== oldItem?.isReceived) {
      if (data.isReceived) {
        this.systemLogs.logAction('MARCAR_GANHO', `Item '${oldItem?.name || id}' foi marcado como GANHO! (Presenteado por: ${data.givenBy || 'Convidado / Não informado'}).`, performedBy);
      } else {
        this.systemLogs.logAction('DESMARCAR_GANHO', `Item '${oldItem?.name || id}' foi desmarcado e voltou a ficar disponível.`, performedBy);
      }
    } else if (data.name !== undefined) {
      this.systemLogs.logAction('EDITAR_ITEM', `Item '${oldItem?.name || id}' foi alterado para '${data.name}'.`, performedBy);
    }
    return res;
  }

  async deleteItem(id: number, performedBy: string = 'admin') {
    const item = await this.prisma.giftItem.findUnique({ where: { id } }).catch(() => null);
    const res = await this.prisma.giftItem.delete({
      where: { id },
    });
    this.systemLogs.logAction('EXCLUIR_ITEM', `Item '${item?.name || id}' foi removido da lista de presentes.`, performedBy);
    return res;
  }
}
