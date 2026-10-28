export interface AuthResponse {
  token: string;
  refreshToken: string;
  hasPersonalProfile?: boolean;
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
  gender: boolean; //true: nam, false: nữ
  address: string;
  city: string;
  country: string;
  phone: string;
  citizenCardId: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  email?: string;
  code: string;
}

export interface CompleteProfileRequest {
  email?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
  citizenCardId: string;
}

export interface ResendVerificationRequest {
  email?: string;
  purpose?: OtpPurpose;
}

export enum OtpPurpose {
  EmailVerification = "EmailVerification",
  PasswordReset = "PasswordReset",
  ChangeEmail = "ChangeEmail",
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyPasswordResetOtpRequest {
  email: string;
  code: string;
}

export interface VerifyPasswordResetOtpResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdatePersonalProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: boolean;
  address: string;
  city: string;
  country: string;
  phone: string;
  citizenCardId: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SavedAccount {
  id: string;
  userName: string;
  email: string;
  fullName?: string;
  roleName?: string;
  lastActiveAt?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}


