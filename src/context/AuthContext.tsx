import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../services/api/authApi";
import { userApi } from "../services/api/userApi";
import type { LoginDto } from "../types/api";

interface AuthContextType {
  isAuthenticated: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(localStorage.getItem("token")),
  );
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [currencyBalance, setCurrencyBalance] = useState<number>(0);
  const [dailyRewardClaimedToday, setDailyRewardClaimedToday] =
    useState<boolean>(false);

  const bootstrapProfile = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setUsername("");
      setRole("");
      setCurrencyBalance(0);
      setDailyRewardClaimedToday(false);
      return;
    }

    try {
      const profile = await userApi.getProfile();
      setUsername(profile.username ?? "");
      setRole(profile.role ?? "");
      setCurrencyBalance(profile.currencyBalance ?? 0);
      setDailyRewardClaimedToday(profile.dailyRewardClaimedToday ?? false);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      setUsername("");
      setRole("");
      setCurrencyBalance(0);
      setDailyRewardClaimedToday(false);
    }
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const data = await authApi.login(dto);

    localStorage.setItem("token", data.token);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    setIsAuthenticated(true);
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
      const refreshToken = localStorage.getItem("refreshToken") ?? undefined;
      await authApi.logout(refreshToken);
    } catch {
      // no-op: local cleanup still proceeds
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setUsername("");
    setRole("");
    setCurrencyBalance(0);
    setDailyRewardClaimedToday(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
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
