import { apiClient } from "@/lib/api/client";
import type { LoginResponse, UserProfile } from "@/types/auth";

export async function sendOtp(email: string): Promise<{ success: boolean; message: string }> {
  return apiClient("/auth/signup/send-otp/", {
    method: "POST",
    body: { email },
  });
}

export async function verifyOtp(email: string, otp: string): Promise<{ signup_token: string }> {
  return apiClient("/auth/signup/verify-otp/", {
    method: "POST",
    body: { email, otp },
  });
}

export async function completeSignup(signup_token: string, password: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/signup/complete/", {
    method: "POST",
    body: { signup_token, password },
  });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/login/", {
    method: "POST",
    body: { email, password },
  });
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  // Trying common profile endpoints to accommodate standard Django auth packages
  try {
    return await apiClient<UserProfile>("/auth/users/me/", { token });
  } catch (error: any) {
    if (error.status === 404) {
      // Fallback to another common endpoint if the first fails
      return apiClient<UserProfile>("/auth/profile", { token });
    }
    throw error;
  }
}
