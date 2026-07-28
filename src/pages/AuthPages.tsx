import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setTokens } from "../lib/api";
import { useApp } from "../lib/store";

export function LoginPage() {
  const { setSessionUser } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api<{
        user: any;
        accessToken: string;
        refreshToken: string;
      }>("/api/v1/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password, rememberMe }),
      });
      setTokens(data.accessToken, data.refreshToken);
      setSessionUser(data.user);
      nav(data.user.role === "ADMIN" || data.user.role === "STAFF" ? "/admin" : "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <h1>Đăng nhập</h1>
      {error ? <div className="banner error">{error}</div> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.7rem" }}>
        <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" required placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Ghi nhớ đăng nhập
        </label>
        <button className="btn" type="submit">
          Đăng nhập
        </button>
      </form>
      <p>
        <Link to="/forgot-password">Quên mật khẩu</Link> · <Link to="/register">Đăng ký</Link>
      </p>
    </div>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api<{ message: string; verifyToken?: string }>("/api/v1/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify(form),
      });
      setMsg(data.message + (data.verifyToken ? ` (dev token: ${data.verifyToken})` : ""));
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <h1>Đăng ký</h1>
      {error ? <div className="banner error">{error}</div> : null}
      {msg ? <div className="banner">{msg}</div> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.7rem" }}>
        <input className="input" required placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="input" type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" type="password" required minLength={8} placeholder="Mật khẩu (>=8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn" type="submit">
          Tạo tài khoản
        </button>
      </form>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const data = await api<{ message: string; resetToken?: string }>("/api/v1/auth/password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email }),
    });
    setMsg(data.message + (data.resetToken ? ` (dev token: ${data.resetToken})` : ""));
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <h1>Quên mật khẩu</h1>
      {msg ? <div className="banner">{msg}</div> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.7rem" }}>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <button className="btn" type="submit">
          Gửi link đặt lại
        </button>
      </form>
    </div>
  );
}

export function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setToken(t);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api("/api/v1/auth/password", {
      method: "PUT",
      auth: false,
      body: JSON.stringify({ token, password }),
    });
    setMsg("Đã cập nhật mật khẩu");
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <h1>Đặt lại mật khẩu</h1>
      {msg ? <div className="banner">{msg}</div> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.7rem" }}>
        <input className="input" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" />
        <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu mới" />
        <button className="btn" type="submit">
          Lưu mật khẩu
        </button>
      </form>
    </div>
  );
}

export function VerifyEmailPage() {
  const [msg, setMsg] = useState("Đang xác thực...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMsg("Thiếu token");
      return;
    }
    api("/api/v1/auth/verify-email", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ token }),
    })
      .then(() => setMsg("Email đã xác thực thành công"))
      .catch((e) => setMsg(e.message));
  }, []);

  return (
    <div className="container section">
      <h1>Xác thực email</h1>
      <p>{msg}</p>
    </div>
  );
}
