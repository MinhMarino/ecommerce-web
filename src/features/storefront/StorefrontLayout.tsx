import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Search,
  ShoppingCart,
  Sun,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useLockBodyScroll, useOnClickOutside, useSearchSuggestions } from "../../lib/hooks";
import { useApp } from "../../lib/store";
import { cn } from "../../lib/utils";
import { Container } from "../../components/ui/Container";

const NAV_LINKS: ReadonlyArray<{ to: string; label: string; highlighted?: boolean }> = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/products?flashSale=true", label: "Flash sale", highlighted: true },
  { to: "/products?sort=bestseller", label: "Bán chạy" },
  { to: "/products?sort=newest", label: "Mới về" },
  { to: "/page/about", label: "Về Mono" },
];

function SearchBox({ onNavigate, className }: { onNavigate: () => void; className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useSearchSuggestions(query);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([wrapperRef], () => setOpen(false));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    setOpen(false);
    onNavigate();
    navigate(normalizedQuery ? `/products?q=${encodeURIComponent(normalizedQuery)}` : "/products");
  }

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit} role="search" className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Tìm sản phẩm, thương hiệu..."
          aria-label="Tìm kiếm sản phẩm"
          autoComplete="off"
          className="h-10 w-full rounded-xl border border-line bg-subtle pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
        />
      </form>

      {open && query.trim() && suggestions.length > 0 && (
        <ul
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-card border border-line bg-surface py-2 shadow-pop"
          aria-label="Gợi ý tìm kiếm"
        >
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.type}-${suggestion.id}`}>
              <Link
                to={`/products/${suggestion.slug}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
                className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-subtle hover:text-accent focus-visible:bg-subtle focus-visible:outline-none"
              >
                {suggestion.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StorefrontLayout() {
  const { user, logout, theme, toggleTheme, cartCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const currentPath = `${location.pathname}${location.search}`;
  const firstName = user?.fullName.trim().split(/\s+/)[0] || "Tài khoản";

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  function onLogout() {
    logout();
    setMobileOpen(false);
    navigate("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
      >
        Bỏ qua để đến nội dung chính
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-xl">
        <Container className="flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            aria-controls="storefront-mobile-menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <Link
            to="/"
            aria-label="Mono - Trang chủ"
            className="shrink-0 text-xl font-extrabold tracking-[-0.04em] text-ink sm:text-2xl"
          >
            Mono<span className="text-accent">.</span>
          </Link>

          <SearchBox onNavigate={() => setMobileOpen(false)} className="mx-auto hidden max-w-xl flex-1 md:block" />

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {theme === "light" ? (
                <MoonStar className="h-5 w-5" aria-hidden />
              ) : (
                <Sun className="h-5 w-5" aria-hidden />
              )}
            </button>

            {isStaff && (
              <Link
                to="/admin"
                className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-subtle hover:text-ink lg:flex"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Quản trị
              </Link>
            )}

            {user ? (
              <Link
                to="/account"
                className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-subtle hover:text-ink sm:flex"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                <span className="max-w-24 truncate">{firstName}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-subtle hover:text-ink sm:flex"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                Đăng nhập
              </Link>
            )}

            <Link
              to="/cart"
              aria-label={cartCount > 0 ? `Giỏ hàng, ${cartCount} sản phẩm` : "Giỏ hàng"}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink ring-2 ring-surface">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </Container>

        <Container className="pb-3 md:hidden">
          <SearchBox onNavigate={() => setMobileOpen(false)} />
        </Container>

        <nav className="hidden border-t border-line md:block" aria-label="Điều hướng cửa hàng">
          <Container className="flex h-11 items-center gap-7 overflow-x-auto text-sm no-scrollbar">
            {NAV_LINKS.map((item) => {
              const active = currentPath === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-full shrink-0 items-center gap-1.5 border-b-2 border-transparent font-medium text-muted hover:text-ink",
                    active && "border-accent text-ink",
                    item.highlighted && "text-accent",
                  )}
                >
                  {item.highlighted && <Zap className="h-3.5 w-3.5 fill-accent" aria-hidden />}
                  {item.label}
                </Link>
              );
            })}
          </Container>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/45"
          />
          <aside
            id="storefront-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu cửa hàng"
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto border-r border-line bg-surface p-5 shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <Link to="/" className="text-xl font-extrabold tracking-[-0.04em]">
                Mono<span className="text-accent">.</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {user && (
              <div className="my-4 rounded-card border border-line bg-subtle p-4">
                <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
              </div>
            )}

            <nav className="grid gap-1 py-4" aria-label="Điều hướng di động">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-subtle",
                    item.highlighted && "text-accent",
                  )}
                >
                  {item.highlighted && <Zap className="h-4 w-4 fill-accent" aria-hidden />}
                  {item.label}
                </Link>
              ))}
              <Link
                to="/cart"
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-subtle"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Giỏ hàng {cartCount > 0 && <span className="text-accent">({cartCount})</span>}
              </Link>
            </nav>

            <div className="mt-auto grid gap-1 border-t border-line pt-4">
              {user ? (
                <>
                  <Link
                    to="/account"
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-subtle"
                  >
                    <UserRound className="h-4 w-4" aria-hidden />
                    Tài khoản & đơn hàng
                  </Link>
                  {isStaff && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-subtle"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden />
                      Trang quản trị
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-muted hover:bg-subtle hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink hover:bg-accent-hover"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <Container className="grid gap-8 py-10 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" className="text-xl font-extrabold tracking-[-0.04em] text-ink">
              Mono<span className="text-accent">.</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-muted">
              Sản phẩm được tuyển chọn, trải nghiệm mua sắm rõ ràng và giao hàng toàn quốc.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Mua sắm</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              <li><Link to="/products" className="hover:text-accent">Tất cả sản phẩm</Link></li>
              <li><Link to="/products?sort=bestseller" className="hover:text-accent">Sản phẩm bán chạy</Link></li>
              <li><Link to="/account" className="hover:text-accent">Theo dõi đơn hàng</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Thông tin</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              <li><Link to="/page/about" className="hover:text-accent">Về chúng tôi</Link></li>
              <li><Link to="/page/shipping-policy" className="hover:text-accent">Vận chuyển</Link></li>
              <li><Link to="/page/return-policy" className="hover:text-accent">Đổi trả</Link></li>
              <li><Link to="/page/contact" className="hover:text-accent">Liên hệ</Link></li>
            </ul>
          </div>
        </Container>

        <div className="border-t border-line">
          <Container className="flex flex-col gap-1 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Mono Commerce.</p>
            <p>Thanh toán an toàn · Hỗ trợ COD</p>
          </Container>
        </div>
      </footer>
    </div>
  );
}
