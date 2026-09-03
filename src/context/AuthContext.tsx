import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db, normalizePhone } from "../lib/mock/db";
import type { SessionUser, Role } from "../lib/mock/types";

type AuthCtx = {
  user: SessionUser | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithPhone: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, emailOrPhone: string, password: string, language?: string) => Promise<{ ok: boolean; error?: string }>;
  registerWithPhone: (name: string, phone: string, password: string, language?: string) => Promise<{ ok: boolean; error?: string }>;
  checkPhoneExists: (phone: string) => { exists: boolean; user?: { id: string; name: string; phone: string; role: Role } };
  logout: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

const AUTH_STORAGE_KEY = "qisas.react.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const saveUser = useCallback((u: SessionUser | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const checkPhoneExists = useCallback((phoneInput: string) => {
    const clean = phoneInput.trim();
    const match = db.users.findByPhone(clean);
    if (match) {
      return {
        exists: true,
        user: {
          id: match.id,
          name: match.name,
          phone: match.phone,
          role: match.role,
        },
      };
    }
    return { exists: false };
  }, []);

  const loginWithPhone = useCallback(
    async (phoneInput: string, passwordInput: string) => {
      setLoading(true);
      const cleanPhone = phoneInput.trim();
      const match = db.users.findByPhone(cleanPhone);
      setLoading(false);
      if (!match || match.password !== passwordInput) {
        return {
          ok: false,
          error: "Nambari ya simu au nywila si sahihi. / Invalid phone or password.",
        };
      }
      const session: SessionUser = {
        id: match.id,
        name: match.name,
        email: match.email,
        phone: match.phone,
        role: match.role,
        language: match.language || "sw",
        subscriptionStatus: match.subscriptionStatus,
      };
      saveUser(session);
      return { ok: true };
    },
    [saveUser]
  );

  const login = useCallback(
    async (identifierInput: string, passwordInput: string) => {
      setLoading(true);
      const clean = identifierInput.trim();
      // Try phone lookup first, then email
      let match = db.users.findByPhone(clean);
      if (!match) {
        match = db.users.findByEmail(clean);
      }
      setLoading(false);
      if (!match || match.password !== passwordInput) {
        return {
          ok: false,
          error: "Nambari ya simu/barua pepe au nywila si sahihi. / Wrong credentials.",
        };
      }
      const session: SessionUser = {
        id: match.id,
        name: match.name,
        email: match.email,
        phone: match.phone,
        role: match.role,
        language: match.language || "sw",
        subscriptionStatus: match.subscriptionStatus,
      };
      saveUser(session);
      return { ok: true };
    },
    [saveUser]
  );

  const registerWithPhone = useCallback(
    async (name: string, phoneInput: string, passwordInput: string, language = "sw") => {
      setLoading(true);
      const normalized = normalizePhone(phoneInput);
      const existing = db.users.findByPhone(normalized);
      if (existing) {
        setLoading(false);
        return {
          ok: false,
          error: "Nambari hii ya simu tayari imesajiliwa. / An account with this phone already exists.",
        };
      }
      const cleanDigits = normalized.replace(/\D/g, "");
      const email = `${cleanDigits || "user"}@qisas.local`;
      const newUser = db.users.create({
        name: name.trim(),
        phone: normalized,
        email,
        password: passwordInput,
        role: "USER",
        language,
        subscriptionStatus: "FREE_TIER",
      });
      setLoading(false);
      const session: SessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        language: newUser.language || "sw",
        subscriptionStatus: newUser.subscriptionStatus,
      };
      saveUser(session);
      return { ok: true };
    },
    [saveUser]
  );

  const register = useCallback(
    async (name: string, emailOrPhone: string, passwordInput: string, language = "sw") => {
      // If it looks like a phone, use registerWithPhone
      const trimmed = emailOrPhone.trim();
      if (!trimmed.includes("@")) {
        return registerWithPhone(name, trimmed, passwordInput, language);
      }
      setLoading(true);
      const email = trimmed.toLowerCase();
      const existing = db.users.findByEmail(email);
      if (existing) {
        setLoading(false);
        return { ok: false, error: "An account with this email already exists." };
      }
      const newUser = db.users.create({
        name,
        email,
        password: passwordInput,
        role: "USER",
        language,
      });
      setLoading(false);
      const session: SessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        language: newUser.language,
        subscriptionStatus: newUser.subscriptionStatus,
      };
      saveUser(session);
      return { ok: true };
    },
    [registerWithPhone, saveUser]
  );

  const logout = useCallback(() => {
    saveUser(null);
  }, [saveUser]);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithPhone,
        register,
        registerWithPhone,
        checkPhoneExists,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
