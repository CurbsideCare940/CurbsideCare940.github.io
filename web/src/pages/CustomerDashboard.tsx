import { useAppView, type AppView } from "@/lib/app-context";
import AppLayout from "@/AppLayout";
import OverviewPage from "./OverviewPage";
import SubscriptionPage from "./SubscriptionPage";
import ProfilePage from "./ProfilePage";
import SupportPage from "./SupportPage";
import ReferralPage from "./ReferralPage";

const customerNav: { to: AppView; label: string }[] = [
  { to: "customer-overview", label: "Overview" },
  { to: "customer-subscription", label: "Billing" },
  { to: "customer-profile", label: "Profile & Bins" },
  { to: "customer-support", label: "Support" },
  { to: "customer-referral", label: "Refer a Neighbor" },
];

export default function CustomerDashboard() {
  const { view } = useAppView();
  return (
    <AppLayout navItems={customerNav}>
      {view === "customer-overview" && <OverviewPage />}
      {view === "customer-subscription" && <SubscriptionPage />}
      {view === "customer-profile" && <ProfilePage />}
      {view === "customer-support" && <SupportPage />}
      {view === "customer-referral" && <ReferralPage />}
    </AppLayout>
  );
}
