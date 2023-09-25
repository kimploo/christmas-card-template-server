import axios from 'axios';
import qs from 'qs';
import { PrismaClient, User } from '@prisma/client';
import { Request, Response } from 'express';

import token from '@util/token';
import { KakaoLogoutSuccessRes, KakaoLogoutUnauthorizedRes, KakaoTokenRes, KakaoUserInfo } from '@customType/kakaoRes';
import { add } from 'date-fns';

const prisma = new PrismaClient();
const isDev = process.env.IS_OFFLINE;
const domain = isDev ? 'localhost' : 'teamhh.link';
const { KAKAO_REST_API_KEY, CLIENT_URI_DEV, CLIENT_URI_PROD, SERVER_URI_DEV, SERVER_URI_PROD } = process.env;

export default {
  login: async (req: Request, res: Response) => {
    // cct 서버의 토큰이 적절하지 않을 때
    const refreshToken = req.cookies['refresh_jwt'];
    console.log(req.cookies);
    const decoded = token.verifyToken('refresh', refreshToken);
    if (!decoded || typeof decoded === 'string') {
      return res.status(401).json('not authorized');
    }
    return res.status(200).json(decoded);
  },

  logout: async (req: Request, res: Response) => {
    const refreshToken = req.cookies['refresh_jwt'];
    const decoded = token.verifyToken('refresh', refreshToken);
    if (!decoded || typeof decoded === 'string') {
      return res.status(401).json('not authorized');
    }

    // 유저의 억세스 토큰을 찾는다.
    let user: User | null;
    try {
      user = await prisma.user.findFirst({
        where: {
          kakaoRefreshToken: refreshToken,
        },
      });
    } catch (e) {
      console.error('유저 토큰 find 에러', e);
      return res.status(400).json(e);
    }
    const access_token = user?.kakaoAccessToken;
    let kakaoId = user?.kakaoId;
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
        return res.data;
      })
      .catch((e) => {
        console.error('카카오 로그아웃', e);
      });
    kakaoId = kakaoLogoutRes ? kakaoLogoutRes.id : kakaoId;
    console.log('kakaoId', kakaoId?.toString());

    try {
      user = await prisma.user.update({
        where: {
          kakaoId,
        },
        data: {
          kakaoAccessToken: null,
          kakaoRefreshToken: null,
        },
      });
      console.log('user update ?', user);
    } catch (e) {
      console.error('user update error', e);
      return res.status(400).json(e);
    }

    if (refreshToken) {
      res.clearCookie('refresh_jwt', {
        domain,
        path: '/',
        sameSite: 'none',
        secure: true,
      });
    }
    res.clearCookie('access_jwt', {
      domain,
      path: '/',
      sameSite: 'none',
      secure: true,
    });
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

    // 카카오 ID와 일치하는 유저가 있는지 찾기
    // TODO: 삭제해도 무방한 로직으로 보임
    let user;
    try {
      user = await prisma.user.findUnique({
        where: {
          kakaoId: kakaoUserInfo.id,
        },
      });
    } catch (e) {
      console.error('유저 조회 에러', e);
      return res.status(400).json(e);
    }

    // 카카오 ID와 일치하는 유저가 없으면 생성하고 있으면 토큰 갱신 (회원가입)
    try {
      user = await prisma.user.upsert({
        where: {
          kakaoId: kakaoUserInfo.id,
        },
        create: {
          kakaoId: kakaoUserInfo.id,
          kakaoAccessToken: access_token,
          kakaoAccessTokenExpiresOn: add(new Date(), { seconds: expires_in }),
          kakaoRefreshToken: refresh_token,
          kakaoRefreshTokenExpiresOn: add(new Date(), { seconds: refresh_token_expires_in }),
        },
        update: {
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

    const tokenResponse = {
      ...kakaoUserInfo,
      refresh_token,
    };

    // 서비스 앱의 토큰 생성 및 전달
    const { appAccessToken, appRefreshToken } = token.generateToken(tokenResponse, true);

    res.cookie('refresh_jwt', appRefreshToken, {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 24 * 3600 * 1000 * 7), // 7일 후 소멸되는 Persistent Cookie
    });
    res.cookie('access_jwt', appAccessToken, {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      // Expires 옵션이 없는 Session Cookie
    });

    const redirectUrl = new URL(client_redirect_url).href;
    return res.redirect(redirectUrl);
  },

  loginOld: async (req: Request, res: Response) => {
    // const body = req.body;
    // const redirect_uri = isDev
    //   ? 'http://localhost:3000/auth'
    //   : 'https://6ellivwb08.execute-api.ap-northeast-2.amazonaws.com/auth';
    // const url = new URL('https://kauth.kakao.com/oauth/authorize');
    // url.pathname = qs.stringify({
    //   response_type: 'code',
    //   client_id: KAKAO_REST_API_KEY,
    //   redirect_uri,
    // });
    // console.log(url.toString());
    // let kakaoRes;
    // try {
    //   kakaoRes = await axios.get(url.toString());
    // } catch (e) {
    //   console.error('Error', e);
    //   return res.status(400).json(e);
    // }
    // console.log('kakaoRes', kakaoRes);
  },
};
