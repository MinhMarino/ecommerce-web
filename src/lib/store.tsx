import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getUser, revokeSession, setUser as persistUser } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  status: string;
  avatarUrl?: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  setSessionUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCartCount: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getUser<AuthUser>());
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const refreshCartCount = useCallback(async () => {
    try {
      const data = await api<{ itemCount: number }>("/api/v1/cart");
      setCartCount(data.itemCount);
    } catch {
      /* not fatal — leave previous count */
    }
  }, []);

  useEffect(() => {
    void refreshCartCount();
  }, [refreshCartCount, user]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      setSessionUser: (u) => {
        setUser(u);
        if (u) persistUser(u);
        else persistUser(null);
      },
      logout: async () => {
        await revokeSession();
        setUser(null);
        setCartCount(0);
      },
      theme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      cartCount,
      setCartCount,
      refreshCartCount,
    }),
    [user, theme, cartCount, refreshCartCount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}
