import QueryString from 'qs';
import kakaoAxios from '../base';
const { KAKAO_REST_API_KEY } = process.env;

interface Params {
  code: string;
  redirect_uri: string;
}

/**
 * getKakaoToken
 * 인가 코드로 토큰 발급을 요청합니다. 인가 코드 받기만으로는 카카오 로그인이 완료되지 않으며, 토큰 받기까지 마쳐야 카카오 로그인을 정상적으로 완료할 수 있습니다.
 * https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-token
 */
export default async function getKakaoToken({ code, redirect_uri }: Params) {
  return await kakaoAxios({
    url: 'https://kauth.kakao.com/oauth/token',
    method: 'POST',
    data: QueryString.stringify({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      code,
      redirect_uri,
    }),
  });
}
