-- Vietnamese dog breeds
insert into public.breeds (species, name_vi, name_en, popularity_rank) values
  ('dog', 'Phú Quốc', 'Phu Quoc Ridgeback', 1),
  ('dog', 'Chó Cỏ', 'Vietnamese Village Dog', 2),
  ('dog', 'Lạp Xưởng', 'Dachshund', 3),
  ('dog', 'Corgi', 'Pembroke Welsh Corgi', 4),
  ('dog', 'Poodle', 'Poodle', 5),
  ('dog', 'Golden Retriever', 'Golden Retriever', 6),
  ('dog', 'Husky', 'Siberian Husky', 7),
  ('dog', 'Shiba Inu', 'Shiba Inu', 8),
  ('dog', 'Chihuahua', 'Chihuahua', 9),
  ('dog', 'Pomeranian', 'Pomeranian', 10),
  ('dog', 'Beagle', 'Beagle', 11),
  ('dog', 'Bulldog Pháp', 'French Bulldog', 12),
  ('dog', 'Labrador', 'Labrador Retriever', 13),
  ('dog', 'Samoyed', 'Samoyed', 14),
  ('dog', 'Alaska', 'Alaskan Malamute', 15),
  ('dog', 'Pitbull', 'American Pit Bull Terrier', 16),
  ('dog', 'Bắc Hà', 'Bac Ha Dog', 17),
  ('dog', 'Hmong', 'Hmong Docked Tail Dog', 18);

-- Vietnamese cat breeds
insert into public.breeds (species, name_vi, name_en, popularity_rank) values
  ('cat', 'Mèo Ta', 'Vietnamese Domestic Cat', 1),
  ('cat', 'Anh Lông Ngắn', 'British Shorthair', 2),
  ('cat', 'Anh Lông Dài', 'British Longhair', 3),
  ('cat', 'Munchkin', 'Munchkin', 4),
  ('cat', 'Scottish Fold', 'Scottish Fold', 5),
  ('cat', 'Ba Tư', 'Persian', 6),
  ('cat', 'Maine Coon', 'Maine Coon', 7),
  ('cat', 'Ragdoll', 'Ragdoll', 8),
  ('cat', 'Xiêm', 'Siamese', 9),
  ('cat', 'Sphynx', 'Sphynx', 10),
  ('cat', 'Bengal', 'Bengal', 11),
  ('cat', 'Mèo Mướp', 'Tabby Cat', 12);

-- Cancellation reason codes
insert into public.cancellation_reasons (code, label_vi, label_en, applicable_to) values
  ('OWNER_CHANGE_PLAN', 'Thay đổi kế hoạch', 'Change of plans', 'owner'),
  ('OWNER_PET_SICK', 'Thú cưng bị ốm', 'Pet is sick', 'owner'),
  ('OWNER_FOUND_ALTERNATIVE', 'Tìm được nơi khác', 'Found alternative', 'owner'),
  ('OWNER_FINANCIAL', 'Lý do tài chính', 'Financial reasons', 'owner'),
  ('OWNER_OTHER', 'Lý do khác', 'Other reasons', 'owner'),
  ('PROVIDER_FULL', 'Hết phòng', 'No availability', 'provider'),
  ('PROVIDER_MAINTENANCE', 'Bảo trì cơ sở', 'Facility maintenance', 'provider'),
  ('PROVIDER_EMERGENCY', 'Tình huống khẩn cấp', 'Emergency', 'provider'),
  ('PROVIDER_PET_UNSUITABLE', 'Thú cưng không phù hợp', 'Pet unsuitable', 'provider'),
  ('PROVIDER_OTHER', 'Lý do khác', 'Other reasons', 'provider'),
  ('SYSTEM_TIMEOUT', 'Hết thời gian xác nhận', 'Confirmation timeout', 'both'),
  ('SYSTEM_PAYMENT_FAILED', 'Thanh toán thất bại', 'Payment failed', 'both');
