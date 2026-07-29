import { useRef, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MoonStar,
  Package,
  Phone,
  Search,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";
import { useApp } from "../lib/store";
import { useOnClickOutside, useSearchSuggestions } from "../lib/hooks";
import { cn } from "../lib/utils";
import { Container } from "./ui/Container";

const NAV_LINKS = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/products?flashSale=true", label: "Flash Sale" },
  { to: "/page/about", label: "Giới thiệu" },
  { to: "/page/contact", label: "Liên hệ" },
];

function SearchBox({ onNavigate, className }: { onNavigate: () => void; className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useSearchSuggestions(q);
  const nav = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([wrapRef], () => setOpen(false));

  function submit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    onNavigate();
    nav(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
  }

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit} role="search" className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Tìm sản phẩm, thương hiệu..."
          aria-label="Tìm kiếm sản phẩm"
          className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </form>
      {open && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-surface py-2 shadow-pop">
          {suggestions.map((s) => (
            <li key={s.slug}>
              <Link
                to={`/products/${s.slug}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
                className="block px-4 py-2 text-sm text-ink hover:bg-subtle"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Shell() {
  const { user, logout, theme, toggleTheme, cartCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  function onLogout() {
    logout();
    setMobileOpen(false);
    nav("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Bỏ qua và đến nội dung chính
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <Container className="flex h-16 items-center gap-4 sm:h-[72px]">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-subtle lg:hidden"
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="font-serif text-xl font-semibold shrink-0 sm:text-2xl">
            Mono<span className="text-accent">Commerce</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "transition-colors hover:text-accent",
                    isActive ? "text-accent" : "text-ink",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <SearchBox onNavigate={() => setMobileOpen(false)} className="ml-auto hidden max-w-sm md:block" />

          <div className="ml-auto flex items-center gap-1.5 sm:ml-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-subtle"
            >
              {theme === "light" ? <MoonStar className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-subtle"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                {isStaff && (
                  <Link
                    to="/admin"
                    className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink hover:bg-subtle"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Admin
                  </Link>
                )}
                <Link
                  to="/account"
                  className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink hover:bg-subtle"
                >
                  <User className="h-4 w-4" />
                  {user.fullName.split(" ")[0]}
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Đăng xuất"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-subtle"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink hover:bg-accent-hover sm:flex"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </Container>

        <Container className="pb-3 md:hidden">
          <SearchBox onNavigate={() => setMobileOpen(false)} />
        </Container>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col gap-1 overflow-y-auto bg-surface p-5 shadow-pop animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-lg font-semibold">Menu</span>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-subtle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-subtle p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.fullName}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>
            )}

            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-subtle"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-subtle"
            >
              <ShoppingCart className="h-4 w-4" /> Giỏ hàng
              {cartCount > 0 && <span className="text-accent">({cartCount})</span>}
            </Link>

            <div className="my-2 h-px bg-line" />

            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-subtle"
                >
                  <User className="h-4 w-4" /> Tài khoản
                </Link>
                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-subtle"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Trang quản trị
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-ink"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-subtle/60">
        <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="font-serif text-xl font-semibold">
              Mono<span className="text-accent">Commerce</span>
            </Link>
            <p className="text-sm text-muted">
              Nền tảng mua sắm hiện đại — catalog, giỏ hàng, thanh toán COD và quản trị vận hành trong một hệ thống.
            </p>
            <div className="flex gap-2 pt-1">
              {[Mail, Phone].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/page/faq" className="hover:text-accent">Câu hỏi thường gặp</Link></li>
              <li><Link to="/page/shipping-policy" className="hover:text-accent">Chính sách vận chuyển</Link></li>
              <li><Link to="/page/return-policy" className="hover:text-accent">Chính sách đổi trả</Link></li>
              <li><Link to="/orders" className="hover:text-accent">Theo dõi đơn hàng</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Về chúng tôi</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/page/about" className="hover:text-accent">Giới thiệu</Link></li>
              <li><Link to="/page/terms" className="hover:text-accent">Điều khoản dịch vụ</Link></li>
              <li><Link to="/page/privacy" className="hover:text-accent">Chính sách bảo mật</Link></li>
              <li><Link to="/page/contact" className="hover:text-accent">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Liên hệ</h3>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 shrink-0" /> TP. Hồ Chí Minh, Việt Nam
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> 1900 1234
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" /> support@monocommerce.vn
              </li>
            </ul>
          </div>
        </Container>
        <div className="border-t border-line py-5">
          <Container className="flex flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} Mono Commerce. Đã đăng ký bản quyền.</p>
            <p>Thanh toán khi nhận hàng (COD)</p>
          </Container>
        </div>
      </footer>
    </div>
  );
}
