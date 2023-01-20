import axios from 'axios';
import qs from 'qs';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import token from '@util/token';
import { KakaoTokenRes, KakaoUserInfo } from '@customType/kakaoRes';

const prisma = new PrismaClient();
const isDev = process.env.IS_OFFLINE;
const { KAKAO_REST_API_KEY, CLIENT_URI_DEV, CLIENT_URI_PROD, SERVER_URI_DEV, SERVER_URI_PROD } = process.env;

export default {
  login: async (req: Request, res: Response) => {
    const refreshToken = req.cookies['refresh_jwt'];
    const decoded = token.verifyToken('refresh', refreshToken);
    if (!decoded || typeof decoded === 'string') {
      return res.status(401).json('not authorized');
    }
    return res.status(200).json(decoded);
  },

  logout: async (req: Request, res: Response) => {
    const refreshToken = req.cookies['refresh_jwt'];
    if (refreshToken) {
      res.clearCookie('refresh_jwt', {
        domain: 'teamhh.link',
        path: '/',
        sameSite: 'none',
        secure: true,
      });
    }
    res.clearCookie('access_jwt', {
      domain: 'teamhh.link',
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
    const { refresh_token, access_token } = kakaoRes;

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

    // 카카오 ID와 일치하는 유저가 없으면 생성하기 (회원가입)
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            kakaoId: kakaoUserInfo.id,
            kakaoAccessToken: access_token,
            kakaoRefreshToken: refresh_token,
          },
        });
      } catch (e) {
        console.error('유저 생성 에러', e);
        return res.status(400).json(e);
      }
    }

    // 서비스 앱의 토큰 생성 및 전달
    const { appAccessToken, appRefreshToken } = token.generateToken(kakaoUserInfo, true);

    res.cookie('refresh_jwt', appRefreshToken, {
      domain: 'teamhh.link',
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + 24 * 3600 * 1000 * 7), // 7일 후 소멸되는 Persistent Cookie
    });
    res.cookie('access_jwt', appAccessToken, {
      domain: 'teamhh.link',
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      // Expires 옵션이 없는 Session Cookie
    });

    return res.redirect(client_redirect_url);
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
