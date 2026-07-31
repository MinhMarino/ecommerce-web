import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { AdminCouponsPage } from "./features/admin/AdminCouponsPage";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminOrderDetailPage } from "./features/admin/AdminOrderDetailPage";
import { AdminOrdersPage } from "./features/admin/AdminOrdersPage";
import { AdminProductsPage } from "./features/admin/AdminProductsPage";
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./features/auth/AuthPages";
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  OrderDetailPage,
} from "./features/storefront/CommercePages";
import { HomePage } from "./features/storefront/HomePage";
import { ProductDetailPage } from "./features/storefront/ProductDetailPage";
import { ProductsPage } from "./features/storefront/ProductsPage";
import { StaticPage } from "./features/storefront/StaticPages";
import { StorefrontLayout } from "./features/storefront/StorefrontLayout";
import { AppProvider } from "./lib/store";
import { ToastProvider } from "./lib/toast";

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            </Route>

            <Route element={<StorefrontLayout />}>
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
