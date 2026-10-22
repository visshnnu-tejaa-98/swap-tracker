export type ISODateString = string

export interface Location {
  address: string
  area: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
}

// ---------- Charging station ----------
export type StationStatus = 'online' | 'offline' | 'maintenance'
export type DoorStatus = 'empty' | 'occupied' | 'occupied_faulty'

export interface StationDoor {
  doorNumber: number
  batteryId: string | null
  status: DoorStatus
}

export interface ChargingStation {
  id: string
  stationCode: string
  name: string
  location: Location
  status: StationStatus
  connectivity: '4g' | 'wifi' | 'ethernet' | 'disconnected'
  operatingHours: { open: string; close: string }
  totalDoors: number
  doors: StationDoor[]
  chargedBatteries: number
  chargingBatteries: number
  notWorkingBatteries: number
  emptyDoors: number
  batteryIds: string[]
  totalSwaps: number
  lastSwapAt: ISODateString | null
  lastHeartbeatAt: ISODateString
  installedAt: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

// ---------- Battery ----------
export type BatteryCondition = 'new' | 'moderately_used' | 'old'
export type BatteryStatus = 'charged' | 'charging' | 'faulty' | 'in_use'
export type BatteryLocation =
  | { type: 'station'; stationId: string; doorNumber: number }
  | { type: 'scooter'; userId: string; scooterId: string }

export interface Battery {
  id: string
  batteryId: string
  serialNumber: string
  model: string
  capacityKwh: number
  voltage: number
  /** State of health, 0–100 % */
  health: number
  chargingCyclesCompleted: number
  chargingCyclesRemaining: number
  supportedChargingCycles: number
  /** new: <25 % of cycles used, moderately_used: 25–70 %, old: >70 % */
  condition: BatteryCondition
  status: BatteryStatus
  /** Current state of charge, 0–100 % */
  chargeLevel: number
  estimatedFullChargeAt: ISODateString | null
  faultReason: string | null
  location: BatteryLocation
  lastSwappedAt: ISODateString | null
  manufacturedAt: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

// ---------- User ----------
export interface Scooter {
  id: string
  model: string
  registrationNumber: string
  batterySlots: number
}

export interface User {
  id: string
  name: string
  age: number
  gender: 'male' | 'female'
  phone: string
  email: string
  rfidTag: string
  homeCity: string
  status: 'active' | 'suspended'
  scooter: Scooter
  /** Batteries currently in the user's scooter */
  batteryIds: string[]
  subscription: { plan: 'basic' | 'standard' | 'unlimited'; monthlySwapLimit: number | null; startedAt: ISODateString }
  favouriteStationIds: string[]
  totalSwaps: number
  lastSwapAt: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

// ---------- Swap transaction ----------
export type TransactionStatus = 'success' | 'partial' | 'failed'
export type FailureReason =
  | 'network_error'
  | 'server_timeout'
  | 'rfid_read_error'
  | 'rfid_unauthorized'
  | 'station_offline'
  | 'power_outage'
  | 'door_jammed'
  | 'no_charged_batteries'
  | 'no_empty_door'
  | 'user_timeout'

/** authenticate = RFID tap, collect = station takes user's battery, dispense = station gives a charged one */
export type TransactionStepName = 'authenticate' | 'collect' | 'dispense' | 'return' | 'complete'

export interface TransactionStep {
  step: TransactionStepName
  status: 'completed' | 'failed'
  at: ISODateString
  battery?: number
  batteryId?: string
  door?: number
  chargeLevel?: number
  note?: string
}

export interface SwapTransaction {
  id: string
  rfid: string
  userId: string
  userName: string
  scooterId: string
  stationId: string
  stationName: string
  location: Location
  swappedAt: ISODateString
  completedAt: ISODateString
  durationSeconds: number
  status: TransactionStatus
  /** Number of batteries actually exchanged (0–2) */
  swapCount: number
  insertedBatteryIds: string[]
  dispensedBatteryIds: string[]
  failureReason: FailureReason | null
  failureMessage: string | null
  failedAtStep: TransactionStepName | null
  estimatedWaitMinutes: number | null
  steps: TransactionStep[]
  createdAt: ISODateString
  updatedAt: ISODateString
}
