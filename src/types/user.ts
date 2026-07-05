export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  role: "investor" | "company" | "admin";
}