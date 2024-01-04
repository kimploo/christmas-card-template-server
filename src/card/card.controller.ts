import { Card, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { DefaultResDTO } from '@/types/dto';
import { CreateCardReqDTO } from './dto/createCard.dto';
import { updateCardReqDTO } from './dto/updateCard.dto';
import { getErrorMessage } from '@/util/errorHandler';
import { CardWithInfos } from './dto/getCard.dto';
import token from '@/util/token';

const getPageStartEnd = (limit: number, page: number) => {
  const pageStart = (page - 1) * limit;
  const pageEnd = pageStart + limit;
  return { pageStart, pageEnd };
};

export default {
  findMany: async (req: Request, res: Response<DefaultResDTO<CardWithInfos[], string>>) => {
    const { limit, page } = req.query;
    if (!limit || !page) return res.status(400).send({ error: 'Bad Request' });

    const { pageStart, pageEnd } = getPageStartEnd(Number(limit), Number(page));
    let cards;
    try {
      cards = await prisma.card.findMany({
        include: {
          Artwork: true,
          ArtworkBackground: true,
          ArtworkSnowFlake: true,
        },
        skip: pageStart,
        take: pageEnd,
      });
    } catch (e) {
      console.error(getErrorMessage(e));
      return res.status(404).send({ error: 'Not Found' });
    }

    return res.json({
      data: cards,
    });
  },

  findOne: async (req: Request, res: Response<DefaultResDTO<CardWithInfos, string>>) => {
    const uuid = req.params.uuid;
    let card;

    try {
      card = await prisma.card.findUnique({
        include: {
          Artwork: true,
          ArtworkBackground: true,
          ArtworkSnowFlake: true,
        },
        where: { uuid },
      });
    } catch (e) {
      console.error(getErrorMessage(e));
      return res.status(404).send({ error: 'Not Found' });
    }

    if (!card) return res.status(404).send({ error: 'Not Found' });

    return res.json({
      data: card,
    });
  },

  createOne: async (
    req: Request<ParamsDictionary, any, CreateCardReqDTO>,
    res: Response<DefaultResDTO<{ uuid: string | null }, string>>
  ) => {
    const refreshToken = req.cookies['refresh_jwt'];
    const decoded = token.verifyToken('refresh', refreshToken);
    if (!decoded || typeof decoded === 'string') return res.status(401).json({ error: 'unauthorized' });

    let user;
    try {
      user = await prisma.user.findUnique({
        where: {
          kakaoId: BigInt(decoded?.id),
        },
      });
    } catch (e) {
      console.error(getErrorMessage(e));
      return res.status(404).send({ error: 'Not Found' });
    }

    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const { from, to, msg, artworkId, artworkBackgroundId, artworkSnowFlakeId } = req.body;
    let card;
    try {
      card = await prisma.card.create({
        data: {
          from,
          to,
          msg,
          userId: user.id,
          createdAt: new Date(),
          artworkId,
          artworkBackgroundId,
          artworkSnowFlakeId,
        },
      });

      if (!card) return res.status(400).json({ error: 'not found' });
    } catch (e) {
      console.error(getErrorMessage(e));
      return res.status(400).json({ error: 'not found' });
    }

    return res.status(201).json({
      data: {
        uuid: card.uuid,
      },
    });
  },

  updateOne: async (
    req: Request<ParamsDictionary, any, updateCardReqDTO>,
    res: Response<DefaultResDTO<{ uuid: string | null }, string>>
  ) => {
    const { from, to, msg, artworkId, artworkUrl, artworkBackgroundId, bgInfo, artworkSnowFlakeId, imgUrls } = req.body;
    const cardId = Number(req.params.id);

    let card: Card | null;
    try {
      card = await prisma.card.update({
        where: { id: cardId },
        data: {
          from,
          to,
          msg,
          updatedAt: new Date(),
        },
      });

      await prisma.artwork.upsert({
        where: {
          id: artworkId,
        },
        create: {
          url: artworkUrl,
          ArtworkBackground: {
            connectOrCreate: {
              where: {
                id: artworkBackgroundId,
              },
              create: {
                bgInfo,
              },
            },
          },
          ArtworkSnowFlake: {
            connectOrCreate: {
              where: {
                id: artworkSnowFlakeId,
              },
              create: {
                imgUrls,
              },
            },
          },
        },
        update: {
          url: artworkUrl,
          ArtworkBackground: {
            update: {
              where: {
                id: artworkBackgroundId,
              },
              data: {
                bgInfo,
              },
            },
          },
          ArtworkSnowFlake: {
            update: {
              where: {
                id: artworkSnowFlakeId,
              },
              data: {
                imgUrls,
              },
            },
          },
        },
      });
    } catch (e) {
      console.error(getErrorMessage(e));
      return res.status(400).json({ error: 'bad request' });
    }

    return res.json({
      data: {
        uuid: card.uuid,
      },
    });
  },

  deleteOne: async (req: Request, res: Response<DefaultResDTO<null, string>>) => {
    const id = Number(req.params.id);

    try {
      await prisma.card.delete({
        where: {
          id,
        },
      });
    } catch (e) {
      console.error(getErrorMessage(e));
      return res.status(404).json({ error: 'not found' });
    }
    return res.status(204).json({
      data: null,
    });
  },
};
