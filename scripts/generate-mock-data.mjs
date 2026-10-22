// Generates consistent mock data for src/mock-data by simulating 30 days of swaps.
// Deterministic (seeded) — re-running produces identical output.
// Usage: node scripts/generate-mock-data.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'mock-data')

// ---------- config ----------
const NOW = Date.parse('2026-10-22T08:00:00.000Z')
const WINDOW_DAYS = 30
const WINDOW_START = NOW - WINDOW_DAYS * 86_400_000
const DOORS_PER_STATION = 10
const USER_COUNT = 100
const SUPPORTED_CYCLES = 1500
const FULL_CHARGE_MINUTES = 180
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const IST_OFFSET = 5.5 * HOUR

// ---------- seeded random ----------
let seed = 20261022
function rand() {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const chance = (p) => rand() < p
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d
const iso = (ms) => new Date(ms).toISOString()
const pad = (n, w) => String(n).padStart(w, '0')
const hex = (len) => Array.from({ length: len }, () => int(0, 15).toString(16)).join('').toUpperCase()

// ---------- reference data ----------
const CITIES = {
  Delhi: { state: 'Delhi', pin: '110', areas: [
    ['Connaught Place', 28.6315, 77.2167], ['Karol Bagh', 28.6519, 77.1909], ['Lajpat Nagar', 28.5677, 77.2433],
    ['Dwarka', 28.5921, 77.046], ['Rohini', 28.7495, 77.0565], ['Saket', 28.5245, 77.2066],
    ['Janakpuri', 28.6219, 77.0878], ['Mayur Vihar', 28.609, 77.294], ['Vasant Kunj', 28.52, 77.159],
    ['Pitampura', 28.702, 77.131], ['Nehru Place', 28.5491, 77.2533], ['Rajouri Garden', 28.6492, 77.122],
    ['Okhla', 28.5355, 77.2732], ['Greater Kailash', 28.5482, 77.238], ['Preet Vihar', 28.6415, 77.295],
  ] },
  Mumbai: { state: 'Maharashtra', pin: '400', areas: [
    ['Andheri West', 19.1364, 72.8296], ['Bandra West', 19.0596, 72.8295], ['Powai', 19.1176, 72.906],
    ['Dadar', 19.0178, 72.8478], ['Borivali', 19.2307, 72.8567], ['Goregaon', 19.1663, 72.8526],
    ['Chembur', 19.0522, 72.9005], ['Lower Parel', 18.9953, 72.8302], ['Malad', 19.1874, 72.8484],
    ['Kurla', 19.0726, 72.8845], ['Colaba', 18.9067, 72.8147], ['Vile Parle', 19.099, 72.844],
    ['Ghatkopar', 19.086, 72.9081], ['Worli', 19.0176, 72.818], ['Mulund', 19.1726, 72.9425],
  ] },
  Kolkata: { state: 'West Bengal', pin: '700', areas: [
    ['Salt Lake', 22.5867, 88.4171], ['Park Street', 22.5535, 88.351], ['New Town', 22.5807, 88.46],
    ['Howrah', 22.5958, 88.2636], ['Behala', 22.498, 88.311], ['Ballygunge', 22.5276, 88.365],
    ['Dum Dum', 22.622, 88.42], ['Garia', 22.463, 88.39], ['Esplanade', 22.5646, 88.351],
    ['Tollygunge', 22.498, 88.346], ['Gariahat', 22.518, 88.367], ['Shyambazar', 22.6, 88.373],
  ] },
  Chennai: { state: 'Tamil Nadu', pin: '600', areas: [
    ['T. Nagar', 13.0418, 80.2341], ['Anna Nagar', 13.085, 80.2101], ['Adyar', 13.0012, 80.2565],
    ['Velachery', 12.9815, 80.218], ['Thoraipakkam', 12.9416, 80.2362], ['Guindy', 13.0067, 80.2206],
    ['Mylapore', 13.0339, 80.2619], ['Tambaram', 12.9249, 80.1], ['Porur', 13.0382, 80.1565],
    ['Nungambakkam', 13.0569, 80.2425], ['Egmore', 13.0732, 80.2609], ['Sholinganallur', 12.901, 80.2279],
    ['Perambur', 13.121, 80.233],
  ] },
  Bengaluru: { state: 'Karnataka', pin: '560', areas: [
    ['Koramangala', 12.9352, 77.6245], ['Indiranagar', 12.9784, 77.6408], ['Whitefield', 12.9698, 77.75],
    ['HSR Layout', 12.9116, 77.6474], ['Jayanagar', 12.925, 77.5938], ['Electronic City', 12.8456, 77.6603],
    ['Marathahalli', 12.9591, 77.6974], ['MG Road', 12.9756, 77.6066], ['Hebbal', 13.0358, 77.597],
    ['Malleshwaram', 13.0035, 77.571], ['BTM Layout', 12.9166, 77.6101], ['Yelahanka', 13.1007, 77.5963],
    ['Bellandur', 12.926, 77.6762], ['Yeshwanthpur', 13.0285, 77.54],
  ] },
  Hyderabad: { state: 'Telangana', pin: '500', areas: [
    ['HITEC City', 17.4435, 78.3772], ['Gachibowli', 17.4401, 78.3489], ['Banjara Hills', 17.4156, 78.4347],
    ['Jubilee Hills', 17.4325, 78.4073], ['Kukatpally', 17.4948, 78.3996], ['Madhapur', 17.4483, 78.3915],
    ['Secunderabad', 17.4399, 78.4983], ['Ameerpet', 17.4375, 78.4482], ['Kondapur', 17.46, 78.364],
    ['Begumpet', 17.4447, 78.4664], ['LB Nagar', 17.3457, 78.5522], ['Dilsukhnagar', 17.3688, 78.5247],
    ['Miyapur', 17.496, 78.357],
  ] },
  Ahmedabad: { state: 'Gujarat', pin: '380', areas: [
    ['Navrangpura', 23.0365, 72.5611], ['Satellite', 23.03, 72.517], ['Bodakdev', 23.0396, 72.5065],
    ['Maninagar', 22.9962, 72.6036], ['Vastrapur', 23.037, 72.529], ['Prahlad Nagar', 23.012, 72.51],
    ['Thaltej', 23.05, 72.51], ['Chandkheda', 23.109, 72.585],
  ] },
  Pune: { state: 'Maharashtra', pin: '411', areas: [
    ['Hinjewadi', 18.5913, 73.7389], ['Koregaon Park', 18.5362, 73.894], ['Kothrud', 18.5074, 73.8077],
    ['Viman Nagar', 18.5679, 73.9143], ['Baner', 18.559, 73.7868], ['Hadapsar', 18.5089, 73.926],
    ['Wakad', 18.5975, 73.77], ['Shivajinagar', 18.5308, 73.8475], ['Magarpatta', 18.515, 73.929],
    ['Aundh', 18.558, 73.8075],
  ] },
}
const STREETS = ['Main Road', 'Ring Road', '1st Cross', '2nd Main', 'Station Road', 'Market Road', 'Link Road', 'High Street']
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karthik', 'Rahul', 'Siddharth', 'Vikram', 'Nikhil',
  'Ananya', 'Diya', 'Priya', 'Sneha', 'Kavya', 'Meera', 'Ishita', 'Pooja', 'Riya', 'Lakshmi',
  'Imran', 'Faisal', 'Zoya', 'Ayesha', 'Harpreet', 'Gurpreet', 'Joseph', 'Maria', 'Suresh', 'Ramesh',
  'Venkat', 'Sanjay', 'Deepak', 'Manoj', 'Neha', 'Swati', 'Tanvi', 'Aisha', 'Kiran', 'Abhishek']
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Khan', 'Das',
  'Banerjee', 'Mukherjee', 'Rao', 'Naidu', 'Menon', 'Joshi', 'Kulkarni', 'Desai', 'Shah', 'Mehta',
  'Chatterjee', 'Pillai', 'Fernandes', 'Kapoor', 'Malhotra', 'Bhat', 'Shetty', 'Yadav']
