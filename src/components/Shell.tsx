import { Link, NavLink, Outlet } from "react-router-dom";
import { useApp } from "../lib/store";

export function Shell() {
  const { user, logout, theme, toggleTheme } = useApp();

  return (
    <div>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(10px)",
          background: "color-mix(in srgb, var(--bg) 86%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            minHeight: 68,
          }}
        >
          <Link to="/" className="brand-font" style={{ fontSize: "1.35rem" }}>
            Mono Commerce
          </Link>
          <nav style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <NavLink to="/products">Sản phẩm</NavLink>
            <NavLink to="/cart">Giỏ hàng</NavLink>
            {user ? (
              <>
                <NavLink to="/account">Tài khoản</NavLink>
                {(user.role === "ADMIN" || user.role === "STAFF") && (
                  <NavLink to="/admin">Admin</NavLink>
                )}
                <button className="btn secondary" type="button" onClick={logout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <NavLink className="btn" to="/login">
                Đăng nhập
              </NavLink>
            )}
            <button className="btn secondary" type="button" onClick={toggleTheme}>
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer
        style={{
          marginTop: "3rem",
          borderTop: "1px solid var(--line)",
          padding: "2.5rem 0",
          color: "var(--muted)",
        }}
      >
        <div className="container" style={{ display: "grid", gap: "0.75rem" }}>
          <strong className="brand-font" style={{ color: "var(--ink)", fontSize: "1.2rem" }}>
            Mono Commerce
          </strong>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/page/about">Giới thiệu</Link>
            <Link to="/page/terms">Điều khoản</Link>
            <Link to="/page/privacy">Bảo mật</Link>
            <Link to="/page/shipping-policy">Vận chuyển</Link>
          </div>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Mono Commerce</p>
        </div>
      </footer>
    </div>
  );
}
