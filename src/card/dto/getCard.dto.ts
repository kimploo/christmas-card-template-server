import { Prisma } from '@prisma/client';

const cardWithInfos = Prisma.validator<Prisma.CardDefaultArgs>()({
  include: { Artwork: true, ArtworkBackground: true, ArtworkSnowFlake: true },
});

export type CardWithInfos = Prisma.CardGetPayload<typeof cardWithInfos>;
