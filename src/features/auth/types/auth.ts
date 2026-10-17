export interface AuthResponse {
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  identifier: string; //emaill hoặc username
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type LogoutRequest = RefreshTokenRequest;

export interface User {
  id: string;
  email: string;
  userName: string;
  roleName: string;
  personalProfile?: PersonalProfile;
}

export interface PersonalProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: boolean; //true: name, false: nữ
  address: string;
  city: string;
  country: string;
  phone: string;
  citizenCardId: string;
}
