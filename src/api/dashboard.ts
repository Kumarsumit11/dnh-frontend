import api from "./axios";

export const getCompanyDashboard = async () => {
  const response = await api.get("/dashboard/company");
  return response.data.data;
};

export const getInvestorDashboard = async () => {
  const response = await api.get("/dashboard/investor");
  return response.data.data;
};