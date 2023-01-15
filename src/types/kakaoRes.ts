export interface KakaoTokenRes {
  token_type: 'bearer';
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
}

export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string | null;
  };
  [key: string]: any;
}
