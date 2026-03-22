// lib/srm-api.ts
// All shapes verified against live Worker + real SRM page screenshots.

// ─── Raw Worker shapes ────────────────────────────────────────────────────────

interface WorkerUser {
  name: string
  regNumber: string
  program: string
  department: string
  section: string
  semester?: number
  batch: string          // Worker now returns "1", "2" after scraper fix
}

interface WorkerAttendanceItem {
  courseCode: string
  courseTitle: string
  category: string
  facultyName: string
  slot: string
  hoursConducted: number
  hoursAbsent: number
  attendancePercentage: number
}

interface WorkerTestItem {
  test: string           // "FT-I", "FT-II", "CT-I" etc.
  scored: number | "Abs"
  total: number
}

interface WorkerMarksItem {
  courseCode: string
  courseName: string
  courseType: string
  testPerformance: WorkerTestItem[]
  overall: { scored: number; total: number }
}

interface WorkerCourseItem {
  code: string
  title: string
  credit: number
  category: string
  courseCategory: string
  type: string
  slotType: string       // "Theory" | "Practical"
  faculty: string
  slot: string
  room: string
  academicYear: string
}

interface WorkerTimetableSlotItem {
  code: string
  name: string
  type: string
  room: string
  faculty: string
  slot: string
  hour: number
  time: string
}

interface WorkerScheduleDay {
  day: number            // 1=Mon … 5=Fri
  table: (WorkerTimetableSlotItem | null)[]
}

interface WorkerTimetable {
  batch: string
  schedule: WorkerScheduleDay[]
}

// dayOrder is "-" for holidays/weekends, "1"–"5" for class days
interface WorkerCalendarDay {
  date: string           // "1"–"31" as string
  day: string            // "Mon", "Tue" etc.
  event: string          // "" or event name (HTML entities decoded by Worker)
  dayOrder: string       // "1"–"5" | "-"
}

interface WorkerCalendarMonth {
  month: string          // "Jan '26" (space before apostrophe)
  days: WorkerCalendarDay[]
}

interface WorkerCalendar {
  today: WorkerCalendarDay | null
  tomorrow: WorkerCalendarDay | null
  calendar: WorkerCalendarMonth[]
}

// ─── UI-facing interfaces ─────────────────────────────────────────────────────

export interface SRMUser {
  name: string
  username: string
  department: string
  batch: string
  semester: string
  program: string
  specialization: string
  section: string
}

export interface SRMAttendance {
  code: string
  name: string
  attended: number
  total: number
  percentage: number
  category: string
}

export interface SRMCourse {
  code: string
  name: string
  type: string
  credits: number
  faculty: string
  slot: string
}

export interface SRMTestRecord {
  test: string
  scored: number | "Abs"
  total: number
  max: number
}

export interface SRMMarks {
  code: string
  name: string
  tests: SRMTestRecord[]
  test1: number | null
  test1_max: number
  test2: number | null
  test2_max: number
  test3: number | null
  test3_max: number
  total: number
  maxTotal: number
  grade?: string
}

export interface SRMTimetableSlot {
  day: string
  day_order: number
  day_key: string
  date: string
  hour: number
  time: string
  code: string
  name: string
  room: string
  faculty: string
  type: string
  slot?: string
}

export interface SRMTimetableResponse {
  timetable: SRMTimetableSlot[]
  unified: any
  dateTodayOrder: Record<string, number>
  metadata: {
    section: string
    batch: string
    semester: number
    totalClasses: number
    lastUpdated: string
  }
}

export interface SRMCalendarEvent {
  id: string
  title: string
  date: string
  day: string
  type: "holiday" | "deadline" | "exam" | "event"
}

export interface SRMCircular {
  id: string
  title: string
  date: string
  category: string
  content: string
  attachmentUrl?: string
  isNew?: boolean
}

// ─── Transforms ───────────────────────────────────────────────────────────────

function transformUser(u: WorkerUser): SRMUser {
  // Extra safety: if batch is "11" (old cached session before scraper fix), take first digit
  const safeBatch = (String(u.batch ?? "1").match(/\d/) ?? ["1"])[0]
  return {
    name:           u.name,
    username:       u.regNumber,
    department:     u.department,
    batch:          safeBatch,
    semester:       String(u.semester ?? "1"),
    program:        u.program,
    specialization: u.section || u.department,
    section:        u.section || "",
  }
}

function transformAttendance(records: WorkerAttendanceItem[]): SRMAttendance[] {
  return records.map(r => ({
    code:       r.courseCode,
    name:       r.courseTitle,
    attended:   r.hoursConducted - r.hoursAbsent,
    total:      r.hoursConducted,
    percentage: r.attendancePercentage,
    category:   r.category,
  }))
}

