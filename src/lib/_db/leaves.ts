// ─── Leave Requests ───────────────────────────────────────────────────────────
import { supabase } from '../supabase'
import { insertAudit } from './audit'
import type { LeaveRequest, LeaveStatus } from '../../types'

// ── Mapper ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLeave(r: any): LeaveRequest {
  return {
    id:              r.id,
    employeeId:      r.employee_id,
    employeeName:    r.employee_name   ?? '',
    employeeNo:      r.employee_no     ?? undefined,
    leaveType:       r.leave_type,
    startDate:       r.start_date,
    endDate:         r.end_date,
    days:            r.days            ?? 1,
    reason:          r.reason          ?? '',
    status:          r.status          as LeaveStatus,
    reviewedBy:      r.reviewed_by     ?? undefined,
    approvedBy:      r.reviewed_by     ?? undefined,   // alias
    reviewedAt:      r.reviewed_at     ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    createdAt:       r.created_at,
    filedAt:         r.created_at      ?? undefined,   // alias
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function apiGetLeaves(p?: {
  employeeId?: string
  status?:     string
}): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (p?.employeeId) query = query.eq('employee_id', p.employeeId)
  if (p?.status && p.status !== 'all') query = query.eq('status', p.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toLeave)
}

export async function apiCreateLeave(
  data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>
): Promise<LeaveRequest> {
  const { data: row, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id:   data.employeeId,
      employee_name: data.employeeName,
      employee_no:   data.employeeNo ?? null,
      leave_type:    data.leaveType,
      start_date:    data.startDate,
      end_date:      data.endDate,
      days:          data.days,
      reason:        data.reason,
      status:        'pending',
    })
    .select()
    .single()
  if (error || !row) throw error ?? new Error('Failed to create leave request')
  return toLeave(row)
}

export async function apiUpdateLeaveStatus(
  id:     string,
  status: LeaveStatus,
  by?:    string,
  reason?: string
): Promise<LeaveRequest> {
  const patch: Record<string, unknown> = {
    status,
    reviewed_by:      by ?? null,
    reviewed_at:      new Date().toISOString(),
    rejection_reason: reason ?? null,
  }
  const { data: row, error } = await supabase
    .from('leave_requests').update(patch).eq('id', id).select().single()
  if (error || !row) throw error ?? new Error('Leave request not found')
  const leave = toLeave(row)

  await insertAudit({
    userId: 'sys', userName: by ?? 'System',
    action: status === 'approved' ? 'approve' : 'reject',
    module: 'Leaves',
    description: `${status === 'approved' ? 'Approved' : 'Rejected'} leave for ${leave.employeeName}`,
  })

  // Auto-create attendance records for each approved leave day
  if (status === 'approved') {
    const d = new Date(leave.startDate)
    const end = new Date(leave.endDate)
    while (d <= end) {
      const dateStr = d.toISOString().split('T')[0]
      // Only insert if no record already exists for that day
      await supabase.from('attendance_records').upsert({
        employee_id:    leave.employeeId,
        employee_name:  leave.employeeName,
        employee_no:    leave.employeeNo ?? '',
        date:           dateStr,
        status:         'on-leave',
        minutes_late:   0,
        overtime_minutes: 0,
        night_diff_minutes: 0,
        source:         'manual',
        note:           `${leave.leaveType} leave`,
      }, { onConflict: 'employee_id,date', ignoreDuplicates: true })
      d.setDate(d.getDate() + 1)
    }
  }

  return leave
}
