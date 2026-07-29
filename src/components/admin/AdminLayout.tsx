import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Package,
  ShoppingBag,
  Store,
  Sun,
  X,
} from "lucide-react";
import { useApp } from "../../lib/store";
import { cn } from "../../lib/utils";
import { ErrorState } from "../ui/EmptyState";
import { ButtonLink } from "../ui/Button";

const MENU = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {MENU.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-ink"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )
          }
        >
          <item.icon className="h-4.5 w-4.5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const { user, logout, theme, toggleTheme } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();

  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-sm">
          <ErrorState message="Bạn không có quyền truy cập trang quản trị." />
          <div className="mt-4 flex justify-center">
            <ButtonLink to="/login">Đăng nhập bằng tài khoản quản trị</ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  function onLogout() {
    logout();
    nav("/");
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ink lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <Link to="/admin" className="text-lg font-extrabold text-white">
            Mono<span className="text-accent">.</span> Admin
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
          >
            <Store className="h-4.5 w-4.5" /> Về trang bán hàng
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink shadow-pop animate-fade-in">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="text-lg font-extrabold text-white">
                Mono<span className="text-accent">.</span> Admin
              </span>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-white/75 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-white/10 p-3">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
              >
                <Store className="h-4.5 w-4.5" /> Về trang bán hàng
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-subtle lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-muted">Trang quản trị</span>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-subtle"
            >
              {theme === "light" ? <MoonStar className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
            <div className="hidden items-center gap-2 pl-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {user.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="text-xs text-muted">{user.role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Đăng xuất"
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
