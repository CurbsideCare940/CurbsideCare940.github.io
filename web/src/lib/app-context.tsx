import { createContext, useContext, useState, type ReactNode, type CSSProperties } from "react";

// Simple in-app view routing (no extra deps). Drives the side nav for both
// the customer and admin shells.
export type AppView =
  | "login"
  | "customer-overview"
  | "customer-subscription"
  | "customer-profile"
  | "customer-support"
  | "customer-referral"
  | "admin-overview"
  | "admin-customers"
  | "admin-tickets"
  | "admin-zones";

interface Ctx {
  view: AppView;
  setView: (v: AppView) => void;
}

const AppViewContext = createContext<Ctx | null>(null);

const BASE = "/app";

export function AppViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("login");
  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
}

export function useAppView() {
  const ctx = useContext(AppViewContext);
  if (!ctx) throw new Error("useAppView used outside AppViewProvider");
  return ctx;
}

// A minimal nav link that switches views without a real router.
export function ViewLink({
  to,
  children,
  className,
  style,
}: {
  to: AppView;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { setView } = useAppView();
  return (
    <a
      className={className}
      style={style}
      href={`${BASE}#${to}`}
      onClick={(e) => {
        e.preventDefault();
        setView(to);
      }}
    >
      {children}
    </a>
  );
}
