import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();

import { Request, Response } from 'express';
import { add } from 'date-fns';

import cookieUtil from '@/util/cookie';
import refreshKakaoToken from '@/api/kakao/refreshKakaoToken';
import getKakaoUser from '@/api/kakao/getKakaoUser';
import kakaoLogout from '@/api/kakao/kakaoLogout';
import getKakaoToken from '@/api/kakao/getKakaoToken';

import token from '@/util/token';
import { KakaoTokenRes, KakaoUserInfo } from '@/types/kakaoRes';
import { kakaoTokenRefreshRes } from './auth.type';

const isDev = process.env.IS_OFFLINE;
const domain = isDev ? 'localhost' : 'teamhh.link';
const { KAKAO_REST_API_KEY, CLIENT_URI_DEV, CLIENT_URI_PROD, SERVER_URI_DEV, SERVER_URI_PROD } = process.env;

export default {
  login: async (req: Request, res: Response) => {
    // cct 서버의 토큰이 적절하지 않을 때
    const serviceRefreshToken = req.cookies['refresh_jwt'];
    console.log('[auth/login]', 'req.cookies', req.cookies);
    const decoded = token.verifyToken('refresh', serviceRefreshToken);
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
      console.error('[auth/login]', '유저 토큰 find 에러', e);
      return res.status(400).json(e);
    }

    const isTokenExpired =
      user.kakaoAccessTokenExpiresOn &&
      user.kakaoRefreshTokenExpiresOn &&
      user.kakaoAccessTokenExpiresOn < new Date() &&
      user.kakaoRefreshTokenExpiresOn < new Date();

    // 카카오 토큰 재발행
    // TODO: better variable name -> 꼭 Res가 아닐 수 있기 때문
    let kakaoTokenRefreshRes: kakaoTokenRefreshRes | null = null;
    if (isTokenExpired) {
      try {
        kakaoTokenRefreshRes = (
          await refreshKakaoToken({
            refresh_token: oldRefreshToken,
          })
        ).data;
      } catch (e) {
        console.error('[auth/login]', '유저 토큰 재발행 에러', e);
        return res.status(400).json(e);
      }

      if (!kakaoTokenRefreshRes) {
        console.error('[auth/login]', '유저 토큰 재발행 에러 kakaoTokenRefreshRes:', kakaoTokenRefreshRes);
        return res.status(400).json({ error: 'bad request' });
      }

      const { access_token, expires_in, refresh_token, refresh_token_expires_in } = kakaoTokenRefreshRes;
      const isRefreshed = Boolean(refresh_token);
      console.log('[auth/login]', 'kakaoTokenRefreshRes', kakaoTokenRefreshRes);

      // 카카오 유저 정보 재확인
      let kakaoUserInfo: KakaoUserInfo;
      try {
        kakaoUserInfo = (await getKakaoUser({ access_token })).data;
      } catch (e) {
        console.error('사용자 정보 받기 에러', e);
        return res.status(400).json(e);
      }
      console.log('[auth/login]', '카카오 유저 정보 재확인: kakaoUserInfo', kakaoUserInfo);

      // 토큰 갱신
      try {
        user = await prisma.user.update({
          where: {
            kakaoId: BigInt(kakaoUserInfo.id),
          },
          data: {
            name: kakaoUserInfo.properties?.nickname || null,
            kakaoAccessToken: access_token,
            kakaoAccessTokenExpiresOn: add(new Date(), { seconds: expires_in }),
            kakaoRefreshToken: !isRefreshed ? undefined : refresh_token,
            kakaoRefreshTokenExpiresOn: !isRefreshed
              ? undefined
              : add(new Date(), { seconds: refresh_token_expires_in }),
          },
        });
      } catch (e) {
        console.error('[auth/login]', '유저 생성 에러', e);
        return res.status(400).json(e);
      }
    }

    // 카카오 유저 정보 재확인
    let kakaoUserInfo: KakaoUserInfo;
    try {
      if (!user.kakaoAccessToken) {
        console.error('[auth/login]', '유저 Access Token이 없습니다.', user);
        return res.status(400).json({ error: 'bad request' });
      }
      kakaoUserInfo = (await getKakaoUser({ access_token: user.kakaoAccessToken })).data;
    } catch (e) {
      console.error('[auth/login]', '사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }
    console.log('[auth/login]', '카카오 유저 정보 재확인', kakaoUserInfo);

    // access 토큰은 Authorization 헤더로, refresh 토큰은 쿠키로 돌려준다.
    const refresh_token =
      isTokenExpired && kakaoTokenRefreshRes ? kakaoTokenRefreshRes.refresh_token : user.kakaoRefreshToken;
    const access_token =
      isTokenExpired && kakaoTokenRefreshRes ? kakaoTokenRefreshRes.access_token : user.kakaoAccessToken;
    console.log('[auth/login]', 'refresh_token', refresh_token);
    console.log('[auth/login]', 'access_token', access_token);

    const resCookie = { ...kakaoUserInfo, refresh_token };
    const resBody = { ...kakaoUserInfo, access_token };

    // 서비스 앱의 토큰 생성 및 전달
    const { appRefreshToken } = token.generateToken(resCookie, true);
    res.cookie('refresh_jwt', appRefreshToken, {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 24 * 3600 * 1000 * 7), // 7일 후 소멸되는 Persistent Cookie
    });

    return res.status(200).json(resBody);
  },

  logout: async (req: Request, res: Response) => {
    const cookie = req.cookies['refresh_jwt'];
    const decoded = token.verifyToken('refresh', cookie);
    if (!decoded || typeof decoded === 'string') {
      cookieUtil.clear(res);
      return res.status(401).json('not authorized');
    }

    // 카카오 refreshToken으로 유저 확인
    const refreshToken = decoded.refresh_token;
    let user: User | null;
    try {
      user = await prisma.user.findUnique({
        where: {
          kakaoRefreshToken: refreshToken,
        },
      });
    } catch (e) {
      console.error('[auth/logout]', '유저 토큰 find 에러', e);
      return res.status(400).json(e);
    }

    if (!user) return res.status(404).json('Not Found');

    // 카카오 유저 정보 재확인
    let kakaoUserInfo: KakaoUserInfo;
    try {
      if (!user.kakaoAccessToken) {
        console.error('[auth/logout]', '유저 Access Token이 없습니다.', user);
        return res.status(400).json({ error: 'bad request' });
      }
      kakaoUserInfo = (await getKakaoUser({ access_token: user.kakaoAccessToken })).data;
    } catch (e) {
      console.error('[auth/logout]', '사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }
    console.log('[auth/logout]', 'kakaoUserInfo', kakaoUserInfo);
    console.log('[auth/logout]', 'logout find user', user);

    try {
      await kakaoLogout({ access_token: user.kakaoAccessToken });
    } catch (e) {
      console.error('[auth/logout]', '카카오 로그아웃 에러', e);
      return res.status(400).json(e);
    }

    const kakaoId = BigInt(kakaoUserInfo.id);

    try {
      user = await prisma.user.update({
        where: {
          kakaoId,
        },
        data: {
          kakaoAccessToken: null,
          kakaoRefreshToken: null,
          name: kakaoUserInfo.properties?.nickname || null,
          kakaoAccessTokenExpiresOn: null,
          kakaoRefreshTokenExpiresOn: null,
        },
      });
      console.log('[auth/logout]', 'logout user', user);
    } catch (e) {
      console.error('[auth/logout]', 'user update error', e);
      return res.status(400).json(e);
    }

    if (refreshToken) cookieUtil.clear(res);
    return res.status(205).send({ data: 'Logged Out Successfully' });
  },

  auth: async (req: Request, res: Response) => {
    if (!KAKAO_REST_API_KEY || !CLIENT_URI_DEV || !CLIENT_URI_PROD || !SERVER_URI_DEV || !SERVER_URI_PROD)
      throw new Error('should set env');

    const code = req.query.code as string;
    const redirect_uri = isDev ? new URL('/auth', SERVER_URI_DEV).href : new URL('/auth', SERVER_URI_PROD).href;
    const client_redirect_url = isDev ? CLIENT_URI_DEV : CLIENT_URI_PROD;

    console.log('[auth]', 'code?', code);
    console.log('[auth]', 'kakao?', KAKAO_REST_API_KEY);
    console.log('[auth]', 'redirect_uri?', redirect_uri);
    console.log('[auth]', 'client_redirect_uri?', client_redirect_url);

    // 카카오 인증 서버에서 받은 code로 토큰 생성
    let kakaoRes: KakaoTokenRes;
    try {
      kakaoRes = (
        await getKakaoToken({
          code,
          redirect_uri,
        })
      ).data;
    } catch (e) {
      console.error('[auth]', '토큰 받기 에러', e);
      return res.status(400).json(e);
    }

    // 카카오 억세스 토큰으로 사용자 정보 가져오기
    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = kakaoRes;

    let kakaoUserInfo: KakaoUserInfo;
    try {
      kakaoUserInfo = (await getKakaoUser({ access_token })).data;
    } catch (e) {
      console.error('[auth]', '사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }

    console.log('[auth]', 'check kakaoid', kakaoUserInfo);
    let user;
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
      console.error('[auth]', '유저 생성 에러', e);
      return res.status(400).json(e);
    }

    const cookieResponse = {
      ...kakaoUserInfo,
      refresh_token,
    };

    // 서비스 앱의 토큰 생성 및 전달
    const { appRefreshToken } = token.generateToken(cookieResponse, true);

    res.cookie('refresh_jwt', appRefreshToken, {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 24 * 3600 * 1000 * 7), // 7일 후 소멸되는 Persistent Cookie
    });

    const clientRedirectUrl = new URL(client_redirect_url).href;
    return res.redirect(clientRedirectUrl);
  },
};
