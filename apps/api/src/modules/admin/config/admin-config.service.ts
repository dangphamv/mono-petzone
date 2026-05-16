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
      for (const row of data as { key: string; value: string }[]) {
        if (row.key in config) {
          const raw = row.value;
          if (raw === 'true' || raw === 'false') config[row.key] = raw === 'true';
          else config[row.key] = Number(raw) || raw;
        }
      }
    }

    await this.cache.set(cacheKey, config, 600_000);
    return config;
  }

  async updateConfig(userId: string, body: UpdateConfigInput) {
    const entries = Object.entries(body).filter(([, v]) => v != null);
    for (const [key, value] of entries) {
      await this.supabase.client
        .from('app_config')
        .upsert({ key, value: String(value), updated_by: userId }, { onConflict: 'key' });
    }

    await this.cache.del('admin:config');
    await this.actionLog.log(userId, 'update_config', 'config', 'app_config', body as Record<string, unknown>);

    return this.getConfig();
  }
}
