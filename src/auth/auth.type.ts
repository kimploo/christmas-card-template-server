export interface kakaoTokenRefreshRes {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  expires_in: number;
}
