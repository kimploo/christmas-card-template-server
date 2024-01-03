import { PrismaClient } from '@prisma/client';
import { JsonObject } from '@prisma/client/runtime/library';
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

  const bgInfo1 = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #C5F0FF 80%, #CBEA88 20%)',
    colors: ['#C5F0FF', '#CBEA88'],
  } as JsonObject;

  // 'linear-gradient(180deg, #F3F19D 80%, #FCCB6B 20%)',
  await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfo1,
      Artwork: {
        connect: {
          id: 1,
        },
      },
    },
  });

  const bgInfo2 = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #FFF2BD 80%, #C6D7F7 20%)',
    colors: ['#FFF2BD', '#C6D7F7'],
  } as JsonObject;

  await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfo2,
      Artwork: {
        connect: {
          id: 2,
        },
      },
    },
  });

  const bgInfo3 = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #FFD2D2 80%, #D2F7FF 20%)',
    colors: ['#FFD2D2', '#D2F7FF'],
  } as JsonObject;

  await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfo3,
      Artwork: {
        connect: {
          id: 3,
        },
      },
    },
  });

  const bgInfo4 = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #302F5B 80%, #FFF78D 20%)',
    colors: ['#302F5B', '#FFF78D'],
  } as JsonObject;

  await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfo4,
      Artwork: {
        connect: {
          id: 4,
        },
      },
    },
  });

  const bgInfo5 = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #FFF3B6 80%, #FFCA85 20%)',
    colors: ['#FFF3B6', '#FFCA85'],
  } as JsonObject;

  await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfo5,
      Artwork: {
        connect: {
          id: 5,
        },
      },
    },
  });

  const bgInfo6 = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #FFBE5F 80%, #FFF9C5 20%)',
    colors: ['#FFBE5F', '#FFF9C5'],
  } as JsonObject;

  await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfo6,
      Artwork: {
        connect: {
          id: 6,
        },
      },
    },
  });

  const bgInfoDefault = {
    type: 'linear-gradient',
    cssValue: 'linear-gradient(180deg, #F3F19D 80%, #FCCB6B 20%)',
    colors: ['#F3F19D', '#FCCB6B'],
  } as JsonObject;

  const artworkBackground = await prisma.artworkBackground.create({
    data: {
      bgInfo: bgInfoDefault,
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
