import { batteries } from './batteries'
import { stations } from './stations'
import { transactions } from './transactions'
import { users } from './users'

export * from './types'
export { batteries, stations, transactions, users }

const index = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]))
const stationMap = index(stations)
const batteryMap = index(batteries)
const userMap = index(users)

export const getStationById = (id: string) => stationMap.get(id)
export const getBatteryById = (id: string) => batteryMap.get(id)
export const getUserById = (id: string) => userMap.get(id)
export const getUserByRfid = (rfid: string) => users.find((u) => u.rfidTag === rfid)

export const getBatteriesAtStation = (stationId: string) =>
  batteries.filter((b) => b.location.type === 'station' && b.location.stationId === stationId)
export const getBatteriesOfUser = (userId: string) =>
  batteries.filter((b) => b.location.type === 'scooter' && b.location.userId === userId)
export const getTransactionsForUser = (userId: string) => transactions.filter((t) => t.userId === userId)
export const getTransactionsForStation = (stationId: string) => transactions.filter((t) => t.stationId === stationId)

/** The moment the mock dataset treats as "now" (2026-10-22 13:30 IST) */
export const MOCK_NOW = new Date('2026-10-22T08:00:00.000Z')
