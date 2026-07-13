// api/company-update.ts
import api from "./axios";

export type UpdateAuthorRole = "CEO" | "CFO";
export type UpdateCategory = "GENERAL" | "FINANCIAL" | "PRODUCT" | "MILESTONE" | "RISK";

export interface CompanyUpdate {
  id: string;
  companyId: string;
  authorRole: UpdateAuthorRole;
  authorName: string;
  title: string;
  content: string;
  category: UpdateCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyUpdateData {
  authorRole: UpdateAuthorRole;
  authorName: string;
  title: string;
  content: string;
  category?: UpdateCategory;
}

export const getCompanyUpdates = async () => {
  const response = await api.get("/company/updates");
  return response.data.data as CompanyUpdate[];
};

export const createCompanyUpdate = async (data: CreateCompanyUpdateData) => {
  const response = await api.post("/company/updates", data);
  return response.data.data as CompanyUpdate;
};

export const editCompanyUpdate = async (id: string, data: Partial<CreateCompanyUpdateData>) => {
  const response = await api.put(`/company/updates/${id}`, data);
  return response.data.data as CompanyUpdate;
};

export const deleteCompanyUpdate = async (id: string) => {
  const response = await api.delete(`/company/updates/${id}`);
  return response.data.data;
};

export const getCompanyUpdatesForCompany = async (companyId: string) => {
  const response = await api.get(`/company/updates/company/${companyId}`);
  return response.data.data as CompanyUpdate[];
};