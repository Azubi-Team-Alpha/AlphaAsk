import { useCallback, useState, useEffect } from "react";
import { authenticate, register, setToken } from "../lib/api";
import type { AuthMode, AuthPayload, CurrentUser } from "../types";

interface UseAuthOptions {
  onLogOut?: () => void;
}

export function useAuth({ onLogOut }: UseAuthOptions = {}) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const savedUser = localStorage.getItem("alphaask_user");
      const token = localStorage.getItem("alphaask_token");
      if (savedUser && token) {
        return JSON.parse(savedUser);
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem("alphaask_token");
    const savedUser = localStorage.getItem("alphaask_user");
    return !!(token && savedUser);
  });

  const [authModalMode, setAuthModalMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.token) {
      localStorage.setItem("alphaask_user", JSON.stringify(currentUser));
      localStorage.setItem("alphaask_token", currentUser.token);
      setToken(currentUser.token);
      setIsAuthenticated(true);
    }
  }, [currentUser]);

  const handleAuthSubmit = useCallback(async (payload: AuthPayload) => {
    const user = payload.mode === "signup" ? await register(payload) : await authenticate(payload);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem("alphaask_user", JSON.stringify(user));
    localStorage.setItem("alphaask_token", user.token);
    setToken(user.token);
    setAuthModalMode(null);
  }, []);

  const handleLogOut = useCallback(() => {
    setToken(null);
    localStorage.removeItem("alphaask_user");
    localStorage.removeItem("alphaask_token");
    setIsAuthenticated(false);
    setCurrentUser(null);
    onLogOut?.();
  }, [onLogOut]);

  return {
    isAuthenticated,
    currentUser,
    authModalMode,
    setAuthModalMode,
    handleAuthSubmit,
    handleLogOut,
  };
}
