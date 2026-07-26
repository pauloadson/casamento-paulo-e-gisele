import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GiftsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.giftCategory.count();
    if (count === 0) {
      await this.seedDefaultGifts();
      console.log('Default gift list seeded successfully into database.');
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

  async createCategory(data: { name: string; icon?: string }) {
    const maxSeqCat = await this.prisma.giftCategory.findFirst({
      orderBy: { sequence: 'desc' },
    });
    const nextSeq = maxSeqCat ? maxSeqCat.sequence + 1 : 0;

    return this.prisma.giftCategory.create({
      data: {
        name: data.name,
        icon: data.icon || 'Box',
        sequence: nextSeq,
      },
      include: { items: true },
    });
  }

  async updateCategory(id: number, data: { name?: string; icon?: string; sequence?: number }) {
    return this.prisma.giftCategory.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async reorderCategories(order: { id: number; sequence: number }[]) {
    const updatePromises = order.map((item) =>
      this.prisma.giftCategory.update({
        where: { id: item.id },
        data: { sequence: item.sequence },
      })
    );
    await Promise.all(updatePromises);
    return this.findAll();
  }

  async deleteCategory(id: number) {
    return this.prisma.giftCategory.delete({
      where: { id },
    });
  }

  async createItem(data: { categoryId: number; name: string }) {
    return this.prisma.giftItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
      },
    });
  }

  async updateItem(id: number, data: { name?: string; isReceived?: boolean; givenBy?: string | null }) {
    return this.prisma.giftItem.update({
      where: { id },
      data,
    });
  }

  async deleteItem(id: number) {
    return this.prisma.giftItem.delete({
      where: { id },
    });
  }
}
