import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { UpdateConfigInput } from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

const CONFIG_DEFAULTS = {
  commission_rate: 0.15,
  commission_rate_v1: 0,
  auto_confirm_hours: 4,
  payment_timeout_hours: 24,
  payments_v2_enabled: false,
  vietqr_enabled: true,
  momo_enabled: true,
  cash_enabled: true,
};

/**
 * Coerce jsonb value back to proper JS type for the typed config object.
 * Handles legacy data stored as JSON strings from when the upsert used
 * `String(value)` (booleans became 'true'/'false', numbers became '0.15').
 */
function coerceConfigValue(raw: unknown): unknown {
  if (typeof raw === 'boolean' || typeof raw === 'number') return raw;
  if (raw == null) return raw;
  if (typeof raw === 'string') {
    if (raw === 'true' || raw === '"true"') return true;
    if (raw === 'false' || raw === '"false"') return false;
    // Strip surrounding quotes from legacy `'"0"'::jsonb` style storage
    const unquoted = raw.replace(/^"|"$/g, '');
    if (unquoted === '') return raw;
    const num = Number(unquoted);
    if (Number.isFinite(num)) return num;
    return unquoted;
  }
  return raw;
}

@Injectable()
export class AdminConfigService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly actionLog: AdminActionLogService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getConfig() {
    const cacheKey = 'admin:config';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.supabase.client
      .from('app_config')
      .select('key, value')
      .in('key', Object.keys(CONFIG_DEFAULTS));

    const config: Record<string, unknown> = { ...CONFIG_DEFAULTS };
    if (data) {
      for (const row of data as { key: string; value: unknown }[]) {
        if (!(row.key in config)) continue;
        config[row.key] = coerceConfigValue(row.value);
      }
    }

    await this.cache.set(cacheKey, config, 600_000);
    return config;
  }

  async updateConfig(userId: string, body: UpdateConfigInput) {
    const entries = Object.entries(body).filter(([, v]) => v != null);
    for (const [key, value] of entries) {
      // Pass typed value directly — supabase-js JSON-serializes for jsonb,
      // preserving boolean/number types. String(value) would coerce booleans
      // to "true"/"false" strings, breaking type round-trips.
      await this.supabase.client
        .from('app_config')
        .upsert({ key, value, updated_by: userId }, { onConflict: 'key' });
    }

    await this.cache.del('admin:config');
    await this.actionLog.log(userId, 'update_config', 'config', 'app_config', body as Record<string, unknown>);

    return this.getConfig();
  }
}