const SCOOTER_MODELS = ['Zeno One', 'Zeno One Plus', 'Zeno Cargo']
const PLANS = [
  { plan: 'basic', monthlySwapLimit: 30 },
  { plan: 'standard', monthlySwapLimit: 60 },
  { plan: 'unlimited', monthlySwapLimit: null },
]
const RTO = { Delhi: 'DL', Mumbai: 'MH', Pune: 'MH', Kolkata: 'WB', Chennai: 'TN', Bengaluru: 'KA', Hyderabad: 'TS', Ahmedabad: 'GJ' }

const FAILURES = {
  network_error: 'Station lost internet connectivity while contacting the server',
  server_timeout: 'Backend did not respond in time; transaction aborted',
  rfid_read_error: 'RFID tag could not be read, please try again',
  rfid_unauthorized: 'RFID tag is not authorised (account suspended)',
  station_offline: 'Station is offline for maintenance',
  power_outage: 'Station lost power during the transaction',
  door_jammed: 'Door failed to open',
  no_charged_batteries: 'No fully charged batteries available',
  no_empty_door: 'No empty door available to collect the battery',
  user_timeout: 'User did not complete the step in time',
}

const condition = (cycles) => {
  const used = cycles / SUPPORTED_CYCLES
  return used < 0.25 ? 'new' : used <= 0.7 ? 'moderately_used' : 'old'
}
const healthFor = (cycles) => round(Math.max(55, 100 - (cycles / SUPPORTED_CYCLES) * 28 - rand() * 4))

