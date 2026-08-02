import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../services/api/authApi";
import { userApi } from "../services/api/userApi";
import type { LoginDto } from "../types/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "../services/accessTokenStore";

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  username: string;
  role: string;
  currencyBalance: number;
  dailyRewardClaimedToday: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapProfile: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [currencyBalance, setCurrencyBalance] = useState<number>(0);
  const [dailyRewardClaimedToday, setDailyRewardClaimedToday] =
    useState<boolean>(false);
  const bootstrapRequestRef = useRef<Promise<void> | null>(null);

  const bootstrapProfile = useCallback(() => {
    if (bootstrapRequestRef.current) {
      return bootstrapRequestRef.current;
    }

    const request = (async () => {
      try {
        setIsAuthReady(false);
        if (!getAccessToken()) {
          const session = await authApi.refreshToken();
          setAccessToken(session.token);
        }
        const profile = await userApi.getProfile();
        setUsername(profile.username ?? "");
        setRole(profile.role ?? "");
        setCurrencyBalance(profile.currencyBalance ?? 0);
        setDailyRewardClaimedToday(profile.dailyRewardClaimedToday ?? false);
        setIsAuthenticated(true);
      } catch {
        clearAccessToken();
        setIsAuthenticated(false);
        setUsername("");
        setRole("");
        setCurrencyBalance(0);
        setDailyRewardClaimedToday(false);
      } finally {
        bootstrapRequestRef.current = null;
        setIsAuthReady(true);
      }
    })();

    bootstrapRequestRef.current = request;
    return request;
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const data = await authApi.login(dto);

    setAccessToken(data.token);

    setIsAuthenticated(true);
    setIsAuthReady(true);
    setUsername(data.username ?? "");
    setRole(data.role ?? "");
    setCurrencyBalance(data.currencyBalance ?? 0);
    setDailyRewardClaimedToday(data.dailyRewardClaimedToday ?? false);

    if (!data.username || !data.role || typeof data.currencyBalance !== "number") {
      await bootstrapProfile();
    }
  }, [bootstrapProfile]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // no-op: local cleanup still proceeds
    }

    clearAccessToken();
    setIsAuthenticated(false);
    setIsAuthReady(true);
    setUsername("");
    setRole("");
    setCurrencyBalance(0);
    setDailyRewardClaimedToday(false);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAccessToken();
      setIsAuthenticated(false);
      setIsAuthReady(true);
      setUsername("");
      setRole("");
      setCurrencyBalance(0);
      setDailyRewardClaimedToday(false);
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth-session-expired", handleSessionExpired);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthReady,
      login,
      logout,
      username,
      role,
      currencyBalance,
      dailyRewardClaimedToday,
      bootstrapProfile,
    }),
    [
      isAuthenticated,
      isAuthReady,
      login,
      logout,
      username,
      role,
      currencyBalance,
      dailyRewardClaimedToday,
      bootstrapProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
