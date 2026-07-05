import { User } from "./user";

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}