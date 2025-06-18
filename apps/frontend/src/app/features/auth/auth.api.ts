export interface AuthResponseDto {
  access_token: string;
  refresh_token?: string;
  user?: any;
}

export interface AuthLoginDto {
  email: string;
  password: string;
}