// ---------- stations ----------
const stations = []
let stationNo = 0
for (const [city, info] of Object.entries(CITIES)) {
  for (const [area, lat, lng] of info.areas) {
    stationNo++
    const installedAt = WINDOW_START - int(60, 540) * DAY
    stations.push({
      id: `STN-${pad(stationNo, 3)}`,
      stationCode: `ZN-${city.slice(0, 3).toUpperCase()}-${pad(stationNo, 3)}`,
      name: `Zeno ${area} Swap Station`,
      location: {
        address: `${int(1, 250)}, ${pick(STREETS)}, ${area}`,
        area,
        city,
        state: info.state,
        pincode: `${info.pin}${pad(int(1, 99), 3)}`,
        latitude: round(lat + (rand() - 0.5) * 0.01, 5),
        longitude: round(lng + (rand() - 0.5) * 0.01, 5),
      },
      totalDoors: DOORS_PER_STATION,
      doors: Array.from({ length: DOORS_PER_STATION }, () => null), // batteryId per door
      installedAt,
    })
  }
}
const stationsByCity = {}
for (const s of stations) (stationsByCity[s.location.city] ??= []).push(s)

// ---------- batteries ----------
const batteries = []
const batteryById = new Map()
function makeBattery() {
  const n = batteries.length + 1
  const cycles = chance(0.15) ? int(0, 300) : int(150, 1350)
  const manufacturedAt = WINDOW_START - Math.round((cycles / 1.2 + int(20, 60)) * DAY)
  const b = {
    id: `BAT-${pad(n, 4)}`,
    batteryId: `ZB${hex(4)}${pad(n, 5)}`,
    serialNumber: `ZNB-LFP-${pad(int(10000, 99999), 5)}-${pad(n, 4)}`,
    model: 'Zeno LFP 2.0 kWh',
    capacityKwh: 2.0,
    voltage: 48,
    supportedChargingCycles: SUPPORTED_CYCLES,
    chargingCyclesCompleted: cycles,
    health: healthFor(cycles),
    faulty: false,
    faultReason: null,
    // simulation-only fields
    readyAt: WINDOW_START - int(1, 12) * HOUR,
    insertCharge: 100,
    dispensedAt: null,
    loc: null,
    manufacturedAt,
    createdAt: manufacturedAt + int(2, 10) * DAY,
    updatedAt: WINDOW_START,
    lastSwappedAt: null,
  }
  batteries.push(b)
  batteryById.set(b.id, b)
  return b
}
const FAULT_REASONS = ['cell_imbalance', 'overheating', 'bms_communication_error', 'low_voltage', 'physical_damage']
for (const s of stations) {
  // hubs (first 3 stations of each city) are busy and under-stocked, which produces realistic waits
  const isHub = stationsByCity[s.location.city].indexOf(s) < 3
  const count = isHub ? int(3, 4) : int(5, 8)
  const doors = [...Array(DOORS_PER_STATION).keys()].sort(() => rand() - 0.5).slice(0, count)
  for (const d of doors) {
    const b = makeBattery()
    if (chance(0.05)) {
      b.faulty = true
      b.faultReason = pick(FAULT_REASONS)
      b.health = round(30 + rand() * 25)
    }
    b.loc = { type: 'station', stationId: s.id, door: d + 1 }
    s.doors[d] = b.id
  }
}

