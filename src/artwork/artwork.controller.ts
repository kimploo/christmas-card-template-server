import { DefaultResDTO } from '@/types/dto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { Request, Response } from 'express';
import { ArtworkWithInfos } from './dto/getArtwork.dto';

const getPageStartEnd = (limit: number, page: number) => {
  const pageStart = (page - 1) * limit;
  const pageEnd = pageStart + limit;
  return { pageStart, pageEnd };
};

export default {
  findMany: async (req: Request, res: Response<DefaultResDTO<ArtworkWithInfos[], string>>) => {
    const { limit, page } = req.query;
    if (!limit || !page) return res.status(400).send({ error: 'not found' });

    const { pageStart, pageEnd } = getPageStartEnd(Number(limit), Number(page));
    const result = await prisma.artwork.findMany({
      include: {
        ArtworkBackground: true,
        ArtworkSnowFlake: true,
      },
      skip: pageStart,
      take: pageEnd,
    });

    return res.json({ data: result });
  },
};
