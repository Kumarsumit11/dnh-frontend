import api from "./axios";

export interface CreateProposalData {
  fundingOpportunityId: string;
  proposedAmount: number;
  sharesRequested?: number;
  message?: string;
}

export interface Proposal {
  id: string;
  investorId: string;
  fundingOpportunityId: string;
  proposedAmount: string;
  sharesRequested?: number | null;
  message?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  updatedAt: string;
  fundingOpportunity?: any;
  investor?: any;
}

export interface Investment {
  id: string;
  investorId: string;
  fundingOpportunityId: string;
  proposalId?: string | null;
  amount: string;
  shares?: number | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  fundingOpportunity?: any;
  investor?: any;
}

// Investor: submit a proposal on an active funding opportunity.
// Pass `sharesRequested` if the investor is asking for a specific number of shares.
export const createProposal = async (data: CreateProposalData) => {
  const response = await api.post("/investments/proposals", data);
  return response.data.data as Proposal;
};

// Investor: proposals I've submitted
export const getMyProposals = async () => {
  const response = await api.get("/investments/proposals/mine");
  return response.data.data as Proposal[];
};

// Investor: investments I've made (accepted proposals)
export const getMyInvestments = async () => {
  const response = await api.get("/investments/investments/mine");
  return response.data.data as Investment[];
};

// Company: proposals received on my funding opportunities
export const getReceivedProposals = async () => {
  const response = await api.get("/investments/proposals/received");
  return response.data.data as Proposal[];
};

// Company: accept or reject a proposal
export const respondToProposal = async (id: string, status: "ACCEPTED" | "REJECTED") => {
  const response = await api.put(`/investments/proposals/${id}/respond`, { status });
  return response.data.data as Proposal;
};

// Company: investments received (from accepted proposals)
export const getReceivedInvestments = async () => {
  const response = await api.get("/investments/investments/received");
  return response.data.data as Investment[];
};
