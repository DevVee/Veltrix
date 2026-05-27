// ─── Kiosk Local SQLite Database (better-sqlite3) ─────────────────────────────
import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { v4 as uuid } from 'uuid'

let db: Database.Database

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initDB(): void {
  const dbPath = join(app.getPath('userData'), 'kiosk.sqlite')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    -- Attendance queue (local records waiting to sync)
    CREATE TABLE IF NOT EXISTS attendance_queue (
      id              TEXT PRIMARY KEY,
      employee_id     TEXT NOT NULL,
      employee_no     TEXT,
      full_name       TEXT,
      department      TEXT,
      date            TEXT NOT NULL,
      time_in         TEXT,
      time_out        TEXT,
      status          TEXT NOT NULL DEFAULT 'present',
      source          TEXT NOT NULL DEFAULT 'kiosk',
      device_id       TEXT,
      created_at      TEXT NOT NULL,
      synced          INTEGER NOT NULL DEFAULT 0,
      sync_attempts   INTEGER NOT NULL DEFAULT 0,
      last_sync_at    TEXT,
      sync_error      TEXT
    );

    -- Device config key-value store
    CREATE TABLE IF NOT EXISTS device_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Local employee cache (refreshed from server when online)
    CREATE TABLE IF NOT EXISTS employee_cache (
      id          TEXT PRIMARY KEY,
      employee_no TEXT,
      full_name   TEXT NOT NULL,
      pin_code    TEXT,
      rfid_tag    TEXT,
      shift_id    TEXT,
      department  TEXT,
      position    TEXT,
      status      TEXT NOT NULL DEFAULT 'active',
      cached_at   TEXT NOT NULL
    );

    -- Recent check-ins (for idle screen display)
    CREATE TABLE IF NOT EXISTS recent_checkins (
      id          TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      full_name   TEXT NOT NULL,
      department  TEXT,
      type        TEXT NOT NULL,
      timestamp   TEXT NOT NULL
    );
  `)
}

// ─── Device Config ────────────────────────────────────────────────────────────
export function getConfig(key: string): string | null {
  const row = db.prepare('SELECT value FROM device_config WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setConfig(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO device_config (key, value) VALUES (?, ?)').run(key, value)
}

// ─── Employee Cache ───────────────────────────────────────────────────────────
export interface CachedEmployee {
  id: string
  employee_no: string
  full_name: string
  pin_code: string | null
  rfid_tag: string | null
  shift_id: string | null
  department: string | null
  position: string | null
  status: string
}

export function getEmployeeCache(): CachedEmployee[] {
  return db.prepare('SELECT * FROM employee_cache WHERE status = ?').all('active') as CachedEmployee[]
}

export function replaceEmployeeCache(employees: CachedEmployee[]): void {
  const now = new Date().toISOString()
  const insert = db.prepare(`
    INSERT OR REPLACE INTO employee_cache
    (id, employee_no, full_name, pin_code, rfid_tag, shift_id, department, position, status, cached_at)
    VALUES (@id, @employee_no, @full_name, @pin_code, @rfid_tag, @shift_id, @department, @position, @status, @cached_at)
  `)
  const insertMany = db.transaction((emps: CachedEmployee[]) => {
    db.prepare('DELETE FROM employee_cache').run()
    for (const e of emps) insert.run({ ...e, cached_at: now })
  })
  insertMany(employees)
}

// ─── Attendance Queue ─────────────────────────────────────────────────────────
export interface AttendanceInput {
  employee_id: string
  employee_no: string
  full_name: string
  department: string | null
  date: string
  now: string
}

export interface UpsertResult {
  type: 'time-in' | 'time-out'
  id: string
}

export function upsertAttendance(input: AttendanceInput): UpsertResult {
  const deviceId = getConfig('device_id') ?? 'unknown'

  // Find existing record for today
  const existing = db
    .prepare('SELECT * FROM attendance_queue WHERE employee_id = ? AND date = ? ORDER BY created_at DESC LIMIT 1')
    .get(input.employee_id, input.date) as {
      id: string; time_in: string | null; time_out: string | null
    } | undefined

  if (!existing || existing.time_out) {
    // Time-in: create new record
    const id = uuid()
    db.prepare(`
      INSERT INTO attendance_queue
      (id, employee_id, employee_no, full_name, department, date, time_in, status, source, device_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 'kiosk', ?, ?)
    `).run(id, input.employee_id, input.employee_no, input.full_name, input.department, input.date, input.now, deviceId, input.now)

    _recordCheckin(input.employee_id, input.full_name, input.department, 'time-in', input.now)
    return { type: 'time-in', id }
  } else if (existing.time_in && !existing.time_out) {
    // Time-out: update existing record
    db.prepare(`
      UPDATE attendance_queue
      SET time_out = ?, synced = 0
      WHERE id = ?
    `).run(input.now, existing.id)

    _recordCheckin(input.employee_id, input.full_name, input.department, 'time-out', input.now)
    return { type: 'time-out', id: existing.id }
  } else {
    // Edge case: create new time-in
    const id = uuid()
    db.prepare(`
      INSERT INTO attendance_queue
      (id, employee_id, employee_no, full_name, department, date, time_in, status, source, device_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 'kiosk', ?, ?)
    `).run(id, input.employee_id, input.employee_no, input.full_name, input.department, input.date, input.now, deviceId, input.now)

    _recordCheckin(input.employee_id, input.full_name, input.department, 'time-in', input.now)
    return { type: 'time-in', id }
  }
}

function _recordCheckin(empId: string, fullName: string, department: string | null, type: string, timestamp: string) {
  const id = uuid()
  db.prepare(`
    INSERT INTO recent_checkins (id, employee_id, full_name, department, type, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, empId, fullName, department, type, timestamp)
  // Keep only last 50
  db.prepare(`
    DELETE FROM recent_checkins WHERE id NOT IN (
      SELECT id FROM recent_checkins ORDER BY timestamp DESC LIMIT 50
    )
  `).run()
}

export function getRecentCheckins(limit = 10) {
  return db.prepare('SELECT * FROM recent_checkins ORDER BY timestamp DESC LIMIT ?').all(limit)
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────
export interface QueueRecord {
  id: string
  employee_id: string
  employee_no: string
  full_name: string
  department: string | null
  date: string
  time_in: string | null
  time_out: string | null
  status: string
  source: string
  device_id: string
  created_at: string
  sync_attempts: number
}

export function getPendingRecords(limit = 100): QueueRecord[] {
  return db.prepare(`
    SELECT * FROM attendance_queue
    WHERE synced = 0 AND sync_attempts < 10
    ORDER BY created_at ASC
    LIMIT ?
  `).all(limit) as QueueRecord[]
}

export function markSynced(ids: string[]): void {
  if (!ids.length) return
  const now = new Date().toISOString()
  const update = db.prepare('UPDATE attendance_queue SET synced = 1, last_sync_at = ? WHERE id = ?')
  const many = db.transaction((ids: string[]) => { for (const id of ids) update.run(now, id) })
  many(ids)
}

export function markFailed(ids: string[], error: string): void {
  if (!ids.length) return
  const update = db.prepare('UPDATE attendance_queue SET sync_attempts = sync_attempts + 1, sync_error = ?, last_sync_at = ? WHERE id = ?')
  const many = db.transaction((ids: string[]) => {
    for (const id of ids) update.run(error, new Date().toISOString(), id)
  })
  many(ids)
}

export function getPendingCount(): number {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM attendance_queue WHERE synced = 0').get() as { cnt: number }
  return row.cnt
}
