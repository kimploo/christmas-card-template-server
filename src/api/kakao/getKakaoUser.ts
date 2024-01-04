import kakaoAxios from '../base';

interface Params {
  access_token: string;
}

/**
 * getKakaoUser
 * 액세스 토큰과 리프레시 토큰을 갱신합니다.
 * https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#req-user-info
 */
export default function getKakaoUser({ access_token }: Params) {
  return kakaoAxios({
    url: 'https://kapi.kakao.com/v2/user/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${access_token}` },
  });
}
