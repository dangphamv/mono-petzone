-- =====================================================
-- Payments v1: cash-on-checkin method.
-- Owner mang tiền mặt trả provider tại điểm check-in.
-- Không có gateway, không có IPN — provider tự xác nhận
-- qua endpoint POST /api/payments/:id/confirm-cash.
--
-- Tiền KHÔNG qua PetZone, KHÔNG qua bank — luồng tin cậy
-- giữa owner ↔ provider tại điểm vật lý.
-- =====================================================

-- 1. Add 'cash' to payments.method enum
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check
  check (method in ('momo', 'zalopay', 'vnpay', 'bank_transfer', 'vietqr', 'cash'));

-- 2. Enable cash method by default (admin có thể tắt qua config UI)
insert into public.app_config (key, value)
values ('cash_enabled', 'true'::jsonb)
on conflict (key) do nothing;
