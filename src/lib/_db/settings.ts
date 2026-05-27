// ─── App Settings (Company + Deductions) ─────────────────────────────────────
import { supabase } from '../supabase'
import { DEFAULT_DEDUCTION_SETTINGS } from '../payrollEngine'
import type { CompanySettings, PayrollDeductionSettings } from '../../types'

// ── Default company settings ──────────────────────────────────────────────────
const DEFAULT_COMPANY: CompanySettings = {
  name:      'Ten Foundation Philippines Inc.',
  tagline:   '',
  address:   '',
  contact:   '',
  email:     '',
  tin:       '',
  payPeriod: 'bi-monthly',
}

// ── Synchronous fallbacks (for legacy callers) ────────────────────────────────
// These return sensible defaults immediately; call the async variants for real data.
let _companyCache:    CompanySettings          = DEFAULT_COMPANY
let _deductionCache:  PayrollDeductionSettings = DEFAULT_DEDUCTION_SETTINGS

export function getCompanySettings():   CompanySettings          { return _companyCache }
export function getDeductionSettings(): PayrollDeductionSettings { return _deductionCache }

/** Legacy sync save — no-op in Supabase mode; use the async variants instead. */
export function saveCompanySettings(_s: CompanySettings): void {
  _companyCache = _s
  // Fire-and-forget async save
  apiSaveCompanySettings(_s).catch(() => {/* silently ignored */})
}

/** Legacy sync save — no-op in Supabase mode; use the async variants instead. */
export function saveDeductionSettings(_s: PayrollDeductionSettings): void {
  _deductionCache = _s
  apiSaveDeductionSettings(_s).catch(() => {/* silently ignored */})
}

// ── Async API ─────────────────────────────────────────────────────────────────
export async function loadCompanySettings(): Promise<CompanySettings> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'company_settings')
    .single()
  const settings = (data?.value ?? DEFAULT_COMPANY) as CompanySettings
  _companyCache = settings
  return settings
}

export async function apiSaveCompanySettings(s: CompanySettings): Promise<void> {
  _companyCache = s
  await supabase.from('app_settings').upsert(
    { key: 'company_settings', value: s },
    { onConflict: 'key' }
  )
}

export async function loadDeductionSettings(): Promise<PayrollDeductionSettings> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'deduction_settings')
    .single()
  const settings = (data?.value ?? DEFAULT_DEDUCTION_SETTINGS) as PayrollDeductionSettings
  _deductionCache = settings
  return settings
}

export async function apiSaveDeductionSettings(s: PayrollDeductionSettings): Promise<void> {
  _deductionCache = s
  await supabase.from('app_settings').upsert(
    { key: 'deduction_settings', value: s },
    { onConflict: 'key' }
  )
}

/** Call once on app start to warm the caches. */
export async function loadAllSettings(): Promise<void> {
  await Promise.all([loadCompanySettings(), loadDeductionSettings()])
}
