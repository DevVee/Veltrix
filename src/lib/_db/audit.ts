// ─── Audit Logs ───────────────────────────────────────────────────────────────
import { supabase } from '../supabase'
import type { AuditLog } from '../../types'

// ── Row mapper ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAuditLog(r: any): AuditLog {
  return {
    id:          r.id,
    timestamp:   r.timestamp,
    userId:      r.user_id   ?? '',
    userName:    r.user_name ?? '',
    action:      r.action,
    module:      r.module,
    description: r.description,
    before:      r.before_data ?? undefined,
    after:       r.after_data  ?? undefined,
    recordId:    r.record_id   ?? undefined,
  }
}

// ── Internal helper called by other modules ───────────────────────────────────
export async function insertAudit(entry: {
  userId:      string
  userName:    string
  action:      AuditLog['action']
  module:      string
  description: string
  before?:     string
  after?:      string
  recordId?:   string
}): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id:     entry.userId,
    user_name:   entry.userName,
    action:      entry.action,
    module:      entry.module,
    description: entry.description,
    before_data: entry.before,
    after_data:  entry.after,
    record_id:   entry.recordId,
  })
  // Errors are intentionally ignored — audit failures shouldn't break user flow
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function apiGetAuditLogs(limit = 200): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(toAuditLog)
}
