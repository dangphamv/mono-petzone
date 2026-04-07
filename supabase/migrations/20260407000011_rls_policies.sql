-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.otp_verifications enable row level security;
alter table public.refresh_tokens enable row level security;
alter table public.pets enable row level security;
alter table public.breeds enable row level security;
alter table public.providers enable row level security;
alter table public.room_types enable row level security;
alter table public.add_on_services enable row level security;
alter table public.provider_availability enable row level security;
alter table public.favorites enable row level security;
alter table public.search_history enable row level security;
alter table public.listing_change_log enable row level security;
alter table public.cancellation_reasons enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.escrow_ledger enable row level security;
alter table public.provider_payouts enable row level security;
alter table public.refunds enable row level security;
alter table public.check_in_photos enable row level security;
alter table public.status_reports enable row level security;
alter table public.report_reminders enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.call_logs enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.device_tokens enable row level security;
alter table public.notification_delivery_log enable row level security;
alter table public.disputes enable row level security;
alter table public.verification_history enable row level security;
alter table public.admin_action_log enable row level security;

-- Helper function: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable;

-- ===== PUBLIC READ tables =====

-- Breeds: public read
create policy "breeds_read" on public.breeds for select using (true);

-- Cancellation reasons: public read
create policy "cancellation_reasons_read" on public.cancellation_reasons for select using (true);

-- Providers: public read (approved + active only)
create policy "providers_public_read" on public.providers for select
  using (verification_status = 'approved' and is_active = true);

-- Providers: own provider can read any status
create policy "providers_own_read" on public.providers for select
  using (user_id = auth.uid());

-- Providers: admin can read all
create policy "providers_admin_read" on public.providers for select
  using (public.get_user_role() = 'admin');

-- Providers: owner can insert/update own
create policy "providers_own_write" on public.providers for insert
  with check (user_id = auth.uid());
create policy "providers_own_update" on public.providers for update
  using (user_id = auth.uid());

