import api from "./axios";

export interface UpdateInvestorProfileData {
  fullName?: string;
  address?: string;
  bio?: string;
  investmentRangeMin?: number;
  investmentRangeMax?: number;
  preferredIndustries?: string[];
}

export const getCompanyProfile = async () => {
  const response = await api.get("/company/me");
  return response.data.data;
};

export const getInvestorProfile = async () => {
  const response = await api.get("/investor/me");
  return response.data.data;
};

export interface CompanyDetailsPayload {
  gstin?: string;
  ceoName?: string;
  cfoName?: string;
  monthlyRevenue?: number;
  yearlyRevenue?: number;
  registrationNumber?: string;
  industry?: string;
  website?: string;
  foundedYear?: number;
  teamSize?: number;
}

export const updateCompanyProfile = async (data: CompanyDetailsPayload) => {
  const response = await api.put("/company/profile", data);
  return response.data.data;
};

export const updateInvestorProfile = async (
  data: UpdateInvestorProfileData
) => {
  const response = await api.put("/investor/profile", data);
  return response.data.data;
};

export const uploadInvestorAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/investor/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
};