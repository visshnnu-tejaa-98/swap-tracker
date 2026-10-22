import type { BatteryCondition, BatteryStatus, FailureReason, TransactionStatus, TransactionStepName } from '../mock-data'

const IST = 'Asia/Kolkata'

export const formatTime = (iso: string, seconds = false) =>
  new Date(iso).toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', ...(seconds && { second: '2-digit' }), hour12: false })

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`

export const formatDuration = (seconds: number) =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`

export const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const TRANSACTION_STATUS: Record<TransactionStatus, { label: string; tone: Tone }> = {
  success: { label: 'Successful', tone: 'success' },
  partial: { label: 'Partial', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const BATTERY_STATUS: Record<BatteryStatus, { label: string; tone: Tone }> = {
  charged: { label: 'Charged', tone: 'success' },
  charging: { label: 'Charging', tone: 'warning' },
  faulty: { label: 'Not working', tone: 'danger' },
  in_use: { label: 'In scooter', tone: 'info' },
}

export const BATTERY_CONDITION: Record<BatteryCondition, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'success' },
  moderately_used: { label: 'Moderately used', tone: 'info' },
  old: { label: 'Old', tone: 'warning' },
}

export const STEP_LABEL: Record<TransactionStepName, string> = {
  authenticate: 'RFID authenticated',
  collect: 'Battery collected',
  dispense: 'Charged battery dispensed',
  return: 'Battery returned to user',
  complete: 'Swap completed',
}

export const FAILURE_LABEL: Record<FailureReason, string> = {
  network_error: 'Network error',
  server_timeout: 'Server timeout',
  rfid_read_error: 'RFID read error',
  rfid_unauthorized: 'RFID not authorised',
  station_offline: 'Station offline',
  power_outage: 'Power outage',
  door_jammed: 'Door jammed',
  no_charged_batteries: 'No charged batteries',
  no_empty_door: 'No empty door',
  user_timeout: 'User timed out',
}

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
