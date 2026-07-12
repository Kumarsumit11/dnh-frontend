import api from "./axios";

export interface CreateFundingData {
  title: string;
  description: string;
  fundNeeded: number;
  fundPurpose: string;
  valuation?: number;
  minimumTicket?: number;
  equityOfferedPct?: number;
  totalShares?: number;
  pricePerShare?: number;
}

export interface FundingOpportunity extends CreateFundingData {
  id: string;
  companyId: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "CLOSED" | "REJECTED";
  rejectionReason?: string | null;
  sharesSold?: number;
  sharesRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Company: create a new funding opportunity (goes to PENDING_APPROVAL until an
// associate partner approves it). Requires the company to be VERIFIED first.
export const createFundingOpportunity = async (data: CreateFundingData) => {
  const response = await api.post("/funding", data);
  return response.data.data as FundingOpportunity;
};

// Company: list their own funding opportunities (includes sharesSold/sharesRemaining)
export const getMyFundingOpportunities = async () => {
  const response = await api.get("/funding");
  return response.data.data as FundingOpportunity[];
};

export const updateFundingOpportunity = async (id: string, data: Partial<CreateFundingData>) => {
  const response = await api.put(`/funding/${id}`, data);
  return response.data.data as FundingOpportunity;
};

export const deleteFundingOpportunity = async (id: string) => {
  const response = await api.delete(`/funding/${id}`);
  return response.data.data;
};

// Investor (or any authenticated user): browse active/live funding opportunities
export const getActiveFundingOpportunities = async (page = 1, limit = 20) => {
  const response = await api.get("/funding/active", { params: { page, limit } });
  return response.data.data as FundingOpportunity[];
};

export const getFundingOpportunityById = async (id: string) => {
  const response = await api.get(`/funding/${id}`);
  return response.data.data as FundingOpportunity;
};
