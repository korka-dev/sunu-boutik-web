"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken, Shop, User } from "./api";

interface AuthContextValue {
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    shop_name: string;
    shop_address?: string;
    shop_phone?: string;
    full_name: string;
    email: string;
    logo?: File | null;
  }) => Promise<string>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadMe() {
    try {
      const me = await api.get<{ user: User; shop: Shop }>("/auth/me");
      setUser(me.user);
      setShop(me.shop);
    } catch {
      clearToken();
      setUser(null);
      setShop(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getToken()) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
    setToken(res.access_token);
    const me = await api.get<{ user: User; shop: Shop }>("/auth/me");
    setUser(me.user);
    setShop(me.shop);
    router.push(me.user.must_change_password ? "/change-password" : "/dashboard/articles");
  }

  async function register(payload: {
    shop_name: string;
    shop_address?: string;
    shop_phone?: string;
    full_name: string;
    email: string;
    logo?: File | null;
  }) {
    const formData = new FormData();
    formData.append("shop_name", payload.shop_name);
    if (payload.shop_address) formData.append("shop_address", payload.shop_address);
    if (payload.shop_phone) formData.append("shop_phone", payload.shop_phone);
    formData.append("full_name", payload.full_name);
    formData.append("email", payload.email);
    if (payload.logo) formData.append("logo", payload.logo);

    const res = await api.postForm<{ message: string }>("/auth/register", formData);
    return res.message;
  }

  function logout() {
    clearToken();
    setUser(null);
    setShop(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, shop, loading, login, register, logout, refreshMe: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
