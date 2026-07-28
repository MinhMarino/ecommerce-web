import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearTokens, getUser, setUser as persistUser } from "./api";

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
  logout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getUser<AuthUser>());
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      setSessionUser: (u) => {
        setUser(u);
        if (u) persistUser(u);
        else persistUser(null);
      },
      logout: () => {
        clearTokens();
        setUser(null);
      },
      theme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    }),
    [user, theme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}
