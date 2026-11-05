import { getDemoDatabase, openRealDatabase } from '@/data/bootstrap';
import { buildTodaySnapshot } from '@/domain/metrics/today';
import type { WidgetSnapshot } from '@/domain/metrics/today';
import { resolveDisplayTz } from '@/state/privacy';

/** Read-only snapshot for the Android widget (app + headless task). */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot> {
  const { repos: realRepos } = await openRealDatabase();
  const mode = (await realRepos.prefs.get('mode')) ?? 'unset';
  const hideAmounts = (await realRepos.prefs.get('hide_amounts')) ?? false;
  const appLockEnabled = (await realRepos.prefs.get('app_lock_enabled')) ?? false;
  const displayPref = (await realRepos.prefs.get('display_tz')) ?? 'device';
  const entitlementPro = (await realRepos.prefs.get('entitlement_pro')) ?? false;

  if (mode === 'unset') {
    return buildTodaySnapshot({
      trades: [],
      now: Date.now(),
      tz: resolveDisplayTz(displayPref),
      mode: 'unset',
      hideAmounts,
      appLockEnabled,
      pro: entitlementPro,
      quoteCurrency: 'USD',
    });
  }

  const repos = mode === 'demo' ? (await getDemoDatabase()).repos : realRepos;
  const accounts = await repos.accounts.list();
  const accountId = (await realRepos.prefs.get('active_account_id')) ?? accounts[0]?.id;
  const account = accountId ? await repos.accounts.get(accountId) : null;
  const rows = accountId ? await repos.trades.listClosedForMetrics(accountId) : [];

  return buildTodaySnapshot({
    trades: rows as never,
    now: Date.now(),
    tz: resolveDisplayTz(displayPref),
    mode,
    hideAmounts,
    appLockEnabled,
    pro: entitlementPro,
    quoteCurrency: account?.quote_currency ?? 'USD',
  });
}