function transformCourses(records: WorkerCourseItem[]): SRMCourse[] {
  return records.map(r => ({
    code:    r.code,
    name:    r.title,
    type:    r.slotType,
    credits: r.credit,
    faculty: r.faculty,
    slot:    r.slot,
  }))
}

function transformMarks(records: WorkerMarksItem[]): SRMMarks[] {
  return records
    // Filter out header rows — real codes start with two digits e.g. "21LEH101T"
    .filter(r => r.courseCode && /^\d{2}[A-Z]/.test(r.courseCode))
    .map(r => {
      const tests: SRMTestRecord[] = r.testPerformance.map(t => ({
        test:   t.test,
        scored: t.scored,
        total:  t.total,
        max:    t.total,
      }))
      const t1 = r.testPerformance[0]
      const t2 = r.testPerformance[1]
      const t3 = r.testPerformance[2]
      return {
        code:      r.courseCode,
        name:      r.courseName,
        tests,
        test1:     t1 ? (t1.scored === "Abs" ? null : Number(t1.scored)) : null,
        test1_max: t1?.total ?? 0,
        test2:     t2 ? (t2.scored === "Abs" ? null : Number(t2.scored)) : null,
        test2_max: t2?.total ?? 0,
        test3:     t3 ? (t3.scored === "Abs" ? null : Number(t3.scored)) : null,
        test3_max: t3?.total ?? 0,
        total:     r.overall.scored,
        maxTotal:  r.overall.total,
      }
    })
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const DAY_NAMES   = ["Monday","Tuesday","Wednesday","Thursday","Friday"]

function parseMonthLabel(label: string): { year: number; monthIndex: number } | null {
  // Handles "Jan'25" and "Jan '26" (with or without space before apostrophe)
  const m = label.match(/([A-Za-z]+)\s*'(\d{2})/)
  if (!m) return null
  const monthIndex = MONTH_NAMES.findIndex(mo => mo === m[1])
  if (monthIndex === -1) return null
  return { year: 2000 + parseInt(m[2], 10), monthIndex }
}

function toDateStr(year: number, monthIndex: number, dayStr: string): string | null {
  const day = parseInt(dayStr, 10)
  if (!day || isNaN(day)) return null
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

// Build date → dayOrder map. Skip "-" (holidays/weekends) and non-numeric values.
function buildDateToDoMap(workerCal: WorkerCalendar): Record<string, number> {
  const map: Record<string, number> = {}
  for (const month of workerCal.calendar) {
    const parsed = parseMonthLabel(month.month)
    if (!parsed) continue
    for (const d of month.days) {
      const doNum = parseInt(d.dayOrder, 10)
      if (isNaN(doNum) || doNum < 1 || doNum > 5) continue
      const dateStr = toDateStr(parsed.year, parsed.monthIndex, d.date)
      if (dateStr) map[dateStr] = doNum
    }
  }
  return map
}

function transformTimetable(
  workerTimetable: WorkerTimetable,
  workerCalendar: WorkerCalendar,
): { timetable: SRMTimetableSlot[]; dateTodayOrder: Record<string, number> } {
  const dateTodayOrder = buildDateToDoMap(workerCalendar)
  const slots: SRMTimetableSlot[] = []

  for (const [date, dayOrder] of Object.entries(dateTodayOrder)) {
    const daySchedule = workerTimetable.schedule.find(s => s.day === dayOrder)
    if (!daySchedule) continue
    for (const slot of daySchedule.table) {
      if (!slot) continue
      slots.push({
        day:       DAY_NAMES[dayOrder - 1] ?? `Day ${dayOrder}`,
        day_order: dayOrder,
        day_key:   `day${dayOrder}`,
        date,
        hour:      slot.hour,
        time:      slot.time,
        code:      slot.code,
        name:      slot.name,
        room:      slot.room,
        faculty:   slot.faculty,
        type:      slot.type,
        slot:      slot.slot,
      })
    }
  }

  return { timetable: slots, dateTodayOrder }
}

function transformCalendarEvents(workerCal: WorkerCalendar): SRMCalendarEvent[] {
  const events: SRMCalendarEvent[] = []
  for (const month of workerCal.calendar) {
    const parsed = parseMonthLabel(month.month)
    if (!parsed) continue
    for (const d of month.days) {
      if (!d.event) continue
      const dateStr = toDateStr(parsed.year, parsed.monthIndex, d.date)
      if (!dateStr) continue
      events.push({
        id:    dateStr,
        title: d.event,
        date:  dateStr,
        day:   d.day,
        type:  "holiday",
      })
    }
  }
  return events
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginToSRM(
  email: string,
  password: string,
  captchaAnswer?: string,
  cdigest?: string,
): Promise<{
  success: boolean
  token?: string
  error?: string
  requiresCaptcha?: boolean
  captchaImage?: string
  cdigest?: string
}> {
  try {
    console.log("[v0] loginToSRM - Sending request to /api/srm/login")
    const response = await fetch("/api/srm/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password, captcha: captchaAnswer, cdigest }),
    })
    console.log("[v0] loginToSRM - Response status:", response.status)
    const data = await response.json()
    console.log("[v0] loginToSRM - Response data:", data)

    if (data.captcha) {
      return {
        success:         false,
        requiresCaptcha: true,
        captchaImage:    data.captcha.image,
        cdigest:         data.captcha.cdigest,
      }
    }
    return data
  } catch (error) {
    console.error("[v0] loginToSRM - Fetch error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Network error" }
  }
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

export async function fetchUserDetails(token: string): Promise<SRMUser | null> {
  try {
    const res = await fetch("/api/srm/user", { headers: { "x-access-token": token } })
    if (!res.ok) return null
    const data = await res.json()
    const u: WorkerUser = data.user
    if (!u?.name) return null
    return transformUser(u)
  } catch {
    return null
  }
}

export async function fetchAttendance(token: string): Promise<SRMAttendance[]> {
  try {
    const res = await fetch("/api/srm/attendance", { headers: { "x-access-token": token } })
    if (!res.ok) return []
    const data = await res.json()
    return transformAttendance(data.attendance ?? [])
  } catch {
    return []
  }
}

export async function fetchCourses(token: string): Promise<SRMCourse[]> {
  try {
    const res = await fetch("/api/srm/courses", { headers: { "x-access-token": token } })
    if (!res.ok) return []
    const data = await res.json()
    return transformCourses(data.courses ?? [])
  } catch {
    return []
  }
}

export async function fetchMarks(token: string): Promise<SRMMarks[]> {
  try {
    const res = await fetch("/api/srm/marks", { headers: { "x-access-token": token } })
    if (!res.ok) return []
    const data = await res.json()
    return transformMarks(data.marks ?? [])
  } catch {
    return []
  }
}

export async function fetchTimetable(
  token: string,
  section?: string,
  batch?: string,
): Promise<SRMTimetableResponse | null> {
  try {
    const [ttRes, calRes] = await Promise.all([
      fetch("/api/srm/timetable", { headers: { "x-access-token": token } }),
      fetch("/api/srm/calendar",  { headers: { "x-access-token": token } }),
    ])
    if (!ttRes.ok) return null

    const ttData = await ttRes.json()
    const workerTimetable: WorkerTimetable = ttData.timetable ?? { batch: "1", schedule: [] }
    const workerUser: WorkerUser           = ttData.user    ?? {}

    let workerCalendar: WorkerCalendar = { today: null, tomorrow: null, calendar: [] }
    if (calRes.ok) {
      const calData  = await calRes.json()
      workerCalendar = calData.calendar ?? workerCalendar
    }

    // Normalise batch — take first digit in case of stale "11" from old cached session
    const rawBatch       = batch ?? workerTimetable.batch ?? String(workerUser.batch ?? "1")
    const effectiveBatch = (rawBatch.match(/\d/) ?? ["1"])[0]

    const { timetable, dateTodayOrder } = transformTimetable(workerTimetable, workerCalendar)

    return {
      timetable,
      unified: null,
      dateTodayOrder,
      metadata: {
        section:      section ?? workerUser.section ?? "",
        batch:        effectiveBatch,
        semester:     Number(workerUser.semester ?? 1),
        totalClasses: timetable.length,
        lastUpdated:  new Date().toISOString(),
      },
    }
  } catch {
    return null
  }
}

export async function fetchCalendar(
  token: string,
): Promise<{ events: SRMCalendarEvent[]; dateToDoMap: Record<string, number> }> {
  try {
    const res = await fetch("/api/srm/calendar", { headers: { "x-access-token": token } })
    if (!res.ok) return { events: [], dateToDoMap: {} }
    const data = await res.json()
    const workerCal: WorkerCalendar = data.calendar ?? { today: null, tomorrow: null, calendar: [] }
    return {
      events:      transformCalendarEvents(workerCal),
      dateToDoMap: buildDateToDoMap(workerCal),
    }
  } catch {
    return { events: [], dateToDoMap: {} }
  }
}

export async function syncData(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/srm/sync", {
      method:  "POST",
      headers: { "x-access-token": token },
    })
    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error ?? "Sync failed" }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" }
  }
}

export async function fetchCirculars(_token: string): Promise<SRMCircular[]> {
  return []
}
