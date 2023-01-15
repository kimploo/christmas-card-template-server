import { Card, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

const getPageStartEnd = (limit: number, page: number) => {
  const pageStart = (page - 1) * limit;
  const pageEnd = pageStart + limit;
  return { pageStart, pageEnd };
};

export default {
  findMany: async (req: Request, res: Response) => {
    const { limit, page } = req.query;

    if (!limit || !page) res.status(400).send('should have pagination parameter');

    const { pageStart, pageEnd } = getPageStartEnd(Number(limit), Number(page));

    const result = await prisma.card.findMany({
      skip: pageStart,
      take: pageEnd,
    });

    return res.json(result);
  },

  findOne: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await prisma.card.findUnique({
      where: { id },
    });
    return res.json(result);
  },

  createOne: async (req: Request, res: Response) => {
    const { data } = req.body;

    let card: Card | null;
    try {
      card = await prisma.card.create({
        data: {
          from: data.from,
          to: data.to,
          msg: data.msg,
          userId: data.userId,
        },
      });
    } catch (e) {
      return res.status(400).json(e);
    }

    return res.status(201).json('created');
  },

  updateOne: async (req: Request, res: Response) => {
    const { data } = req.body;
    const cardId = Number(req.params.id);

    try {
      await prisma.card.update({
        where: { id: cardId },
        data: {
          ...data,
        },
      });
    } catch (e) {
      return res.status(400).json(e);
    }

    return res.json({
      status: 'ok',
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
