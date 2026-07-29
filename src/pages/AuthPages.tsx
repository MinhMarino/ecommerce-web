import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Lock, Mail, MailCheck, Phone, User } from "lucide-react";
import { api, setTokens } from "../lib/api";
import { useApp, type AuthUser } from "../lib/store";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Container className="flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </Container>
  );
}

export function LoginPage() {
  const { setSessionUser } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ user: AuthUser; accessToken: string; refreshToken: string }>(
        "/api/v1/auth/login",
        { method: "POST", auth: false, body: JSON.stringify({ email, password, rememberMe }) },
      );
      setTokens(data.accessToken, data.refreshToken);
      setSessionUser(data.user);
      nav(data.user.role === "ADMIN" || data.user.role === "STAFF" ? "/admin" : "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Đăng nhập"
      subtitle="Chào mừng bạn trở lại"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required icon={<Mail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" required icon={<Lock className="h-4 w-4" />} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            Ghi nhớ đăng nhập
          </label>
          <Link to="/forgot-password" className="font-medium text-accent hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Đăng nhập
        </Button>
      </form>
    </AuthCard>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ message: string; verifyToken?: string }>("/api/v1/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify(form),
      });
      setMsg(data.message + (data.verifyToken ? ` (dev token: ${data.verifyToken})` : ""));
      setTimeout(() => nav("/login"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Tạo tài khoản"
      subtitle="Đăng ký để mua sắm và theo dõi đơn hàng"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" required icon={<User className="h-4 w-4" />} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" required icon={<Mail className="h-4 w-4" />} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input id="phone" icon={<Phone className="h-4 w-4" />} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="reg-password">Mật khẩu</Label>
          <Input id="reg-password" type="password" required minLength={8} icon={<Lock className="h-4 w-4" />} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p className="mt-1.5 text-xs text-muted">Tối thiểu 8 ký tự</p>
        </div>
        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Tạo tài khoản
        </Button>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ message: string; resetToken?: string }>("/api/v1/auth/password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      });
      setMsg(data.message + (data.resetToken ? ` (dev token: ${data.resetToken})` : ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
      footer={
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fp-email">Email</Label>
          <Input id="fp-email" type="email" required icon={<Mail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Gửi liên kết đặt lại
        </Button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setToken(t);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/v1/auth/password", {
        method: "PUT",
        auth: false,
        body: JSON.stringify({ token, password }),
      });
      setMsg("Đã cập nhật mật khẩu thành công. Bạn có thể đăng nhập lại.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Đặt lại mật khẩu">
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="token">Mã xác nhận</Label>
          <Input id="token" required icon={<KeyRound className="h-4 w-4" />} value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input id="new-password" type="password" required minLength={8} icon={<Lock className="h-4 w-4" />} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Lưu mật khẩu mới
        </Button>
      </form>
    </AuthCard>
  );
}

export function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [msg, setMsg] = useState("Đang xác thực email...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMsg("Thiếu mã xác thực");
      return;
    }
    api("/api/v1/auth/verify-email", { method: "POST", auth: false, body: JSON.stringify({ token }) })
      .then(() => {
        setStatus("success");
        setMsg("Email của bạn đã được xác thực thành công");
      })
      .catch((e) => {
        setStatus("error");
        setMsg(e.message);
      });
  }, []);

  return (
    <AuthCard title="Xác thực email">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className={status === "success" ? "text-ok" : status === "error" ? "text-danger" : "text-accent"}>
          <MailCheck className="h-10 w-10" />
        </div>
        <p className="text-sm text-muted">{msg}</p>
        {status !== "loading" && (
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Đến trang đăng nhập
          </Link>
        )}
      </div>
    </AuthCard>
  );
}
