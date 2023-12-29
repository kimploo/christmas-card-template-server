import { Card, PrismaClient } from '@prisma/client';
import token from '@util/token';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { CreateCardReqDTO } from './dto/createCard.dto';
import { updateCardReqDTO } from './dto/updateCard.dto';
const prisma = new PrismaClient();

const getPageStartEnd = (limit: number, page: number) => {
  const pageStart = (page - 1) * limit;
  const pageEnd = pageStart + limit;
  return { pageStart, pageEnd };
};

export default {
  findMany: async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    if (!limit || !page) return res.status(400).send('should have pagination parameter');

    const { pageStart, pageEnd } = getPageStartEnd(Number(limit), Number(page));
    const result = await prisma.card.findMany({
      skip: pageStart,
      take: pageEnd,
    });

    return res.json(result);
  },

  findOne: async (req: Request, res: Response) => {
    const uuid = req.params.uuid;
    const result = await prisma.card.findUnique({
      where: { uuid },
    });
    return res.json(result);
  },

  createOne: async (req: Request<ParamsDictionary, any, CreateCardReqDTO>, res: Response) => {
    const refreshToken = req.cookies['refresh_jwt'];
    const decoded = token.verifyToken('refresh', refreshToken);
    if (!decoded || typeof decoded === 'string') return res.status(401).json('not authorized');

    const user = await prisma.user.findUnique({
      where: {
        kakaoId: decoded?.id,
      },
    });
    if (!user) return res.status(401).json('not authorized');

    const { from, to, msg, artworkId, artworkUrl, artworkBackgroundId, bgColor, artworkSnowballId, imgUrls } = req.body;
    let card: Card | null;
    try {
      card = await prisma.card.create({
        data: {
          from,
          to,
          msg,
          userId: user.id,
          createdAt: new Date(),
          Artwork: {
            connectOrCreate: {
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
                      bgColor,
                    },
                  },
                },
                ArtworkSnowball: {
                  connectOrCreate: {
                    where: {
                      id: artworkSnowballId,
                    },
                    create: {
                      imgUrls,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(400).json(e);
    }

    return res.status(201).json({
      uuid: card.uuid,
    });
  },

  updateOne: async (req: Request<ParamsDictionary, any, updateCardReqDTO>, res: Response) => {
    const { from, to, msg, artworkId, artworkUrl, artworkBackgroundId, bgColor, artworkSnowballId, imgUrls } = req.body;
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

      const artwork = await prisma.artwork.upsert({
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
                bgColor,
              },
            },
          },
        },
        update: {
          url: artworkUrl,
          ArtworkBackground: {
            update: {
              where: {
                id: artworkSnowballId,
              },
              data: {
                bgColor,
              },
            },
          },
        },
      });
    } catch (e) {
      return res.status(400).json(e);
    }

    return res.json({
      id: card.uuid,
    });
  },

  deleteOne: async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    try {
      await prisma.card.delete({
        where: {
          id,
        },
      });
    } catch (e) {
      return res.status(400).json(e);
    }
    return res.status(204).json({
      status: 'ok',
      response: 'No Content',
    });
  },
};