-- Room types: public read for active providers
create policy "room_types_public_read" on public.room_types for select using (true);
create policy "room_types_provider_write" on public.room_types for insert
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "room_types_provider_update" on public.room_types for update
  using (provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "room_types_provider_delete" on public.room_types for delete
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

-- Add-on services: same pattern as room types
create policy "add_ons_public_read" on public.add_on_services for select using (true);
create policy "add_ons_provider_write" on public.add_on_services for insert
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "add_ons_provider_update" on public.add_on_services for update
  using (provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "add_ons_provider_delete" on public.add_on_services for delete
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

-- Provider availability: public read
create policy "availability_public_read" on public.provider_availability for select using (true);
create policy "availability_provider_write" on public.provider_availability for all
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

-- Reviews: public read (visible only)
create policy "reviews_public_read" on public.reviews for select
  using (is_visible = true);
create policy "reviews_admin_read" on public.reviews for select
  using (public.get_user_role() = 'admin');

-- ===== USER-SCOPED tables =====

-- Users: read own, read public profiles
create policy "users_own_read" on public.users for select
  using (id = auth.uid());
create policy "users_public_read" on public.users for select
  using (status = 'active');
create policy "users_own_update" on public.users for update
  using (id = auth.uid());
create policy "users_admin_all" on public.users for all
  using (public.get_user_role() = 'admin');

-- Pets: owner CRUD
create policy "pets_owner_read" on public.pets for select
  using (owner_id = auth.uid());
create policy "pets_owner_write" on public.pets for insert
  with check (owner_id = auth.uid());
create policy "pets_owner_update" on public.pets for update
  using (owner_id = auth.uid());
create policy "pets_owner_delete" on public.pets for delete
  using (owner_id = auth.uid());

-- Favorites: own CRUD
create policy "favorites_own" on public.favorites for all
  using (user_id = auth.uid());

-- Search history: own
create policy "search_history_own" on public.search_history for all
  using (user_id = auth.uid());

-- ===== ORDER-SCOPED tables =====

-- Orders: owner or provider of the order
create policy "orders_own_read" on public.orders for select
  using (owner_id = auth.uid() or provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "orders_owner_insert" on public.orders for insert
  with check (owner_id = auth.uid());
create policy "orders_participant_update" on public.orders for update
  using (owner_id = auth.uid() or provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "orders_admin_all" on public.orders for all
  using (public.get_user_role() = 'admin');

-- Order status history: participants read
create policy "order_history_read" on public.order_status_history for select
  using (order_id in (
    select id from public.orders where owner_id = auth.uid()
    union
    select id from public.orders where provider_id in (select id from public.providers where user_id = auth.uid())
  ));

-- Payments: participants read
create policy "payments_read" on public.payments for select
  using (order_id in (
    select id from public.orders where owner_id = auth.uid()
    union
    select id from public.orders where provider_id in (select id from public.providers where user_id = auth.uid())
  ));

-- Check-in photos: participants
create policy "checkin_photos_read" on public.check_in_photos for select
  using (order_id in (
    select id from public.orders where owner_id = auth.uid()
    union
    select id from public.orders where provider_id in (select id from public.providers where user_id = auth.uid())
  ));
create policy "checkin_photos_insert" on public.check_in_photos for insert
  with check (uploaded_by = auth.uid());

-- Status reports: participants
create policy "status_reports_read" on public.status_reports for select
  using (order_id in (
    select id from public.orders where owner_id = auth.uid()
    union
    select id from public.orders where provider_id in (select id from public.providers where user_id = auth.uid())
  ));
create policy "status_reports_provider_insert" on public.status_reports for insert
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

-- ===== CHAT tables =====

-- Conversations: participants only
create policy "conversations_participant" on public.chat_conversations for select
  using (owner_id = auth.uid() or provider_id = auth.uid());
create policy "conversations_insert" on public.chat_conversations for insert
  with check (owner_id = auth.uid() or provider_id = auth.uid());

-- Messages: conversation participants
create policy "messages_read" on public.chat_messages for select
  using (conversation_id in (
    select id from public.chat_conversations where owner_id = auth.uid() or provider_id = auth.uid()
  ));
create policy "messages_insert" on public.chat_messages for insert
  with check (sender_id = auth.uid());
create policy "messages_update_read" on public.chat_messages for update
  using (conversation_id in (
    select id from public.chat_conversations where owner_id = auth.uid() or provider_id = auth.uid()
  ));

-- Call logs: participants
create policy "call_logs_read" on public.call_logs for select
  using (caller_id = auth.uid() or callee_id = auth.uid());

-- ===== NOTIFICATIONS =====

create policy "notifications_own" on public.notifications for select
  using (user_id = auth.uid());
create policy "notifications_own_update" on public.notifications for update
  using (user_id = auth.uid());
create policy "notifications_own_delete" on public.notifications for delete
  using (user_id = auth.uid());

create policy "device_tokens_own" on public.device_tokens for all
  using (user_id = auth.uid());

-- ===== REVIEWS =====

create policy "reviews_owner_insert" on public.reviews for insert
  with check (owner_id = auth.uid());
create policy "reviews_provider_update" on public.reviews for update
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

-- ===== ADMIN-ONLY tables =====

create policy "disputes_participant_read" on public.disputes for select
  using (opened_by = auth.uid() or public.get_user_role() = 'admin');
create policy "disputes_insert" on public.disputes for insert
  with check (opened_by = auth.uid());
create policy "disputes_admin_update" on public.disputes for update
  using (public.get_user_role() = 'admin');

create policy "verification_history_read" on public.verification_history for select
  using (public.get_user_role() = 'admin' or provider_id in (select id from public.providers where user_id = auth.uid()));

create policy "admin_action_log_admin" on public.admin_action_log for all
  using (public.get_user_role() = 'admin');

-- Provider payouts: provider read own, admin read all
create policy "payouts_provider_read" on public.provider_payouts for select
  using (provider_id in (select id from public.providers where user_id = auth.uid()));
create policy "payouts_admin_all" on public.provider_payouts for all
  using (public.get_user_role() = 'admin');

-- Escrow: admin only
create policy "escrow_admin" on public.escrow_ledger for all
  using (public.get_user_role() = 'admin');

-- Refunds: admin only
create policy "refunds_admin" on public.refunds for all
  using (public.get_user_role() = 'admin');

-- Listing change log: provider + admin
create policy "listing_log_read" on public.listing_change_log for select
  using (provider_id in (select id from public.providers where user_id = auth.uid()) or public.get_user_role() = 'admin');

-- OTP: service role only (no user-facing policy)
-- Refresh tokens: service role only

-- Report reminders: provider + admin
create policy "report_reminders_read" on public.report_reminders for select
  using (provider_id in (select id from public.providers where user_id = auth.uid()) or public.get_user_role() = 'admin');

-- Notification delivery log: admin only
create policy "delivery_log_admin" on public.notification_delivery_log for all
  using (public.get_user_role() = 'admin');
