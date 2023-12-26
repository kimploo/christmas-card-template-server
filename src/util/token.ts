import dotenv from 'dotenv';
dotenv.config();
import { sign, verify } from 'jsonwebtoken';

const { APP_ACCESS_SECRET, APP_REFRESH_SECRET } = process.env;

interface Payload {
  id: number;
  connected_at: string | null;
  properties: {
    nickname: string | null;
  };
}

interface TokenResult {
  appAccessToken: string | null;
  appRefreshToken: string | null;
}

interface AuthToken {
  refresh_token: string;
  id: number;
  connected_at: string;
  properties: {
    nickname: string | null;
  };
}

type Type = 'access' | 'refresh';

export default {
  generateToken: (payload: any, checkedKeepLogin: boolean) => {
    const result: TokenResult = {
      appAccessToken: null,
      appRefreshToken: null,
    };
    if (APP_ACCESS_SECRET && APP_REFRESH_SECRET) {
      const appAccessToken = sign(payload, APP_ACCESS_SECRET, { expiresIn: '1d' });
      let appRefreshToken = null;
      if (checkedKeepLogin) {
        appRefreshToken = sign(payload, APP_REFRESH_SECRET, { expiresIn: '7d' });
      }
      result.appAccessToken = appAccessToken;
      result.appRefreshToken = appRefreshToken;
    }
    return result;
  },
  verifyToken: (type: Type, token: string) => {
    let secretKey;
    let decoded: AuthToken;
    switch (type) {
      case 'access':
        secretKey = APP_ACCESS_SECRET;
        break;
      case 'refresh':
        secretKey = APP_REFRESH_SECRET;
        break;
      default:
        return null;
    }
    console.log('verifyToken', type, token);

    try {
      if (secretKey) decoded = verify(token, secretKey) as AuthToken;
      else throw 'no secret key';
    } catch (err) {
      console.log(`verify app token error: ${err}`);
      return null;
    }
    return decoded;
  },
};
