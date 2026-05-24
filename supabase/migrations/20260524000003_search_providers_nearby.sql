-- Geo-aware provider search.
-- PostgREST cannot express PostGIS radius filtering / distance sorting, so the
-- search endpoint delegates to this RPC. Uses the existing providers_geo_idx
-- (GiST on st_makepoint(longitude, latitude)). Returns { results, total } so the
-- API can paginate without a second round-trip.
create or replace function public.search_providers_nearby(
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_radius_km double precision default 10,
  p_species text default null,
  p_min_rating numeric default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_keyword text default null,
  p_sort_by text default 'distance',
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_result jsonb;
begin
  with base as (
    select
      p.id, p.display_id, p.business_name, p.address, p.latitude, p.longitude,
      p.facility_photos, p.accepted_species, p.cancellation_policy,
      p.rating_average, p.rating_count, p.is_active,
      case
        when p_latitude is not null and p_longitude is not null then
          st_distance(
            st_makepoint(p.longitude, p.latitude)::geography,
            st_makepoint(p_longitude, p_latitude)::geography
          )
      end as distance_m,
      mp.min_room_price
    from public.providers p
    left join lateral (
      select min(rt.price_per_night) as min_room_price
      from public.room_types rt
      where rt.provider_id = p.id and rt.is_active = true
    ) mp on true
    where p.verification_status = 'approved'
      and p.is_active = true
      and (p_species is null or p.accepted_species @> array[p_species])
      and (p_min_rating is null or p.rating_average >= p_min_rating)
      and (p_keyword is null or p.business_name ilike '%' || p_keyword || '%')
      and (
        p_latitude is null or p_longitude is null
        or st_dwithin(
          st_makepoint(p.longitude, p.latitude)::geography,
          st_makepoint(p_longitude, p_latitude)::geography,
          p_radius_km * 1000
        )
      )
      and (p_min_price is null or mp.min_room_price >= p_min_price)
      and (p_max_price is null or mp.min_room_price <= p_max_price)
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'results', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          b.id, b.display_id, b.business_name, b.address, b.latitude, b.longitude,
          b.facility_photos, b.accepted_species, b.cancellation_policy,
          b.rating_average, b.rating_count, b.is_active, b.distance_m,
          coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', rt.id,
              'price_per_night', rt.price_per_night,
              'is_active', rt.is_active
            ))
            from public.room_types rt where rt.provider_id = b.id
          ), '[]'::jsonb) as room_types
        from base b
        order by
          (case when p_sort_by = 'distance'  then b.distance_m end) asc nulls last,
          (case when p_sort_by = 'price_asc'  then b.min_room_price end) asc nulls last,
          (case when p_sort_by = 'price_desc' then b.min_room_price end) desc nulls last,
          (case when p_sort_by = 'rating'     then b.rating_average end) desc nulls last,
          b.rating_average desc
        limit p_limit offset p_offset
      ) t
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;
