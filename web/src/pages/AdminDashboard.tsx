import { useAppView, type AppView } from "@/lib/app-context";
import AppLayout from "@/AppLayout";
import AdminOverview from "./AdminOverview";
import CustomersPage from "./CustomersPage";
import TicketsPage from "./TicketsPage";
import ZonesPage from "./ZonesPage";
import PromoCodesPage from "./PromoCodesPage";

const navItems: { to: AppView; label: string }[] = [
  { to: "admin-overview", label: "Overview" },
  { to: "admin-customers", label: "Customers" },
  { to: "admin-tickets", label: "Support" },
  { to: "admin-zones", label: "Zones" },
  { to: "admin-promo-codes", label: "Promo Codes" },
];

export default function AdminDashboard() {
  const { view } = useAppView();
  return (
    <AppLayout navItems={navItems}>
      {view === "admin-customers" && <CustomersPage />}
      {view === "admin-tickets" && <TicketsPage />}
      {view === "admin-zones" && <ZonesPage />}
      {view === "admin-promo-codes" && <PromoCodesPage />}
      {view === "admin-overview" && <AdminOverview />}
    </AppLayout>
  );
}
