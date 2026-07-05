import api from "./axios";

export const getCompanyProfile = async () => {
  const response = await api.get("/company/me");
  return response.data.data;
};

export const getInvestorProfile = async () => {
  const response = await api.get("/investor/me");
  return response.data.data;
};