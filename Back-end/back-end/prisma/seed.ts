import { prisma } from '../src/db.js';

async function main() {
  const categories = [
    { category_name: 'Bread' },
    { category_name: 'Pastries' },
    { category_name: 'Cakes' },
  ];

  for (const category of categories) {
    await prisma.categories.upsert({
      where: { category_name: category.category_name },
      update: {},
      create: { 
        category_name: category.category_name 
      },
    });
  }
  console.log('Database has been seeded! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });