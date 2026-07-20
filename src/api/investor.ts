import api from "./axios";

export interface RawFundingOpportunity {
  id: string;
  title: string;
  description: string;
  fundNeeded: string;
  valuation: string | null;
  minimumTicket: string | null;
  equityOfferedPct: string | null;
  totalShares: number | null;
  pricePerShare: string | null;
  status: string;
}

export interface BrowseCompanyItem {
  id: string;
  companyName: string;
  registrationNumber: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  foundedYear: number | null;
  teamSize: number | null;
  address: string | null;
  logoUrl: string | null;
  verificationStatus: string;
  createdAt: string;
  fundingOpportunities: RawFundingOpportunity[];
}

export const browseCompanies = async (params?: {
  industry?: string;
  minFund?: number;
  maxFund?: number;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/investor/companies", { params });
  return response.data.data as BrowseCompanyItem[];
};

export const getInvestorCompanyDetail = async (companyId: string) => {
  const response = await api.get(`/investor/companies/${companyId}`);
  return response.data.data;
};