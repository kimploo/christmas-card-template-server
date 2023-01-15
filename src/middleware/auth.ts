import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
import { RequestHandler } from 'express';
import token from '@util/token';

export const authFunc: RequestHandler = async (req, res, next) => {
  // const accessToken = req.cookies['access_jwt'];
  const refreshToken = req.cookies['refresh_jwt'];

  // 토큰 검증
  const decoded = token.verifyToken('refresh', refreshToken);
  if (!decoded || typeof decoded === 'string') {
    return res.status(401).json('not authorized');
  }

  return next();

  // 유저 조회
  // const user = await prisma.user.findUnique({
  //   where: {
  //     kakaoId: decoded.id,
  //   },
  // });

  // if (!user) {
  //   return res.status(404).json('user not found');
  // }

  // let kakaoUserInfo: KakaoUserInfo;
  // try {
  //   kakaoUserInfo = (
  //     await axios({
  //       url: 'https://kapi.kakao.com/v2/user/me',
  //       method: 'GET',
  //       headers: { Authorization: `Bearer ${user.kakaoAccessToken}` },
  //     })
  //   ).data;
  // } catch (e) {
  //   console.error('사용자 정보 받기 에러', e);
  //   return res.status(400).json(e);
  // }

  // return res.status(201).json({
  //   message: 'already created',
  //   data: user,
  // });
};
