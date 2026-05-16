export const USER_COLUMNS = 'id, display_id, phone, email, full_name, avatar_url, role, status, social_provider, social_id, notification_preferences, terms_accepted_at, last_login_at, created_at, updated_at';
export const USER_PUBLIC_COLUMNS = 'id, display_id, full_name, avatar_url, role';

export const PET_COLUMNS = 'id, display_id, owner_id, name, species, breed, gender, date_of_birth, weight_kg, color, photos, vaccination_records, allergies, chronic_conditions, current_medications, is_neutered, temperament, sociable_with_others, special_needs_notes, emergency_vet_name, emergency_vet_phone, is_active, created_at, updated_at';
export const BREED_COLUMNS = 'id, species, name_vi, name_en, popularity_rank';

export const PROVIDER_COLUMNS = 'id, display_id, user_id, business_name, description, license_number, license_photos, address, latitude, longitude, phone, facility_photos, certification_photos, accepted_species, weight_limit_min_kg, weight_limit_max_kg, cancellation_policy, verification_status, rating_average, rating_count, is_active, created_at, updated_at';
export const PROVIDER_LIST_COLUMNS = 'id, display_id, business_name, address, latitude, longitude, facility_photos, accepted_species, cancellation_policy, rating_average, rating_count, is_active';
export const ROOM_COLUMNS = 'id, provider_id, name, description, capacity, price_per_night, photos, is_active, created_at, updated_at';
export const ADDON_COLUMNS = 'id, provider_id, name, description, price, price_type, is_active, created_at, updated_at';

export const ORDER_COLUMNS = 'id, order_number, owner_id, provider_id, room_type_id, status, check_in_date, check_out_date, num_nights, pet_ids, add_on_ids, special_notes, daily_status_report, price_breakdown, total_price, cancellation_policy, provider_response_deadline, owner_confirm_deadline, cancelled_at, cancelled_by, cancellation_reason, refund_amount, completed_at, created_at, updated_at';
export const ORDER_LIST_COLUMNS = 'id, order_number, owner_id, provider_id, status, check_in_date, check_out_date, num_nights, total_price, created_at';
export const ORDER_HISTORY_COLUMNS = 'id, order_id, status, actor_id, actor_type, note, created_at';

export const PAYMENT_COLUMNS = 'id, order_id, method, amount, status, transaction_ref, paid_at, refunded_at, refund_amount, created_at, updated_at';
export const PAYOUT_COLUMNS = 'id, provider_id, order_id, recipient, gross_amount, commission_rate, commission_amount, net_amount, status, payout_date, created_at, updated_at';

export const PAYMENT_V2_COLUMNS = 'id, order_id, owner_id, provider_id, amount, currency, psp_provider, psp_order_id, psp_payment_url, method, status, captured_at, split_completed_at, created_at, updated_at';
export const PAYOUT_V2_COLUMNS = 'id, payment_v2_id, provider_id, recipient, gross_amount, commission_rate, commission_amount, net_amount, bank_account_snapshot, psp_disbursement_id, status, failure_reason, completed_at, created_at, updated_at';
export const ESCROW_V2_COLUMNS = 'id, payment_v2_id, type, amount, balance_after, psp_reference, description, created_at';
export const OUTBOX_V2_COLUMNS = 'id, payment_v2_id, payout_v2_id, kind, payload, status, attempts, last_error, scheduled_at, dispatched_at, completed_at, created_at';

// Provider columns with bank info (admin/owner-self views only — never use for public listing)
export const PROVIDER_COLUMNS_ADMIN = 'id, display_id, user_id, business_name, description, license_number, license_photos, address, latitude, longitude, phone, facility_photos, certification_photos, accepted_species, weight_limit_min_kg, weight_limit_max_kg, cancellation_policy, verification_status, verification_notes, verified_at, verified_by, bank_name, bank_account_holder, bank_verified_at, bank_verified_by, rating_average, rating_count, is_active, created_at, updated_at';

export const NOTIFICATION_COLUMNS = 'id, user_id, type, title, body, data, is_read, push_sent, created_at, read_at';
export const DEVICE_TOKEN_COLUMNS = 'id, user_id, token, platform, is_active, created_at, updated_at';

export const CHAT_CONVERSATION_COLUMNS = 'id, order_id, owner_id, provider_id, last_message_at, owner_unread_count, provider_unread_count, created_at, updated_at';
export const CHAT_MESSAGE_COLUMNS = 'id, conversation_id, sender_id, content, type, image_url, status, created_at, read_at';
export const CALL_LOG_COLUMNS = 'id, conversation_id, order_id, caller_id, callee_id, proxy_number, status, duration_seconds, started_at, ended_at, created_at';

export const REVIEW_COLUMNS = 'id, order_id, owner_id, provider_id, rating_overall, rating_cleanliness, rating_care_quality, rating_communication, rating_value, text, photos, provider_response, provider_responded_at, is_visible, created_at, updated_at';

export const CHECK_IN_PHOTO_COLUMNS = 'id, order_id, uploaded_by, role, handoff_point, photo_url, thumbnail_url, timestamp, latitude, longitude, has_concern, concern_note, created_at';
export const STATUS_REPORT_COLUMNS = 'id, order_id, provider_id, photos, feeding_status, activity_summary, note, owner_reaction, owner_reply, owner_replied_at, created_at, updated_at';

export const OTP_COLUMNS = 'id, phone, otp_hash, expires_at, attempts, max_attempts, locked_until, is_used, created_at';
export const FAVORITE_COLUMNS = 'id, user_id, provider_id, created_at';
export const SEARCH_HISTORY_COLUMNS = 'id, user_id, query_text, latitude, longitude, filters, created_at';
export const DISPUTE_COLUMNS = 'id, order_id, opened_by, opened_by_role, description, evidence_photos, status, resolution, resolved_by, resolved_at, created_at, updated_at';
export const AVAILABILITY_COLUMNS = 'id, provider_id, room_type_id, date, available_slots, booked_slots, is_blocked';
