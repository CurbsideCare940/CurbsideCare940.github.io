import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAppView } from "@/lib/app-context";

import LoginPage from "@/pages/LoginPage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  const { role, signedIn, loading } = useAuth();
  const { view, setView } = useAppView();

  // Resolve the top-level section from auth state on first load.
  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      setView("login");
      return;
    }
    if (role === "admin") {
      if (!view.startsWith("admin-")) setView("admin-overview");
    } else if (role === "customer") {
      if (!view.startsWith("customer-")) setView("customer-overview");
    }
  }, [loading, signedIn, role, view, setView]);

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  // Employee role is refused in AuthProvider.signIn (AuthProvider throws).
  if (!signedIn) return <LoginPage />;
  if (role === "admin") return <AdminDashboard />;
  if (role === "customer") return <CustomerDashboard />;

  // Fallback (e.g. employee that slipped through) -> back to login.
  return <LoginPage />;
}
