import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const artworks = await prisma.artwork.createMany({
    data: [
      {
        url: 'https://card.teamhh.link/Together_72.png',
      },
      {
        url: 'https://card.teamhh.link/Snowman_72.png',
      },
      {
        url: 'https://card.teamhh.link/Happynewyear_72.png',
      },
      {
        url: 'https://card.teamhh.link/Christmas_72.png',
      },
      {
        url: 'https://card.teamhh.link/Congrats_72.png',
      },
      {
        url: 'https://card.teamhh.link/Chuseok_72.png',
      },
    ],
  });

  const artworkSnowFlake = await prisma.artworkSnowFlake.create({
    data: {
      id: 1,
      imgUrls: [
        'https://card.teamhh.link/snowflakes/white-snowflake-2x.png',
        'https://card.teamhh.link/snowflakes/orange-snowflake-2x.png',
        'https://card.teamhh.link/snowflakes/red-snowflake-2x.png',
        'https://card.teamhh.link/snowflakes/yellow-snowflake-2x.png',
      ],
      Artwork: {
        connect: [1, 2, 3, 4, 5, 6].map((id) => ({ id })),
      },
    },
  });

  const artworkBackground = await prisma.artworkBackground.create({
    data: {
      bgColor: 'linear-gradient(180deg, #F3F19D 80%, #FCCB6B 20%)',
      Artwork: {
        connect: [1, 2, 3, 4, 5, 6].map((id) => ({ id })),
      },
    },
  });

  const card = await prisma.card.create({
    data: {
      id: 1,
      from: '테스트 from',
      to: '테스트 to',
      msg: '테스트 카드 1',
      createdAt: new Date(0),
      artworkId: 1,
      artworkBackgroundId: artworkBackground.id,
      artworkSnowFlakeId: artworkSnowFlake.id,
    },
  });

  console.log('artworks', artworks);
  console.log('artworkSnowFlakes', artworkSnowFlake);
  console.log('artworkBackground', artworkBackground);
  console.log('card', card);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('DB 시드 에러', e);
    await prisma.$disconnect();
    process.exit(1);
  });
