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
  companyName?: string;              // ← new
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
  informationMemo?: InformationMemoPayload; // ← new
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



// api/profile.ts
export interface InformationMemoPayload {
  borrower?: string;
  promoters?: string;
  coBorrowerGuarantor?: string;
  aboutBorrowingEntity?: string;
  registeredAddress?: string;
  corporateOffice?: string;
  aboutGroup?: string;
  aboutPromoter?: string;
  shareholdingPattern?: string;
  directorsProfile?: string;
  financials?: Record<string, Record<string, string>>;
  repaymentHistory?: string;
  expansionPlan?: string;
  employeeStrength?: string;
  industryOverview?: string;
  topCustomers?: string;
  currentBankingArrangement?: string;
  proposedTransaction?: string;
  proposedBankingArrangement?: string;
  collateralSecurity?: string;
  otherSecurity?: string;
  swotAnalysis?: string;
}

export interface CompanyDetailsPayload {
  companyName?: string;              // ← new
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
  informationMemo?: InformationMemoPayload; // ← new
}