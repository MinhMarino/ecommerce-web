import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./lib/store";
import { ToastProvider } from "./lib/toast";
import { Shell } from "./components/Shell";
import { AdminLayout } from "./components/admin/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./pages/AuthPages";
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  OrderDetailPage,
} from "./pages/CommercePages";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage";
import { StaticPage } from "./pages/StaticPages";

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            {/* Admin back office — own layout with sidebar, outside the storefront Shell */}
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            </Route>

            {/* Storefront */}
            <Route element={<Shell />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:slug" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="page/:slug" element={<StaticPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
