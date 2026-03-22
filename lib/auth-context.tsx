"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type {
  SRMUser,
  SRMAttendance,
  SRMTimetableSlot,
  SRMCourse,
  SRMMarks,
  SRMCalendarEvent,
  SRMCircular,
} from "./srm-api"
import {
  fetchUserDetails,
  fetchAttendance,
  fetchTimetable,
  fetchCourses,
  fetchMarks,
  fetchCalendar,
  fetchCirculars,
  syncData,
} from "./srm-api"

interface TimetableMetadata {
  section: string
  batch: string
  availableSections: string[]
  availableBatches: string[]
  totalClasses: number
  lastUpdated: string
  dateTodayOrder?: Record<string, number>
}

interface DataStatus {
  user: "loading" | "success" | "error"
  attendance: "loading" | "success" | "error"
  timetable: "loading" | "success" | "error"
  courses: "loading" | "success" | "error"
  marks: "loading" | "success" | "error"
  calendar: "loading" | "success" | "error"
  circulars: "loading" | "success" | "error"
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  user: SRMUser | null
  attendance: SRMAttendance[]
  timetable: SRMTimetableSlot[]
  timetableMetadata: TimetableMetadata | null
  courses: SRMCourse[]
  marks: SRMMarks[]
  calendar: SRMCalendarEvent[]
  circulars: SRMCircular[]
  dateToDoMap: Record<string, number>  // date → day_order from academic planner
  dataStatus: DataStatus
  lastSyncTime: string | null
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>
  logout: () => void
  refreshData: () => Promise<void>
  updateTimetableSettings: (section: string, batch: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const initialDataStatus: DataStatus = {
  user: "loading",
  attendance: "loading",
  timetable: "loading",
  courses: "loading",
  marks: "loading",
  calendar: "loading",
  circulars: "loading",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    user: null,
    attendance: [],
    timetable: [],
    timetableMetadata: null,
    courses: [],
    marks: [],
    calendar: [],
    circulars: [],
    dateToDoMap: {},
    dataStatus: initialDataStatus,
    lastSyncTime: null,
  })

