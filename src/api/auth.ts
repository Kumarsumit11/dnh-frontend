import api from "./axios";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterInvestorData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address?: string;
}

export interface RegisterCompanyData {
  email: string;
  password: string;
  companyName: string;
  phone: string;
  address?: string;
}

export interface VerifyEmailData {
  email: string;
  otp: string;
}

export const login = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);
  return response.data.data;
};

export const registerInvestor = async (data: RegisterInvestorData) => {
  const response = await api.post("/auth/register/investor", data);
  return response.data.data;
};

export const registerCompany = async (data: RegisterCompanyData) => {
  const response = await api.post("/auth/register/company", data);
  return response.data.data;
};

export const verifyEmail = async (data: VerifyEmailData) => {
  const response = await api.post("/auth/verify-email", data);
  return response.data.data;
};

export const resendOtp = async (email: string) => {
  const response = await api.post("/auth/resend-otp", { email });
  return response.data.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data.data;
};


export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data.data;
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const response = await api.post("/auth/reset-password", {
    email,
    otp,
    newPassword,
  });
  return response.data.data;
};
