import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Package,
  ShoppingBag,
  Store,
  Sun,
  Tags,
  X,
} from "lucide-react";
import { useApp } from "../../lib/store";
import { cn } from "../../lib/utils";
import { ErrorState } from "../../components/ui/EmptyState";
import { ButtonLink } from "../../components/ui/Button";

type MenuItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: "exact" | "prefix";
  query?: { key: string; value: string };
};

const MENU_GROUPS: { label: string; items: MenuItem[] }[] = [
  {
    label: "Tổng quan",
    items: [
      {
        to: "/admin",
        label: "Tổng quan",
        icon: LayoutDashboard,
        match: "exact",
      },
    ],
  },
  {
    label: "Vận hành",
    items: [
      {
        to: "/admin/products",
        label: "Sản phẩm",
        icon: Package,
        match: "prefix",
      },
      {
        to: "/admin/orders",
        label: "Đơn hàng",
        icon: ShoppingBag,
        match: "prefix",
      },
      {
        to: "/admin/coupons",
        label: "Mã giảm giá",
        icon: Tags,
        match: "exact",
      },
    ],
  },
  {
    label: "Lối tắt",
    items: [
      {
        to: "/admin/products?status=DRAFT",
        label: "Sản phẩm nháp",
        icon: FileText,
        match: "exact",
        query: { key: "status", value: "DRAFT" },
      },
      {
        to: "/admin/products?status=HIDDEN",
        label: "Sản phẩm đã ẩn",
        icon: EyeOff,
        match: "exact",
        query: { key: "status", value: "HIDDEN" },
      },
    ],
  },
];

function isMenuItemActive(item: MenuItem, pathname: string, search: string) {
  const itemPath = item.to.split("?")[0];
  const pathMatches =
    item.match === "exact"
      ? pathname === itemPath
      : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

  if (!pathMatches) return false;

  const params = new URLSearchParams(search);
  if (item.query) return params.get(item.query.key) === item.query.value;

  if (itemPath === "/admin/products") {
    const status = params.get("status");
    return status !== "DRAFT" && status !== "HIDDEN";
  }

  return true;
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname, search } = useLocation();

  return (
    <nav aria-label="Điều hướng quản trị" className="space-y-6 px-3 py-5">
      {MENU_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-muted/70">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isMenuItemActive(item, pathname, search);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none",
                    "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-admin",
                    active
                      ? "bg-accent text-accent-ink shadow-sm"
                      : "text-admin-muted hover:bg-white/8 hover:text-white",
                  )}
                >
                  <item.icon
                    aria-hidden="true"
                    className={cn(
                      "h-4.5 w-4.5 shrink-0",
                      !active && "text-admin-muted group-hover:text-white",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AdminBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/admin"
      onClick={onNavigate}
      className="inline-flex items-center gap-3 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-black text-accent-ink">
        M
      </span>
      <span className="text-base font-bold tracking-tight">Mono Admin</span>
    </Link>
  );
}

function StorefrontFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-white/10 p-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-admin-muted outline-none hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Store aria-hidden="true" className="h-4.5 w-4.5" />
        <span>Về trang bán hàng</span>
        <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4" />
      </Link>
    </div>
  );
}

function getRouteMeta(pathname: string) {
  if (pathname === "/admin/products/new") {
    return { title: "Tạo sản phẩm", parent: "Sản phẩm" };
  }
  if (pathname.startsWith("/admin/products/") && pathname.endsWith("/edit")) {
    return { title: "Chỉnh sửa sản phẩm", parent: "Sản phẩm" };
  }
  if (pathname.startsWith("/admin/orders/")) {
    return { title: "Chi tiết đơn hàng", parent: "Đơn hàng" };
  }
  if (pathname === "/admin/orders") return { title: "Đơn hàng" };
  if (pathname === "/admin/products") return { title: "Sản phẩm" };
  if (pathname === "/admin/coupons") return { title: "Mã giảm giá" };
  return { title: "Tổng quan" };
}

export function AdminLayout() {
  const { user, logout, theme, toggleTheme } = useApp();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const menuButton = menuButtonRef.current;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onDesktopChange(event: MediaQueryListEvent) {
      if (event.matches) setMobileOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    desktopQuery.addEventListener("change", onDesktopChange);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktopQuery.removeEventListener("change", onDesktopChange);

      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else {
        menuButton?.focus();
      }
    };
  }, [mobileOpen]);

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

  async function onLogout() {
    await logout();
    nav("/");
  }

  const routeMeta = getRouteMeta(pathname);
  const userInitial = (user.fullName.trim()[0] || user.email[0] || "M").toUpperCase();
  const roleLabel = user.role === "ADMIN" ? "Quản trị viên" : "Nhân viên";

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-admin lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
          <AdminBrand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <StorefrontFooter />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
          />
          <aside
            ref={drawerRef}
            id="admin-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mobile-navigation-title"
            className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-admin shadow-pop animate-slide-in"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
              <div id="admin-mobile-navigation-title">
                <AdminBrand onNavigate={() => setMobileOpen(false)} />
              </div>
              <button
                type="button"
                data-drawer-close
                aria-label="Đóng menu quản trị"
                onClick={() => setMobileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl text-admin-muted outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
            <StorefrontFooter onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Mở menu quản trị"
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-navigation"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <nav aria-label="Đường dẫn trang" className="flex items-center gap-1 text-[11px] font-medium text-muted">
              <span>Quản trị</span>
              {routeMeta.parent && (
                <>
                  <ChevronRight aria-hidden="true" className="h-3 w-3" />
                  <span>{routeMeta.parent}</span>
                </>
              )}
            </nav>
            <p className="truncate text-sm font-bold text-ink sm:text-base">{routeMeta.title}</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              className="grid h-10 w-10 place-items-center rounded-xl text-muted outline-none hover:bg-subtle hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
            >
              {theme === "light" ? (
                <MoonStar aria-hidden="true" className="h-4.5 w-4.5" />
              ) : (
                <Sun aria-hidden="true" className="h-4.5 w-4.5" />
              )}
            </button>

            <div className="flex items-center gap-2 border-l border-line pl-2 sm:pl-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/12 text-sm font-bold text-accent ring-1 ring-accent/20">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="hidden max-w-36 leading-tight md:block">
                <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
                <p className="truncate text-xs text-muted">{roleLabel}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onLogout()}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-muted outline-none hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger sm:px-3"
            >
              <LogOut aria-hidden="true" className="h-4.5 w-4.5" />
              <span className="hidden text-sm font-semibold xl:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