  useEffect(() => {
    const storedToken = localStorage.getItem("srm_token")
    const storedSection = localStorage.getItem("srm_section")
    const storedBatch = localStorage.getItem("srm_batch")

    if (storedToken) {
      login(storedToken, storedSection || undefined, storedBatch || undefined)
    } else {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (token: string, section?: string, batch?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, dataStatus: initialDataStatus }))

    try {
      // Fetch user first to validate token
      const user = await fetchUserDetails(token)

      if (!user) {
        localStorage.removeItem("srm_token")
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          token: null,
          user: null,
          dataStatus: { ...initialDataStatus, user: "error" },
        }))
        return
      }

      // User authenticated, update state and fetch remaining data
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        token,
        user,
        dataStatus: { ...prev.dataStatus, user: "success" },
      }))
      localStorage.setItem("srm_token", token)

      // Fetch all other data in parallel
      const [attendance, timetableData, courses, marks, calendar, circulars] = await Promise.allSettled([
        fetchAttendance(token),
        fetchTimetable(token, section, batch),
        fetchCourses(token),
        fetchMarks(token),
        fetchCalendar(token),
        fetchCirculars(token),
      ])

      setState((prev) => ({
        ...prev,
        isLoading: false,
        attendance: attendance.status === "fulfilled" ? attendance.value || [] : [],
        timetable: timetableData.status === "fulfilled" ? timetableData.value?.timetable || [] : [],
        timetableMetadata: timetableData.status === "fulfilled" ? {
              ...(timetableData.value?.metadata || {}),
              dateTodayOrder: timetableData.value?.dateTodayOrder || {},
            } : null,
        courses: courses.status === "fulfilled" ? courses.value || [] : [],
        marks: marks.status === "fulfilled" ? marks.value || [] : [],
        calendar: calendar.status === "fulfilled" ? calendar.value?.events || [] : [],
        dateToDoMap: calendar.status === "fulfilled" ? calendar.value?.dateToDoMap || {} : {},
        circulars: circulars.status === "fulfilled" ? circulars.value || [] : [],
        lastSyncTime: new Date().toISOString(),
        dataStatus: {
          user: "success",
          attendance: attendance.status === "fulfilled" && attendance.value?.length ? "success" : "error",
          timetable:
            timetableData.status === "fulfilled" && timetableData.value?.timetable?.length ? "success" : "error",
          courses: courses.status === "fulfilled" && courses.value?.length ? "success" : "error",
          marks: marks.status === "fulfilled" && marks.value?.length ? "success" : "error",
          calendar: calendar.status === "fulfilled" ? "success" : "error",
          circulars: circulars.status === "fulfilled" ? "success" : "error",
        },
      }))
    } catch (error) {
      console.error("[v0] Login error:", error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const logout = () => {
    localStorage.removeItem("srm_token")
    localStorage.removeItem("srm_section")
    localStorage.removeItem("srm_batch")
    setState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      user: null,
      attendance: [],
      timetable: [],
      timetableMetadata: null,
      courses: [],
      marks: [],
      calendar: [],
      circulars: [],
      dateToDoMap: {},
      dataStatus: initialDataStatus,
      lastSyncTime: null,
    })
  }

  const refreshData = async () => {
    if (!state.token) return

    setState((prev) => ({ ...prev, isLoading: true, dataStatus: initialDataStatus }))

    try {
      // Step 1: Tell backend to re-scrape SRM
      const syncResult = await syncData(state.token)
      if (!syncResult.success) {
        console.error("[v0] Sync failed:", syncResult.error)
        // If sync fails (e.g. credentials not stored), fall back to refetching cached data
      }

      // Step 2: Refetch all data from backend (now fresh after sync)
      const section = localStorage.getItem("srm_section") || undefined
      const batch = localStorage.getItem("srm_batch") || undefined

      const [attendance, timetableData, courses, marks, calendar, circulars] = await Promise.allSettled([
        fetchAttendance(state.token),
        fetchTimetable(state.token, section, batch),
        fetchCourses(state.token),
        fetchMarks(state.token),
        fetchCalendar(state.token),
        fetchCirculars(state.token),
      ])

      setState((prev) => ({
        ...prev,
        isLoading: false,
        attendance: attendance.status === "fulfilled" ? attendance.value || [] : prev.attendance,
        timetable: timetableData.status === "fulfilled" ? timetableData.value?.timetable || [] : prev.timetable,
        timetableMetadata: timetableData.status === "fulfilled" ? {
              ...(timetableData.value?.metadata || {}),
              dateTodayOrder: timetableData.value?.dateTodayOrder || {},
            } : prev.timetableMetadata,
        courses: courses.status === "fulfilled" ? courses.value || [] : prev.courses,
        marks: marks.status === "fulfilled" ? marks.value || [] : prev.marks,
        calendar: calendar.status === "fulfilled" ? calendar.value?.events || [] : prev.calendar,
        dateToDoMap: calendar.status === "fulfilled" ? calendar.value?.dateToDoMap || {} : prev.dateToDoMap,
        circulars: circulars.status === "fulfilled" ? circulars.value || [] : prev.circulars,
        lastSyncTime: new Date().toISOString(),
        dataStatus: {
          user: "success",
          attendance: attendance.status === "fulfilled" ? "success" : "error",
          timetable: timetableData.status === "fulfilled" ? "success" : "error",
          courses: courses.status === "fulfilled" ? "success" : "error",
          marks: marks.status === "fulfilled" ? "success" : "error",
          calendar: calendar.status === "fulfilled" ? "success" : "error",
          circulars: circulars.status === "fulfilled" ? "success" : "error",
        },
      }))
    } catch (error) {
      console.error("[v0] Refresh error:", error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const updateTimetableSettings = async (section: string, batch: string) => {
    if (!state.token) return

    setState((prev) => ({ ...prev, isLoading: true }))

    localStorage.setItem("srm_section", section)
    localStorage.setItem("srm_batch", batch)

    try {
      const timetableData = await fetchTimetable(state.token, section, batch)

      setState((prev) => ({
        ...prev,
        isLoading: false,
        timetable: timetableData?.timetable || [],
        timetableMetadata: timetableData?.metadata || null,
        dataStatus: {
          ...prev.dataStatus,
          timetable: timetableData?.timetable?.length ? "success" : "error",
        },
      }))
    } catch (error) {
      console.error("[v0] Update timetable error:", error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshData, updateTimetableSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
