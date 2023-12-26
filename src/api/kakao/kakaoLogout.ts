import kakaoAxios from '../base';

interface Params {
  access_token: string;
}

/**
 * kakaoLogout
 * 사용자 액세스 토큰과 리프레시 토큰을 모두 만료시킵니다. 사용자가 서비스에서 로그아웃할 때 이 API를 호출하여 더 이상 해당 사용자의 정보로 카카오 API를 호출할 수 없도록 합니다. 로그아웃은 요청 방법에 따라 다음과 같이 동작합니다.
 * https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#logout
 */
export default async function kakaoLogout({ access_token }: Params) {
  return await kakaoAxios({
    url: 'https://kapi.kakao.com/v1/user/logout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      Authorization: `Bearer ${access_token}`,
    },
  }).then((res) => {
    console.log('카카오 로그아웃 성공', res.data);
    return res.data;
  });
}
