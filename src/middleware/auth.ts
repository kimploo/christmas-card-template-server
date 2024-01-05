import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();
import { add } from 'date-fns';
import { RequestHandler } from 'express';

import token from '@/util/token';
import cookieUtil from '@/util/cookie';
import { kakaoTokenRefreshRes } from '@/auth/auth.type';
import { KakaoUserInfo } from '@/types/kakaoRes';

import refreshKakaoToken from 'src/api/kakao/refreshKakaoToken';
import getKakaoUser from 'src/api/kakao/getKakaoUser';

const isDev = process.env.IS_OFFLINE;

export const authFunc: RequestHandler = async (req, res, next) => {
  const cookie = req.cookies['refresh_jwt'];

  // 토큰 검증
  const decoded = token.verifyToken('refresh', cookie);
  if (!decoded || typeof decoded === 'string') {
    cookieUtil.clear(res);
    return res.status(401).json('not authorized');
  }

  // 카카오 refreshToken으로 유저 확인
  const oldRefreshToken = decoded.refresh_token;
  let user: User | null;
  try {
    user = await prisma.user.findUnique({
      where: {
        kakaoRefreshToken: oldRefreshToken,
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
  const isAuthorizedHeader = authHeader && authHeader === `Bearer ${user.kakaoAccessToken}`;

  // 헤더가 있는지, 맞는지 검사
  if (!isAuthorizedHeader) {
    return res.status(401).send('Unauthorized');
  }

  // expired 아닌 경우 다시 재발행하지 않음
  const isTokenExpired =
    user.kakaoAccessTokenExpiresOn &&
    user.kakaoRefreshTokenExpiresOn &&
    user.kakaoAccessTokenExpiresOn < new Date() &&
    user.kakaoRefreshTokenExpiresOn < new Date();

  if (isTokenExpired) {
    // 카카오 토큰 재발행
    let kakaoTokenRefreshRes: kakaoTokenRefreshRes;
    try {
      kakaoTokenRefreshRes = (await refreshKakaoToken({ refresh_token: user.kakaoRefreshToken })).data;
    } catch (e) {
      console.error('유저 토큰 재발행 에러', e);
      return res.status(400).json(e);
    }

    // 카카오 억세스 토큰으로 사용자 정보 가져오기
    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = kakaoTokenRefreshRes;

    let kakaoUserInfo: KakaoUserInfo;
    try {
      kakaoUserInfo = (await getKakaoUser({ access_token })).data;
    } catch (e) {
      console.error('사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }

    // 카카오 ID와 일치하는 유저가 없으면 생성하고 있으면 토큰 갱신 (회원가입)
    try {
      user = await prisma.user.upsert({
        where: {
          kakaoId: BigInt(kakaoUserInfo.id),
        },
        create: {
          kakaoId: BigInt(kakaoUserInfo.id),
          name: kakaoUserInfo.properties?.nickname || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          kakaoAccessToken: access_token,
          kakaoAccessTokenExpiresOn: add(new Date(), { seconds: expires_in }),
          kakaoRefreshToken: refresh_token,
          kakaoRefreshTokenExpiresOn: add(new Date(), { seconds: refresh_token_expires_in }),
        },
        update: {
          updatedAt: new Date(),
          name: kakaoUserInfo.properties?.nickname || null,
          kakaoAccessToken: access_token,
          kakaoAccessTokenExpiresOn: add(new Date(), { seconds: expires_in }),
          kakaoRefreshToken: refresh_token,
          kakaoRefreshTokenExpiresOn: add(new Date(), { seconds: refresh_token_expires_in }),
        },
      });
    } catch (e) {
      console.error('유저 생성 에러', e);
      return res.status(400).json(e);
    }

    const cookieResponse = {
      ...kakaoUserInfo,
      refresh_token,
    };

    // 서비스 앱의 토큰 생성 및 전달
    const { appRefreshToken } = token.generateToken(cookieResponse, true);

    const domain = isDev ? 'localhost' : 'teamhh.link';
    res.cookie('refresh_jwt', appRefreshToken, {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 24 * 3600 * 1000 * 7), // 7일 후 소멸되는 Persistent Cookie
    });
  }

  return next();
};
