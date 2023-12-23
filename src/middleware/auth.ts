import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();
import { RequestHandler } from 'express';
import token from '@util/token';
import cookieUtil from '../util/cookie';

export const authFunc: RequestHandler = async (req, res, next) => {
  const cookie = req.cookies['access_jwt'];

  // 토큰 검증
  const decoded = token.verifyToken('refresh', cookie);
  if (!decoded || typeof decoded === 'string') {
    cookieUtil.clear(res);
    return res.status(401).json('not authorized');
  }

  // 카카오 refreshToken으로 유저 확인
  const refreshToken = decoded.refresh_token;
  let user: User | null;
  try {
    user = await prisma.user.findFirst({
      where: {
        kakaoRefreshToken: refreshToken,
      },
    });
    if (!user) {
      throw new Error('user not found');
    }
  } catch (e) {
    console.error('유저 토큰 find 에러', e);
    return res.status(400).json(e);
  }

  // 헤더 검증
  const authHeader = req.get('Authorization');

  // 헤더가 있는지, 맞는지 검사
  if (authHeader && authHeader === `Bearer ${user.kakaoAccessToken}`) {
    // If the authorization is correct, call the next middleware/function
    return next();
  } else {
    return res.status(401).send('Unauthorized');
  }
};
