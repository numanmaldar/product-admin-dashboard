import apiClient from "./client";
import { LoginResponse } from "../types";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
  return response.data;
}