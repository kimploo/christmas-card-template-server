export interface KakaoLogoutSuccessRes {
  id: number | bigint;
}

export interface KakaoLogoutUnauthorizedRes {
  msg: string;
  code: number;
}

export interface KakaoTokenRes {
  token_type: 'bearer';
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
}

export interface KakaoUserInfo {
  id: number | bigint;
  connected_at: string;
  properties: {
    nickname: string | null;
  };
  [key: string]: any;
}
