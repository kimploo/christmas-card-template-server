import { Prisma } from '@prisma/client';

const artwork = Prisma.validator<Prisma.ArtworkDefaultArgs>()({
  include: { ArtworkBackground: true, ArtworkSnowFlake: true },
});

export type ArtworkWithInfos = Prisma.ArtworkGetPayload<typeof artwork>;
