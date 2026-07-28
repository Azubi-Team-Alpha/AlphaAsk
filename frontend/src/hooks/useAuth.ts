import { useCallback, useState } from "react";
import { authenticate, setToken } from "../lib/api-mock";
import type { AuthMode, AuthPayload, CurrentUser } from "../types";

interface UseAuthOptions {
  onLogOut?: () => void;
}

export function useAuth({ onLogOut }: UseAuthOptions = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthMode | null>(null);

  const handleAuthSubmit = useCallback(async (payload: AuthPayload) => {
    const user = await authenticate(payload);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthModalMode(null);
  }, []);

  const handleLogOut = useCallback(() => {
    setToken(null);
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