// ---------- users ----------
const users = []
const cityWeights = Object.entries(stationsByCity).flatMap(([city, list]) => list.map(() => city))
for (let i = 1; i <= USER_COUNT; i++) {
  const city = pick(cityWeights)
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  const createdAt = WINDOW_START - int(10, 400) * DAY
  const planInfo = pick(PLANS)
  const scooterId = `SCT-${pad(i, 4)}`
  const u = {
    id: `USR-${pad(i, 4)}`,
    name: `${first} ${last}`,
    age: int(19, 58),
    gender: null, // left for dashboard filters if needed
    phone: `+91 ${pick(['9', '8', '7'])}${pad(int(0, 999999999), 9)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    rfidTag: `RFID-${hex(8)}`,
    homeCity: city,
    favouriteStationIds: [pick(stationsByCity[city].slice(0, 3)).id, pick(stationsByCity[city]).id],
    scooter: {
      id: scooterId,
      model: pick(SCOOTER_MODELS),
      registrationNumber: `${RTO[city]}${pad(int(1, 50), 2)}${String.fromCharCode(65 + int(0, 25), 65 + int(0, 25))}${pad(int(1, 9999), 4)}`,
      batterySlots: 2,
    },
    subscription: { ...planInfo, startedAt: iso(createdAt) },
    status: i % 37 === 0 ? 'suspended' : 'active',
    createdAt,
  }
  u.gender = ['Ananya', 'Diya', 'Priya', 'Sneha', 'Kavya', 'Meera', 'Ishita', 'Pooja', 'Riya', 'Lakshmi', 'Zoya', 'Ayesha', 'Maria', 'Neha', 'Swati', 'Tanvi', 'Aisha'].includes(first) ? 'female' : first === 'Kiran' || first === 'Harpreet' || first === 'Gurpreet' ? pick(['male', 'female']) : 'male'
  for (let k = 0; k < 2; k++) {
    const b = makeBattery()
    b.loc = { type: 'scooter', userId: u.id, scooterId }
    b.dispensedAt = WINDOW_START - int(1, 40) * HOUR
  }
  users.push(u)
}
const scooterBatteries = (u) => batteries.filter((b) => b.loc.type === 'scooter' && b.loc.userId === u.id)

// ---------- swap schedule ----------
const attempts = []
for (const u of users) {
  let t = WINDOW_START + int(0, 72) * HOUR
  while (t < NOW - 5 * MIN) {
    const istMidnight = Math.floor((t + IST_OFFSET) / DAY) * DAY - IST_OFFSET
    const at = istMidnight + 6.5 * HOUR + int(0, 15) * HOUR + int(0, 59) * MIN + int(0, 59) * 1000 // 06:30–22:30 IST
    if (at < NOW - 5 * MIN) attempts.push({ user: u, at })
    t += int(36, 96) * HOUR
  }
}
attempts.sort((a, b) => a.at - b.at)

// ---------- simulation ----------
const isCharged = (b, t) => !b.faulty && b.readyAt <= t
const chargeAt = (b, t) => {
  if (b.readyAt <= t) return 100
  const total = b.readyAt - b.chargeStart
  return round(b.insertCharge + (100 - b.insertCharge) * ((t - b.chargeStart) / total), 0)
}
const scooterCharge = (b, t) => Math.max(5, round(100 - ((t - b.dispensedAt) / HOUR) * int(2, 3), 0))

function insert(b, station, door, t) {
  const level = scooterCharge(b, t) > 40 ? int(15, 40) : int(5, 25)
  station.doors[door - 1] = b.id
  b.loc = { type: 'station', stationId: station.id, door }
  b.insertCharge = level
  b.chargeStart = t
  b.readyAt = t + ((100 - level) / 100) * FULL_CHARGE_MINUTES * MIN * (1 + rand() * 0.3)
  b.chargingCyclesCompleted += 1
  b.health = round(Math.max(30, b.health - rand() * 0.04))
  if (chance(b.health < 75 ? 0.02 : 0.003)) {
    b.faulty = true
    b.faultReason = pick(FAULT_REASONS)
  }
  b.updatedAt = t
  b.lastSwappedAt = t
  return level
}
function dispense(b, station, user, t) {
  station.doors[b.loc.door - 1] = null
  b.loc = { type: 'scooter', userId: user.id, scooterId: user.scooter.id }
  b.dispensedAt = t
  b.updatedAt = t
  b.lastSwappedAt = t
}

const transactions = []
let txNo = 0
for (const { user, at } of attempts) {
  const favouriteId = pick(user.favouriteStationIds)
  const station = chance(0.75) ? stations.find((s) => s.id === favouriteId) : pick(stationsByCity[user.homeCity])
  const tx = {
    id: `TXN-${pad(++txNo, 5)}`,
    rfid: user.rfidTag,
    userId: user.id,
    userName: user.name,
    scooterId: user.scooter.id,
    stationId: station.id,
    stationName: station.name,
    location: { ...station.location },
    status: 'success',
    failureReason: null,
    failureMessage: null,
    failedAtStep: null,
    estimatedWaitMinutes: null,
    insertedBatteryIds: [],
    dispensedBatteryIds: [],
    swapCount: 0,
    steps: [],
    startedAt: at,
    completedAt: null,
  }
  let t = at
  const step = (name, extra = {}) => {
    t += name === 'authenticate' ? int(2, 6) * 1000 : int(8, 35) * 1000
    tx.steps.push({ step: name, status: 'completed', at: iso(t), ...extra })
  }
  const fail = (reason, stepName, extra = {}) => {
    t += int(3, 20) * 1000
    tx.status = tx.swapCount > 0 ? 'partial' : 'failed'
    tx.failureReason = reason
    tx.failureMessage = FAILURES[reason]
    tx.failedAtStep = stepName
    tx.steps.push({ step: stepName, status: 'failed', at: iso(t), ...extra })
    Object.assign(tx, extra.wait ? { estimatedWaitMinutes: extra.wait } : {})
  }
  const waitFor = (count) => {
    const charging = station.doors.map((id) => id && batteryById.get(id)).filter((b) => b && !b.faulty && b.readyAt > t).sort((a, b) => a.readyAt - b.readyAt)
    return charging[count - 1] ? Math.ceil((charging[count - 1].readyAt - t) / MIN) : null
  }

  // pre-transaction failures
  if (user.status === 'suspended') fail('rfid_unauthorized', 'authenticate')
  else if (chance(0.025)) fail('rfid_read_error', 'authenticate')
  else if (chance(0.015)) fail('station_offline', 'authenticate')
  else if (chance(0.03)) fail(pick(['network_error', 'server_timeout']), 'authenticate')
  else {
    step('authenticate')
    const own = scooterBatteries(user)
    for (let i = 0; i < 2 && tx.status === 'success'; i++) {
      const charged = station.doors.map((id) => id && batteryById.get(id)).filter((b) => b && isCharged(b, t))
      const emptyDoor = station.doors.findIndex((id) => id === null) + 1
      if (charged.length === 0) {
        const wait = waitFor(1)
        fail('no_charged_batteries', 'collect', { battery: i + 1, ...(wait ? { wait } : {}) })
        if (!wait) tx.estimatedWaitMinutes = null
        break
      }
      if (i === 0 && charged.length === 1 && chance(0.5)) {
        // user is told only one battery is available and walks away
        fail('no_charged_batteries', 'collect', { battery: 1, wait: waitFor(1) ?? 45 })
        break
      }
      if (emptyDoor === 0) { fail('no_empty_door', 'collect', { battery: i + 1 }); break }
      if (chance(0.012)) { fail('door_jammed', 'collect', { battery: i + 1, door: emptyDoor }); break }
      if (chance(i === 0 ? 0.02 : 0.035)) { fail(pick(['network_error', 'power_outage', 'user_timeout']), 'collect', { battery: i + 1 }); break }

      const inBattery = own[i]
      const level = insert(inBattery, station, emptyDoor, t)
      step('collect', { battery: i + 1, batteryId: inBattery.id, door: emptyDoor, chargeLevel: level })
      tx.insertedBatteryIds.push(inBattery.id)

      if (chance(0.015)) { fail(pick(['network_error', 'server_timeout']), 'dispense', { battery: i + 1 }); break }
      const outBattery = charged.sort((a, b) => b.health - a.health)[0]
      const outDoor = outBattery.loc.door
      dispense(outBattery, station, user, t)
      step('dispense', { battery: i + 1, batteryId: outBattery.id, door: outDoor, chargeLevel: 100 })
      tx.dispensedBatteryIds.push(outBattery.id)
      tx.swapCount++
    }
  }
  // a collected-but-not-dispensed battery means the user lost one: hand it back as the station does
  if (tx.insertedBatteryIds.length > tx.dispensedBatteryIds.length) {
    const lostId = tx.insertedBatteryIds.pop()
    const b = batteryById.get(lostId)
    b.chargingCyclesCompleted -= 1
    station.doors[b.loc.door - 1] = null
    b.loc = { type: 'scooter', userId: user.id, scooterId: user.scooter.id }
    t += int(10, 30) * 1000
    tx.steps.push({ step: 'return', status: 'completed', at: iso(t), batteryId: lostId, note: 'Inserted battery released back to user after failure' })
  }
  if (tx.status === 'success') tx.steps.push({ step: 'complete', status: 'completed', at: iso(t += 2000) })
  tx.completedAt = t
  transactions.push(tx)
}

// ---------- finalise output ----------
const out = {}

out.batteries = batteries.map((b) => {
  const atStation = b.loc.type === 'station'
  let status, chargeLevel
  if (b.faulty) { status = 'faulty'; chargeLevel = round(rand() * 30, 0) }
  else if (atStation) { status = b.readyAt > NOW ? 'charging' : 'charged'; chargeLevel = b.chargeStart ? chargeAt(b, NOW) : 100 }
  else { status = 'in_use'; chargeLevel = scooterCharge(b, NOW) }
  const cycles = b.chargingCyclesCompleted
  return {
    id: b.id,
    batteryId: b.batteryId,
    serialNumber: b.serialNumber,
    model: b.model,
    capacityKwh: b.capacityKwh,
    voltage: b.voltage,
    health: b.health,
    chargingCyclesCompleted: cycles,
    chargingCyclesRemaining: SUPPORTED_CYCLES - cycles,
    supportedChargingCycles: SUPPORTED_CYCLES,
    condition: condition(cycles),
    status,
    chargeLevel,
    estimatedFullChargeAt: status === 'charging' ? iso(b.readyAt) : null,
    faultReason: b.faultReason,
    location: atStation
      ? { type: 'station', stationId: b.loc.stationId, doorNumber: b.loc.door }
      : { type: 'scooter', userId: b.loc.userId, scooterId: b.loc.scooterId },
    lastSwappedAt: b.lastSwappedAt ? iso(b.lastSwappedAt) : null,
    manufacturedAt: iso(b.manufacturedAt),
    createdAt: iso(b.createdAt),
    updatedAt: iso(Math.max(b.updatedAt, b.createdAt)),
  }
})
const finalBattery = new Map(out.batteries.map((b) => [b.id, b]))

out.stations = stations.map((s, i) => {
  const list = s.doors.filter(Boolean).map((id) => finalBattery.get(id))
  const txs = transactions.filter((t) => t.stationId === s.id)
  const status = i % 33 === 7 ? 'offline' : i % 41 === 11 ? 'maintenance' : 'online'
  const lastTx = txs.at(-1)
  return {
    id: s.id,
    stationCode: s.stationCode,
    name: s.name,
    location: s.location,
    status,
    connectivity: status === 'offline' ? 'disconnected' : pick(['4g', '4g', 'wifi', 'ethernet']),
    operatingHours: { open: '06:00', close: '23:00' },
    totalDoors: s.totalDoors,
    doors: s.doors.map((id, d) => ({
      doorNumber: d + 1,
      batteryId: id,
      status: id ? (finalBattery.get(id).status === 'faulty' ? 'occupied_faulty' : 'occupied') : 'empty',
    })),
    chargedBatteries: list.filter((b) => b.status === 'charged').length,
    chargingBatteries: list.filter((b) => b.status === 'charging').length,
    notWorkingBatteries: list.filter((b) => b.status === 'faulty').length,
    emptyDoors: s.doors.filter((id) => !id).length,
    batteryIds: list.map((b) => b.id),
    totalSwaps: txs.filter((t) => t.status !== 'failed').length,
    lastSwapAt: lastTx ? iso(lastTx.startedAt) : null,
    lastHeartbeatAt: iso(status === 'offline' ? NOW - int(3, 20) * HOUR : NOW - int(5, 90) * 1000),
    installedAt: iso(s.installedAt),
    createdAt: iso(s.installedAt - 7 * DAY),
    updatedAt: iso(Math.max(lastTx?.completedAt ?? 0, NOW - int(1, 30) * MIN)),
  }
})

out.users = users.map((u) => {
  const txs = transactions.filter((t) => t.userId === u.id)
  const last = txs.filter((t) => t.status !== 'failed').at(-1)
  return {
    id: u.id,
    name: u.name,
    age: u.age,
    gender: u.gender,
    phone: u.phone,
    email: u.email,
    rfidTag: u.rfidTag,
    homeCity: u.homeCity,
    status: u.status,
    scooter: u.scooter,
    batteryIds: out.batteries.filter((b) => b.location.type === 'scooter' && b.location.userId === u.id).map((b) => b.id),
    subscription: u.subscription,
    favouriteStationIds: [...new Set(u.favouriteStationIds)],
    totalSwaps: txs.filter((t) => t.status !== 'failed').length,
    lastSwapAt: last ? iso(last.startedAt) : null,
    createdAt: iso(u.createdAt),
    updatedAt: iso(Math.max(u.createdAt, txs.at(-1)?.completedAt ?? 0)),
  }
})

out.transactions = transactions.map((t) => ({
  id: t.id,
  rfid: t.rfid,
  userId: t.userId,
  userName: t.userName,
  scooterId: t.scooterId,
  stationId: t.stationId,
  stationName: t.stationName,
  location: t.location,
  swappedAt: iso(t.startedAt),
  completedAt: iso(t.completedAt),
  durationSeconds: Math.round((t.completedAt - t.startedAt) / 1000),
  status: t.status,
  swapCount: t.swapCount,
  insertedBatteryIds: t.insertedBatteryIds,
  dispensedBatteryIds: t.dispensedBatteryIds,
  failureReason: t.failureReason,
  failureMessage: t.failureMessage,
  failedAtStep: t.failedAtStep,
  estimatedWaitMinutes: t.estimatedWaitMinutes,
  steps: t.steps.map(({ wait, ...s }) => s),
  createdAt: iso(t.startedAt),
  updatedAt: iso(t.completedAt),
}))

// ---------- consistency checks ----------
function check(cond, msg) { if (!cond) throw new Error(`Consistency check failed: ${msg}`) }
const seen = new Map()
for (const s of out.stations) {
  for (const d of s.doors) if (d.batteryId) {
    check(!seen.has(d.batteryId), `${d.batteryId} in two places`)
    seen.set(d.batteryId, s.id)
    const b = finalBattery.get(d.batteryId)
    check(b.location.type === 'station' && b.location.stationId === s.id && b.location.doorNumber === d.doorNumber, `${b.id} location mismatch`)
  }
  check(s.chargedBatteries + s.chargingBatteries + s.notWorkingBatteries + s.emptyDoors === s.totalDoors, `${s.id} counts`)
}
for (const u of out.users) {
  check(u.batteryIds.length === 2, `${u.id} has ${u.batteryIds.length} batteries`)
  for (const id of u.batteryIds) {
    check(!seen.has(id), `${id} in two places`)
    seen.set(id, u.id)
    check(finalBattery.get(id).status !== 'faulty', `faulty battery ${id} in scooter`)
  }
}
check(seen.size === out.batteries.length, 'every battery is placed exactly once')
for (const t of out.transactions) {
  check(t.insertedBatteryIds.length === t.dispensedBatteryIds.length && t.swapCount === t.insertedBatteryIds.length, `${t.id} battery counts`)
  check(t.status === 'success' ? t.swapCount === 2 : t.status === 'partial' ? t.swapCount === 1 : t.swapCount === 0, `${t.id} status`)
}
for (const u of out.users) {
  const last = out.transactions.filter((t) => t.userId === u.id && t.swapCount > 0).at(-1)
  if (last) for (const id of last.dispensedBatteryIds) check(u.batteryIds.includes(id) || out.transactions.some((t) => t.userId === u.id && t.swappedAt > last.swappedAt), `${u.id} latest dispensed battery`)
}

// ---------- write files ----------
mkdirSync(OUT_DIR, { recursive: true })
const header = '// AUTO-GENERATED by scripts/generate-mock-data.mjs — do not edit by hand.\n'
const files = [
  ['stations', 'ChargingStation', out.stations],
  ['batteries', 'Battery', out.batteries],
  ['users', 'User', out.users],
  ['transactions', 'SwapTransaction', out.transactions],
]
for (const [name, type, data] of files) {
  writeFileSync(join(OUT_DIR, `${name}.ts`), `${header}import type { ${type} } from './types'\n\nexport const ${name}: ${type}[] = ${JSON.stringify(data, null, 2)}\n`)
}

const by = (arr, key) => arr.reduce((acc, x) => ((acc[x[key]] = (acc[x[key]] ?? 0) + 1), acc), {})
console.log({
  stations: out.stations.length,
  batteries: out.batteries.length,
  batteryStatus: by(out.batteries, 'status'),
  batteryCondition: by(out.batteries, 'condition'),
  users: out.users.length,
  transactions: out.transactions.length,
  transactionStatus: by(out.transactions, 'status'),
  failureReasons: by(out.transactions.filter((t) => t.failureReason), 'failureReason'),
})
