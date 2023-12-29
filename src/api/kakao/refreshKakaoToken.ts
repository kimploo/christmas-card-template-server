import axios from 'axios';
import QueryString from 'qs';
const { KAKAO_REST_API_KEY } = process.env;

interface Params {
  refresh_token: string | null;
}

/**
 * refreshKakaoToken
 * 액세스 토큰과 리프레시 토큰을 갱신합니다.
 * https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#refresh-token
 */
export default function refreshKakaoToken({ refresh_token }: Params) {
  return axios({
    url: 'https://kauth.kakao.com/oauth/token',
    method: 'POST',
    data: QueryString.stringify({
      grant_type: 'refresh_token',
      client_id: KAKAO_REST_API_KEY,
      refresh_token,
    }),
  });
}
