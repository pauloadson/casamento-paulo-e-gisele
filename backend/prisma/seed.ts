import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando se já existem categorias no banco de dados...');
  const count = await prisma.giftCategory.count();
  if (count > 0) {
    console.log('Banco de dados já contém categorias de presentes. Seeding ignorado.');
    return;
  }

  console.log('Iniciando o seeding inicial de categorias e presentes...');

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
    const createdCat = await prisma.giftCategory.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        sequence: i,
      },
    });

    for (const item of cat.items) {
      await prisma.giftItem.create({
        data: {
          categoryId: createdCat.id,
          name: item,
        },
      });
    }
  }

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
