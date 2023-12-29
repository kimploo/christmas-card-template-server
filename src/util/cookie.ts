import { Response } from 'express';

const isDev = process.env.IS_OFFLINE;
const defaultDomain = isDev ? 'localhost' : 'teamhh.link';

export default {
  bake: (domain: string, expires: Date) => {
    if (expires) {
      return {
        domain,
        path: '/',
        sameSite: 'none',
        httpOnly: true,
        secure: true,
        expires, // 7일 후 소멸되는 Persistent Cookie        // Expires 옵션이 없는 Session Cookie
      };
    }
    return {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      // Expires 옵션이 없는 Session Cookie
    };
  },
  clear: (res: Response, domain = defaultDomain, tokenType?: 'access_jwt' | 'refresh_jwt') => {
    if (!tokenType) {
      res.clearCookie('refresh_jwt', {
        domain,
        path: '/',
        sameSite: 'none',
        secure: true,
      });
      res.clearCookie('access_jwt', {
        domain,
        path: '/',
        sameSite: 'none',
        secure: true,
      });
    } else {
      res.clearCookie(tokenType, {
        domain,
        path: '/',
        sameSite: 'none',
        secure: true,
      });
    }
    return res;
  },
};
