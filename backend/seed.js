const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialData = [
  {
    "dishName": "Jeera Rice",
    "dishId": "1",
    "imageUrl": "https://nosh-assignment.s3.ap-south-1.amazonaws.com/jeera-rice.jpg",
    "isPublished": true
  },
  {
    "dishName": "Paneer Tikka",
    "dishId": "2",
    "imageUrl": "https://nosh-assignment.s3.ap-south-1.amazonaws.com/paneer-tikka.jpg",
    "isPublished": true
  },
  {
    "dishName": "Rabdi",
    "dishId": "3",
    "imageUrl": "https://nosh-assignment.s3.ap-south-1.amazonaws.com/rabdi.jpg",
    "isPublished": true
  },
  {
    "dishName": "Chicken Biryani",
    "dishId": "4",
    "imageUrl": "https://nosh-assignment.s3.ap-south-1.amazonaws.com/chicken-biryani.jpg",
    "isPublished": true
  },
  {
    "dishName": "Alfredo Pasta",
    "dishId": "5",
    "imageUrl": "https://nosh-assignment.s3.ap-south-1.amazonaws.com/alfredo-pasta.jpg",
    "isPublished": true
  }
];

async function seed() {
  console.log('Seeding database...');
  for (const dish of initialData) {
    const existingDish = await prisma.dish.findUnique({
      where: { dishId: dish.dishId },
    });
    if (!existingDish) {
      await prisma.dish.create({
        data: dish,
      });
      console.log(`Created dish: ${dish.dishName}`);
    } else {
      console.log(`Dish already exists: ${dish.dishName}`);
    }
  }
  console.log('Seeding completed.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
