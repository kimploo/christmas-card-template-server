import axios from 'axios';
import qs from 'qs';
import { PrismaClient, User } from '@prisma/client';
import { Request, Response } from 'express';

import token from '@util/token';
import { KakaoTokenRes, KakaoUserInfo } from '@customType/kakaoRes';
import { add } from 'date-fns';
import { kakaoTokenRefreshRes } from './auth.type';
import cookieUtil from '../util/cookie';

const prisma = new PrismaClient();
const isDev = process.env.IS_OFFLINE;
const domain = isDev ? 'localhost' : 'teamhh.link';
const { KAKAO_REST_API_KEY, CLIENT_URI_DEV, CLIENT_URI_PROD, SERVER_URI_DEV, SERVER_URI_PROD } = process.env;

export default {
  login: async (req: Request, res: Response) => {
    // cct 서버의 토큰이 적절하지 않을 때
    const serviceRefreshToken = req.cookies['refresh_jwt'];
    console.log(req.cookies);
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
      console.error('유저 토큰 find 에러', e);
      return res.status(400).json(e);
    }

    // 카카오 토큰 재발행
    let kakaoTokenRefreshRes: kakaoTokenRefreshRes;
    try {
      kakaoTokenRefreshRes = (
        await axios({
          url: 'https://kauth.kakao.com/oauth/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          data: qs.stringify({
            grant_type: 'refresh_token',
            client_id: KAKAO_REST_API_KEY,
            refresh_token: oldRefreshToken,
          }),
        })
      ).data;
    } catch (e) {
      console.error('유저 토큰 재발행 에러', e);
      return res.status(400).json(e);
    }

    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = kakaoTokenRefreshRes;
    const isRefreshed = Boolean(refresh_token);
    console.log('kakaoTokenRefreshRes', kakaoTokenRefreshRes);

    // 카카오 유저 정보 재확인
    let kakaoUserInfo: KakaoUserInfo;
    try {
      kakaoUserInfo = (
        await axios({
          url: 'https://kapi.kakao.com/v2/user/me',
          method: 'GET',
          headers: { Authorization: `Bearer ${access_token}` },
        })
      ).data;
    } catch (e) {
      console.error('사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }
    console.log('여기가 id값이 바뀐다구요 ..?', kakaoUserInfo);

    // 토큰 갱신
    try {
      user = await prisma.user.update({
        where: {
          kakaoId: kakaoUserInfo.id,
        },
        data: {
          name: kakaoUserInfo.properties?.nickname || null,
          kakaoAccessToken: access_token,
          kakaoAccessTokenExpiresOn: add(new Date(), { seconds: expires_in }),
          kakaoRefreshToken: !isRefreshed ? undefined : refresh_token,
          kakaoRefreshTokenExpiresOn: !isRefreshed ? undefined : add(new Date(), { seconds: refresh_token_expires_in }),
        },
      });
    } catch (e) {
      console.error('유저 생성 에러', e);
      return res.status(400).json(e);
    }

    // access 토큰은 Authorization 헤더로, refresh 토큰은 쿠키로 돌려준다.
    console.log('왜 자꾸 리프레시가 undefined..', refresh_token, user);
    const resCookie = {
      ...kakaoUserInfo,
      refresh_token: isRefreshed ? refresh_token : user.kakaoRefreshToken,
    };

    const resBody = {
      ...kakaoUserInfo,
      access_token,
    };

    // 서비스 앱의 토큰 생성 및 전달
    const { appRefreshToken } = token.generateToken(resCookie, true);
    console.log('여기서 리프레시 토큰이 갑자기 빠진다구요..?', resCookie, resBody, appRefreshToken);

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
      console.error('유저 토큰 find 에러', e);
      return res.status(400).json(e);
    }
    const access_token = user?.kakaoAccessToken;

    // 카카오 유저 정보 재확인
    let kakaoUserInfo: KakaoUserInfo;
    try {
      kakaoUserInfo = (
        await axios({
          url: 'https://kapi.kakao.com/v2/user/me',
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            Authorization: `Bearer ${access_token}`,
          },
        })
      ).data;
    } catch (e) {
      console.error('사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }
    console.log('여기가 id값이 바뀐다구요 ..? 로그아웃', kakaoUserInfo);
    console.log('logout find user', user);

    let kakaoLogoutRes = await axios({
      url: 'https://kapi.kakao.com/v1/user/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((res) => {
        console.log(res.data);
        return res.data;
      })
      .catch((e) => {
        console.error('카카오 로그아웃', e);
      });

    const kakaoId = kakaoUserInfo.id;
    console.log('kakaoId', kakaoId?.toString());

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
      console.log('user update ?', user);
    } catch (e) {
      console.error('user update error', e);
      return res.status(400).json(e);
    }

    if (refreshToken) {
      cookieUtil.clear(res);
    }
    return res.status(205).send('Logged Out Successfully');
  },

  auth: async (req: Request, res: Response) => {
    if (!KAKAO_REST_API_KEY || !CLIENT_URI_DEV || !CLIENT_URI_PROD || !SERVER_URI_DEV || !SERVER_URI_PROD)
      throw new Error('should set env');

    const code = req.query.code;
    const redirect_uri = isDev ? new URL('/auth', SERVER_URI_DEV).href : new URL('/auth', SERVER_URI_PROD).href;
    const client_redirect_url = isDev ? CLIENT_URI_DEV : CLIENT_URI_PROD;

    console.log('code?', code);
    console.log('kakao?', KAKAO_REST_API_KEY);
    console.log('redirect_uri?', redirect_uri);
    console.log('client_redirect_uri?', client_redirect_url);

    // 카카오 인증 서버에서 받은 code로 토큰 생성
    let kakaoRes: KakaoTokenRes;
    try {
      kakaoRes = (
        await axios({
          url: 'https://kauth.kakao.com/oauth/token',
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
          data: qs.stringify({
            grant_type: 'authorization_code',
            client_id: KAKAO_REST_API_KEY,
            code,
            redirect_uri,
          }),
        })
      ).data;
    } catch (e) {
      console.error('토큰 받기 에러', e);
      return res.status(400).json(e);
    }

    // 카카오 억세스 토큰으로 사용자 정보 가져오기
    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = kakaoRes;

    let kakaoUserInfo: KakaoUserInfo;
    try {
      kakaoUserInfo = (
        await axios({
          url: 'https://kapi.kakao.com/v2/user/me',
          method: 'GET',
          headers: { Authorization: `Bearer ${access_token}` },
        })
      ).data;
    } catch (e) {
      console.error('사용자 정보 받기 에러', e);
      return res.status(400).json(e);
    }

    console.log('check kakaoid', kakaoUserInfo);
    let user;
    // 카카오 ID와 일치하는 유저가 없으면 생성하고 있으면 토큰 갱신 (회원가입)
    try {
      user = await prisma.user.upsert({
        where: {
          kakaoId: kakaoUserInfo.id,
        },
        create: {
          kakaoId: kakaoUserInfo.id,
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
