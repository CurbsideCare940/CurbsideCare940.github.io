import { supabase } from "./supabase";

// ----- Shared types (mirror your Postgres schema) -----
export interface CustomerProfile {
  profile_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  customers: {
    id: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    number_of_bins: number;
    return_location: string;
    access_notes: string | null;
    official_pickup_day: string;
    zone_code: string | null;
    active: boolean;
  } | null;
}

export interface SubscriptionRow {
  id: string;
  customer_id: string;
  paypal_subscription_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  last_payment_at: string | null;
  billing_anchor_day: number;
}

export interface PaymentRow {
  id: string;
  amount_cents: number;
  status: string;
  paid_at: string | null;
  paypal_transaction_id: string | null;
}

export interface SupportTicket {
  id: string;
  category: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ----- Reads (run under the user's anon JWT → RLS enforced) -----

export async function fetchCustomerProfile(): Promise<CustomerProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `full_name, email, phone,
       customers!inner(id, address, city, state, postal_code, number_of_bins, return_location, access_notes, official_pickup_day, zone_code, active)`,
    )
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const custArr: any[] = (data as any)?.customers ?? [];
  const cust = custArr[0];
  if (!cust) throw new Error("No customer profile found");
  return {
    profile_id: user.id,
    email: data!.email,
    full_name: data!.full_name,
    phone: data!.phone,
    customers: cust,
  };
}

export async function fetchSubscription(): Promise<SubscriptionRow | null> {
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select(`id, customers!inner(id)`)
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (profErr) throw profErr;
  const customerId = (prof as any)?.customers?.[0]?.id;
  if (!customerId) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as SubscriptionRow | null;
}

export async function fetchPayments(limit = 12): Promise<PaymentRow[]> {
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select(`id, customers!inner(id)`)
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (profErr) {
    const msg = (profErr as any).message ?? "";
    // No customer record yet is normal (not an error): just no payments.
    if (msg.includes("0 rows") || msg.includes("no rows")) return [];
    throw profErr;
  }
  const customerId = (prof as any)?.customers?.[0]?.id;
  if (!customerId) return [];
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("paid_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentRow[];
}

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, category, message, status, admin_response, created_at, resolved_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SupportTicket[];
}

export async function createSupportTicket(
  category: string,
  message: string,
) {
  // The support_tickets insert policy requires the customer's own id.
  const { data: cust, error: custErr } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (custErr) throw new Error(custErr.message);
  const customerId = cust?.id;
  if (!customerId) throw new Error("Customer record not found");

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ customer_id: customerId, category, message })
    .select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

// ----- Writes -----

export async function updateCustomerProfile(updates: {
  phone?: string | null;
  full_name?: string;
  number_of_bins?: number;
  return_location?: string;
  access_notes?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (updates.phone !== undefined || updates.full_name !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.full_name ? { full_name: updates.full_name } : {}),
      })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  }

  const { error: custErr } = await supabase
    .from("customers")
    .update({
      ...(updates.number_of_bins !== undefined
        ? { number_of_bins: updates.number_of_bins }
        : {}),
      ...(updates.return_location !== undefined
        ? { return_location: updates.return_location }
        : {}),
      ...(updates.access_notes !== undefined
        ? { access_notes: updates.access_notes }
        : {}),
    })
    .eq("profile_id", user.id);
  if (custErr) throw new Error(custErr.message);
  return true;
}

export async function refreshSubscriptionFromPayPal() {
  // Reuse the same Edge Function the mobile app calls. It verifies the
  // customer's PayPal subscription via the server-side secret and returns
  // { status, paypalSubscriptionId, nextBillingDate }.
  const { data, error } = await supabase.functions.invoke("paypal-status", {
    body: {},
  });
  if (error) throw new Error(error.message);
  return data as {
    status: string;
    paypalSubscriptionId: string | null;
    nextBillingDate: string | null;
  };
}

// ----- Admin helpers (run as the logged-in admin → RLS is_admin()) -----

export interface AdminCustomerRow {
  profile_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  customers: {
    id: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    number_of_bins: number;
    return_location: string;
    official_pickup_day: string;
    zone_code: string | null;
    active: boolean;
  } | null;
  subscriptions: {
    status: string;
    paypal_subscription_id: string | null;
    next_billing_date: string | null;
  } | null;
}

export async function fetchAllCustomers(): Promise<AdminCustomerRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, full_name, email, phone,
       customers(id, address, city, state, postal_code, number_of_bins, return_location, official_pickup_day, zone_code, active),
       subscriptions(status, paypal_subscription_id, next_billing_date)`,
    )
    .eq("role", "customer");
  if (error) throw new Error(error.message);
  // PostgREST returns nested 1:1 relations as arrays; normalize to single objects.
  return ((data ?? []) as any[]).map((p) => ({
    profile_id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    customers: Array.isArray(p.customers) ? p.customers[0] ?? null : p.customers ?? null,
    subscriptions: Array.isArray(p.subscriptions)
      ? p.subscriptions[0] ?? null
      : p.subscriptions ?? null,
  }));
}

export interface TicketRow {
  id: string;
  category: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
  customer: { full_name: string; email: string } | null;
}

export async function fetchAllTickets(): Promise<TicketRow[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      `id, category, message, status, admin_response, created_at, resolved_at,
       customers!inner(profiles!inner(full_name, email))`,
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  // Normalize the nested embed to { customer: { full_name, email } }.
  return (data ?? []).map((t) => {
    const raw: any = t;
    const cust = raw.customers?.profiles;
    return {
      id: raw.id,
      category: raw.category,
      message: raw.message,
      status: raw.status,
      admin_response: raw.admin_response,
      created_at: raw.created_at,
      resolved_at: raw.resolved_at,
      customer: cust ? { full_name: cust.full_name, email: cust.email } : null,
    };
  });
}

export async function fetchZones() {
  const { data, error } = await supabase
    .from("service_zones")
    .select("zone_code, official_pickup_day, service_night, active")
    .order("zone_code");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Admin actions reuse the secured Edge Functions (service-role, admin-checked).
export async function adminCreateUser(payload: {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "employee" | "customer";
  phone?: string;
}) {
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: payload,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminResetPassword(payload: {
  email: string;
  newPassword: string;
  forceChange?: boolean;
}) {
  const { data, error } = await supabase.functions.invoke(
    "admin-reset-password",
    { body: payload },
  );
  if (error) throw new Error(error.message);
  return data;
}

// ----- Customer referrals ----
// A customer's shareable referral code is their own customers.id (stable + unique).
// When a friend signs up via enroll-guest with ?ref=<code>, a referrals row is
// recorded (see migration 0013 + enroll-guest referralCode handling).

export async function getCustomerId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export interface ReferralRow {
  id: string;
  referred_email: string | null;
  created_at: string;
}

export async function fetchMyReferrals(): Promise<ReferralRow[]> {
  const customerId = await getCustomerId();
  if (!customerId) return [];
  const { data, error } = await supabase
    .from("referrals")
    .select("id, referred_email, created_at")
    .eq("referrer_customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReferralRow[];
}
