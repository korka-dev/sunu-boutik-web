import { api } from "@/lib/api";

export interface ShopProfileUpdate {
  name?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  ninea?: string;
  rc?: string;
}

export function updateShopProfile(payload: ShopProfileUpdate) {
  return api.patch("/auth/shop", payload);
}
