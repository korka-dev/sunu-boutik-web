import { api } from "@/lib/api";

export function checkPhoneForReset(phone: string) {
  return api.post<{ shop_name: string }>("/auth/forgot-password/check", { phone });
}

export function resetPasswordByPhone(phone: string, newPassword: string) {
  return api.post("/auth/forgot-password/reset", { phone, new_password: newPassword });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
