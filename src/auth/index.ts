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

type Type = 'access' | 'refresh';

module.exports = {
  generateToken: (payload: Payload, checkedKeepLogin: boolean) => {
    if (APP_ACCESS_SECRET && APP_REFRESH_SECRET) {
      const accessToken = sign(payload, APP_ACCESS_SECRET, { expiresIn: '1d' });
      let refreshToken = null;
      if (checkedKeepLogin) {
        refreshToken = sign(payload, APP_REFRESH_SECRET, { expiresIn: '7d' });
      }

      const result = {
        accessToken,
        refreshToken,
      };

      return result;
    }
    return null;
  },
  verifyToken: (type: Type, token: string) => {
    let secretKey, decoded;
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

    try {
      if (secretKey) decoded = verify(token, secretKey);
      else throw 'no secret key';
    } catch (err) {
      console.log(`JWT Error: ${err}`);
      return null;
    }
    return decoded;
  },
};
