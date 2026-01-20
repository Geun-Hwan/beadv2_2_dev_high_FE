export const UserRole = {
  ADMIN: "ADMIN",
  SELLER: "SELLER",
  USER: "USER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type UserRoles = UserRole[];
export type UserRoleValue = UserRole | UserRoles;
export const normalizeRoles = (roles?: UserRoleValue): UserRoles =>
  Array.isArray(roles) ? roles : roles ? [roles] : [];
export const hasRole = (roles: UserRoleValue | undefined, role: UserRole) =>
  normalizeRoles(roles).includes(role);

export const UserStatus = {
  ACTIVE: "ACTIVE", // 정상활동 가능한 회원
  BLACKLISTED: "BLACKLISTED", // 블랙리스트에 등록된 서비스 이용 제한 회원
  WITHDRAWN: "WITHDRAWN",
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const SellerStatus = {
  PENDING: "PENDING", // 판매자 등록 신청한 판매자
  ACTIVE: "ACTIVE", // 정상활동 가능한 판매자
  INACTIVE: "INACTIVE", // 판매 활동을 비활성환 판매자
  BLACKLISTED: "BLACKLISTED", // 블랙리스트에 등록된 판매 제한 판매자
  WITHDRAWN: "WITHDRAWN",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  [UserStatus.ACTIVE]: "정상",
  [UserStatus.BLACKLISTED]: "블랙리스트",
  [UserStatus.WITHDRAWN]: "탈퇴",
};

export function getUserStatusLabel(status: string) {
  return USER_STATUS_LABELS[status] ?? status;
}

export type SellerStatus = (typeof SellerStatus)[keyof typeof SellerStatus];

export interface SellerApprovalItem {
  userId: string;
  status: SellerStatus;
  bankName: string;
  bankAccount: string;
}

export interface User {
  userId?: string;
  name?: string;
  email?: string;
  maskedEmail?: string;
  nickname?: string;
  roles?: UserRoles;
  phone_number?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  detail?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export type SocialProvider = "google" | "naver";
export type OAuthProvider = string;

export interface SocialLoginRequest {
  provider: SocialProvider;
  code: string;
  state?: string;
}

// 로그인 응답 데이터 타입 (API 명세에 따라 실제 타입으로 교체)
export interface LoginResponse {
  accessToken: string;
  userId: string;
  nickname: string;
  roles: UserRoles;
}

// 회원가입 요청 파라미터 타입 (API 명세에 따라 실제 타입으로 교체)
export interface SignupParams {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone_number: string;
}

// 판매자 등록 요청 파라미터 타입 (API 명세에 따라 실제 타입으로 교체)
export interface RegisterSellerParams {
  bankName: string;
  bankAccount: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  nickname: string | null;
  phoneNumber: string | null;
  userStatus: UserStatus;
  provider: OAuthProvider | null;
  deletedYn: "Y" | "N" | string;
  deletedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
  sellerStatus: SellerStatus | null;
  bankAccount: string | null;
  bankName: string | null;
}

export interface UserAddress {
  id: string;
  city: string;
  state: string;
  zipcode: string;
  detail: string;
  isDefault: boolean;
}

export interface UserAddressCreateRequest {
  city: string;
  state: string;
  zipcode: string;
  detail: string;
  isDefault: boolean;
}
