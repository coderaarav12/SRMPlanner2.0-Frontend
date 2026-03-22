"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw, Clock, MapPin, User, BookOpen, LogIn,
  ChevronLeft, ChevronRight, Calendar, List, Grid3X3,
  Settings2, GraduationCap, Users, Moon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const TIME_SLOTS = [
  { hour: 1,  time: "08:00 - 08:50", short: "8:00"  },
  { hour: 2,  time: "08:50 - 09:40", short: "8:50"  },
  { hour: 3,  time: "09:45 - 10:35", short: "9:45"  },
  { hour: 4,  time: "10:40 - 11:30", short: "10:40" },
  { hour: 5,  time: "11:35 - 12:25", short: "11:35" },
  { hour: 6,  time: "12:30 - 01:20", short: "12:30" },
  { hour: 7,  time: "01:25 - 02:15", short: "1:25"  },
  { hour: 8,  time: "02:20 - 03:10", short: "2:20"  },
  { hour: 9,  time: "03:10 - 04:00", short: "3:10"  },
  { hour: 10, time: "04:00 - 04:50", short: "4:00"  },
  { hour: 11, time: "04:50 - 05:30", short: "4:50"  },
  { hour: 12, time: "05:30 - 06:10", short: "5:30"  },
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Build 7 days starting from a given base date
function getWeekDaysFrom(baseDate: Date) {
  const todayStr = new Date().toISOString().split("T")[0]
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
    const dow = d.getDay()
    return {
      date: d.toISOString().split("T")[0],
      dayName: FULL_DAYS[dow],
      shortDay: WEEKDAYS[dow],
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      isWeekend: dow === 0 || dow === 6,
      isToday: d.toISOString().split("T")[0] === todayStr,
    }
  })
}

// Get the Sunday of the week containing today
function getThisWeekSunday() {
  const today = new Date()
  const d = new Date(today)
  d.setDate(today.getDate() - today.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getCurrentHour() {
  const now = new Date()
  const t = now.getHours() * 60 + now.getMinutes()
  const ranges = [
    { hour: 1,  start: 480,  end: 530  },
    { hour: 2,  start: 530,  end: 580  },
    { hour: 3,  start: 585,  end: 635  },
    { hour: 4,  start: 640,  end: 690  },
    { hour: 5,  start: 695,  end: 745  },
    { hour: 6,  start: 750,  end: 800  },
    { hour: 7,  start: 805,  end: 855  },
    { hour: 8,  start: 860,  end: 910  },
    { hour: 9,  start: 910,  end: 960  },
    { hour: 10, start: 960,  end: 1010 },
  ]
  return ranges.find((r) => t >= r.start && t <= r.end)?.hour || null
}

export function TimetableSection() {
  const {
    isAuthenticated, timetable, timetableMetadata,
    courses, calendar, dateToDoMap,
    isLoading, refreshData, user, updateTimetableSettings,
  } = useAuth()

  const [isLoginOpen,    setIsLoginOpen]    = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [viewMode,       setViewMode]       = useState<"today" | "list" | "week">("today")
  const [selectedSection, setSelectedSection] = useState(timetableMetadata?.section || "")
  const [selectedBatch,   setSelectedBatch]   = useState(timetableMetadata?.batch   || "1")

  // baseDate = Sunday of the displayed week, can slide forward/backward
  const [baseDate, setBaseDate] = useState(() => getThisWeekSunday())
  const weekDays = useMemo(() => getWeekDaysFrom(baseDate), [baseDate])

  // selectedDayIndex within the 7-day window — always start on today
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    return new Date().getDay() // 0=Sun, 1=Mon ... 6=Sat
  })

  const selectedDay = weekDays[selectedDayIndex]
  const currentHour = getCurrentHour()

  // Navigation: go to previous/next day, sliding the week window when needed
  const goToPrevDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(prev => prev - 1)
    } else {
      // At Sunday — go to previous week's Saturday
      const newBase = new Date(baseDate)
      newBase.setDate(baseDate.getDate() - 7)
      setBaseDate(newBase)
      setSelectedDayIndex(6)
    }
  }

  const goToNextDay = () => {
    if (selectedDayIndex < 6) {
      setSelectedDayIndex(prev => prev + 1)
    } else {
      // At Saturday — go to next week's Sunday
      const newBase = new Date(baseDate)
      newBase.setDate(baseDate.getDate() + 7)
      setBaseDate(newBase)
      setSelectedDayIndex(0)
    }
  }

  // Jump back to today
  const goToToday = () => {
    setBaseDate(getThisWeekSunday())
    setSelectedDayIndex(new Date().getDay())
  }

  // Build day_order → classes lookup
  const dayOrderToClasses = useMemo(() => {
    const map: Record<number, typeof timetable> = {}
    timetable.forEach((slot) => {
      const do_ = slot.day_order
      if (!map[do_]) map[do_] = []
      if (!map[do_].find((s: any) => s.hour === slot.hour && s.code === slot.code)) {
        map[do_].push(slot)
      }
    })
    Object.keys(map).forEach((do_) => map[Number(do_)].sort((a: any, b: any) => a.hour - b.hour))
    return map
  }, [timetable])

  // Date → day_order: comes directly from academic planner via fetchCalendar
  // This is always correct — no stale data, no session issues
  const finalDateToDayOrder = dateToDoMap

  // Date → holiday lookup from academic calendar
  const dateToHoliday = useMemo(() => {
    const map: Record<string, string> = {}
    calendar.forEach((event: any) => {
      if (event.type === "holiday" || event.type === "event") {
        map[event.date] = event.title
          .replace(/ - Holiday$/i, "")
          .replace(/ - holiday$/i, "")
          .trim()
      }
    })
    return map
  }, [calendar])

  // Date → classes (via day_order) — recomputes when week slides
  const dateToClasses = useMemo(() => {
    const map: Record<string, typeof timetable> = {}
    weekDays.forEach((day) => {
      if (!day.isWeekend) {
        const dayOrder = finalDateToDayOrder[day.date]
        map[day.date] = dayOrder ? (dayOrderToClasses[dayOrder] || []) : []
      } else {
        map[day.date] = []
      }
    })
    return map
  }, [weekDays, finalDateToDayOrder, dayOrderToClasses])

  const selectedDayClasses = useMemo(() => {
    if (!selectedDay) return []
    const dayOrder = finalDateToDayOrder[selectedDay.date]
    return dayOrder ? (dayOrderToClasses[dayOrder] || []) : []
  }, [selectedDay, finalDateToDayOrder, dayOrderToClasses])

  const selectedDayOrder = selectedDay ? finalDateToDayOrder[selectedDay.date] : undefined

  const getCourseDetails = (code: string) => {
    if (!courses || !Array.isArray(courses)) return undefined
    return courses.find((c: any) => c.code === code || c.courseCode === code)
  }

  const getTypeColor = (type: string) => {
    const t = type?.toLowerCase() || ""
    if (t.includes("lab based")) return "from-neon-purple/30 to-purple-500/30 border-neon-purple/50 text-neon-purple"
    if (t === "theory")          return "from-primary/30 to-cyan-500/30 border-primary/50 text-primary"
    if (t.includes("practical") || t === "lab") return "from-accent/30 to-pink-500/30 border-accent/50 text-accent"
    return "from-primary/20 to-cyan-500/20 border-primary/40 text-primary"
  }

  const getTypeBgColor = (type: string) => {
    const t = type?.toLowerCase() || ""
    if (t.includes("lab based")) return "bg-neon-purple/20 text-neon-purple border-neon-purple/30"
    if (t === "theory")          return "bg-primary/20 text-primary border-primary/30"
    if (t.includes("practical") || t === "lab") return "bg-accent/20 text-accent border-accent/30"
    return "bg-primary/20 text-primary border-primary/30"
  }

  const uniqueCourses = new Set(timetable.map((t: any) => t.code)).size
  const totalCredits  = Array.isArray(courses) ? courses.reduce((s: number, c: any) => s + (c.credits || 0), 0) : 0
  // Count lab hours per 5-day cycle (unique slots only)
  const labHours = useMemo(() => {
    const seen = new Set<string>()
    timetable.forEach((s: any) => {
      const key = `${s.day_order}-${s.hour}-${s.code}`
      if (s.type?.toLowerCase().includes("lab") || s.type?.toLowerCase().includes("practical")) {
        seen.add(key)
      }
    })
    return seen.size
  }, [timetable])



  const handleSaveSettings = async () => {
    await updateTimetableSettings(selectedSection, selectedBatch)
    setIsSettingsOpen(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 neon-text">Connect to View Timetable</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm px-4">
              Login with your SRM Academia credentials to sync your timetable.
            </p>
            <Button size="lg" onClick={() => setIsLoginOpen(true)} className="bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90">
              <LogIn className="w-5 h-5 mr-2" /> Connect to SRM Academia
            </Button>
          </motion.div>
        </div>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-3 md:px-4">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold mb-1 neon-text">My Timetable</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                    <GraduationCap className="w-3 h-3" />
                    {user?.specialization || timetableMetadata?.section || "CS AIML"}
                  </span>
                  <span className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    Batch {timetableMetadata?.batch || "1"}
                  </span>
                  <span className="text-xs opacity-70">{uniqueCourses} courses/cycle</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent">
                <Settings2 className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Settings</span>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(["today", "list", "week"] as const).map((mode, i) => (
                  <Button key={mode} variant="outline" size="icon" onClick={() => setViewMode(mode)}
                    className={`h-9 w-9 ${i === 2 ? "hidden md:flex" : ""} ${viewMode === mode ? "bg-primary/20 border-primary" : "border-border"}`}>
                    {i === 0 ? <Calendar className="w-4 h-4" /> : i === 1 ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
            <DialogHeader>
              <DialogTitle className="neon-text">Timetable Settings</DialogTitle>
              <DialogDescription>Select your section and batch.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="border-primary/30 bg-secondary/30"><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{(timetableMetadata?.availableSections || ["CS AIML"]).map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4 text-accent" />Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger className="border-accent/30 bg-secondary/30"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{(timetableMetadata?.availableBatches || ["1","2"]).map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="pt-4 flex gap-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSaveSettings} disabled={isLoading} className="flex-1 bg-gradient-to-r from-primary to-cyan-400 text-background">
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Settings2 className="w-4 h-4 mr-2" />}Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 7-Day Navigation */}
        {viewMode === "today" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl neon-border glass">
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={goToPrevDay} className="h-10 w-10">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToToday}
                  className="text-xs text-cyan-400 hover:bg-cyan-400/10 px-2 h-8">
                  Today
                </Button>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="flex gap-1 w-full justify-between">
                  {weekDays.map((day, index) => {
                    const isSelected = selectedDayIndex === index
                    const dayOrder   = finalDateToDayOrder[day.date]
                    return (
                      <Button
                        key={day.date}
                        variant={isSelected ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedDayIndex(index)}
                        className={`flex flex-col h-auto py-2 px-1 flex-1 ${
                          isSelected
                            ? "bg-primary text-background"
                            : day.isWeekend
                            ? "opacity-50 hover:opacity-70 hover:bg-secondary/50"
                            : "hover:bg-primary/10"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-medium opacity-70">{day.shortDay}</span>
                        <span className="text-base font-bold leading-tight">{day.dayNum}</span>
                        <span className="text-[9px] opacity-60">{day.month}</span>
                        {day.isToday && (
                          <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? "text-background/80" : "text-cyan-400"}`}>TODAY</span>
                        )}
                        {dayOrder && !day.isWeekend && (
                          <span className={`text-[9px] mt-0.5 ${isSelected ? "text-background/70" : "text-primary/60"}`}>DO {dayOrder}</span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={goToNextDay} className="h-10 w-10 shrink-0">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Day View */}
        <AnimatePresence mode="wait">
          {viewMode === "today" && (
            <motion.div
              key={selectedDay?.date}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Day header */}
              <div className="flex items-center gap-3 px-1">
                <h2 className="text-lg font-semibold">{selectedDay?.dayName}</h2>
                <span className="text-sm text-muted-foreground">{selectedDay?.dayNum} {selectedDay?.month}</span>
                {selectedDayOrder && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Day Order {selectedDayOrder}
                  </span>
                )}
                {selectedDay?.isToday && (
                  <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full">Today</span>
                )}
              </div>

              {/* Weekend */}
              {selectedDay?.isWeekend ? (
                <div className="text-center py-16 rounded-xl neon-border glass">
                  <Moon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-lg font-semibold text-muted-foreground">{selectedDay.dayName}</p>
                  {dateToHoliday[selectedDay.date] ? (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400">
                      <span className="text-lg">🎉</span>
                      <span className="font-medium">{dateToHoliday[selectedDay.date]}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 mt-1">No classes — enjoy your weekend!</p>
                  )}
                </div>

              /* Weekday with no classes (holiday or not in schedule) */
              ) : selectedDayClasses.length === 0 ? (
                <div className="text-center py-16 rounded-xl neon-border glass">
                  {dateToHoliday[selectedDay.date] ? (
                    <>
                      <div className="text-5xl mb-4">🎉</div>
                      <p className="text-xl font-bold text-green-400">{dateToHoliday[selectedDay.date]}</p>
                      <p className="text-sm text-muted-foreground mt-2">Holiday — no classes today</p>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                      <p className="text-lg font-semibold text-muted-foreground">No Classes Scheduled</p>
                      <p className="text-sm text-muted-foreground/60 mt-1">This may be a holiday or free day</p>
                    </>
                  )}
                </div>

              /* Classes */
              ) : (
                selectedDayClasses.map((classData: any, index: number) => {
                  const courseDetails  = getCourseDetails(classData.code)
                  const isCurrentClass = selectedDay?.isToday && currentHour === classData.hour
                  const timeSlot       = TIME_SLOTS.find((s) => s.hour === classData.hour)

                  return (
                    <motion.div
                      key={`${classData.code}-${classData.hour}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-4 md:p-5 rounded-xl bg-gradient-to-r ${getTypeColor(classData.type)} border glass overflow-hidden ${
                        isCurrentClass ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                      }`}
                    >
                      {isCurrentClass && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary animate-pulse" />
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:text-center sm:min-w-[70px]">
                          <div className="text-lg md:text-2xl font-bold">{timeSlot?.short || classData.time?.split(" - ")[0]}</div>
                          <div className="text-xs text-muted-foreground">Hour {classData.hour}</div>
                          {isCurrentClass && <span className="text-xs bg-primary text-background px-2 py-0.5 rounded-full">NOW</span>}
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-border/50" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-mono text-xs md:text-sm opacity-80">{classData.code}</div>
                              <div className="text-base md:text-lg font-semibold truncate">{classData.name}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${getTypeBgColor(classData.type)}`}>
                                {classData.type}
                              </span>
                              {classData.slot && <span className="text-xs opacity-60">Slot {classData.slot}</span>}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs md:text-sm opacity-70">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{classData.room}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{classData.faculty}</span>
                            {courseDetails && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{courseDetails.credits} Credits</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {weekDays.map((day, dayIndex) => {
                const dayClasses = dateToClasses[day.date] || []
                const dayOrder   = finalDateToDayOrder[day.date]
                return (
                  <motion.div key={day.date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.07 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold">{day.dayName}</h3>
                      <span className="text-xs text-muted-foreground">{day.dayNum} {day.month}</span>
                      {dayOrder && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Day Order {dayOrder}</span>}
                      {day.isToday && <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full">Today</span>}
                    </div>
                    {day.isWeekend ? (
                      <div className="p-3 rounded-lg bg-secondary/20 text-center text-sm flex items-center justify-center gap-2">
                        <Moon className="w-4 h-4 text-muted-foreground/50" />
                        {dateToHoliday[day.date] ? (
                          <span className="text-green-400 font-medium">🎉 {dateToHoliday[day.date]}</span>
                        ) : (
                          <span className="text-muted-foreground/50">Weekend</span>
                        )}
                      </div>
                    ) : dayClasses.length === 0 ? (
                      <div className="p-3 rounded-lg bg-secondary/20 text-center text-sm">
                        {dateToHoliday[day.date] ? (
                          <span className="text-green-400 font-medium">🎉 {dateToHoliday[day.date]} — Holiday</span>
                        ) : (
                          <span className="text-muted-foreground">No classes scheduled</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {dayClasses.map((c: any) => {
                          const ts = TIME_SLOTS.find((s) => s.hour === c.hour)
                          return (
                            <div key={`${day.date}-${c.hour}-${c.code}`} className={`p-3 rounded-lg border bg-gradient-to-r ${getTypeColor(c.type)}`}>
                              <div className="flex items-center gap-3">
                                <div className="text-xs font-mono w-14 shrink-0 font-bold">{ts?.short}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{c.name}</div>
                                  <div className="text-xs opacity-70">{c.code} • {c.room}</div>
                                </div>
                                <div className={`text-xs px-2 py-0.5 rounded border ${getTypeBgColor(c.type)}`}>{c.type}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Week Grid - all 7 days, scrollable on mobile */}
          {viewMode === "week" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl neon-border glass overflow-hidden">
              <div className="overflow-x-auto">
                <div className="p-2" style={{ minWidth: "700px" }}>
                  {/* Header row */}
                  <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
                    <div className="p-1 text-center text-[10px] text-muted-foreground">Time</div>
                    {weekDays.map((day) => {
                      const dayOrder = finalDateToDayOrder[day.date]
                      const holiday  = dateToHoliday[day.date]
                      return (
                        <div key={day.date} className={`p-1 text-center rounded-lg ${
                          day.isToday ? "bg-cyan-400/10" :
                          day.isWeekend ? "bg-secondary/20" : ""
                        }`}>
                          <div className={`text-[11px] font-bold ${day.isToday ? "text-cyan-400" : day.isWeekend ? "text-muted-foreground/50" : "text-foreground"}`}>
                            {day.shortDay}
                          </div>
                          <div className={`text-[13px] font-bold ${day.isToday ? "text-cyan-400" : day.isWeekend ? "text-muted-foreground/40" : "text-foreground"}`}>
                            {day.dayNum}
                          </div>
                          {dayOrder && !day.isWeekend && (
                            <div className="text-[9px] text-primary/70">DO {dayOrder}</div>
                          )}
                          {holiday && (
                            <div className="text-[9px] text-green-400">🎉</div>
                          )}
                          {day.isToday && (
                            <div className="text-[8px] text-cyan-400 font-bold">TODAY</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Time slots */}
                  {TIME_SLOTS.slice(0, 10).map((slot) => (
                    <div key={slot.hour} className="grid gap-1 mb-0.5" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
                      {/* Time label */}
                      <div className="text-center text-[9px] text-muted-foreground bg-secondary/20 rounded flex items-center justify-center">
                        {slot.short}
                      </div>
                      {weekDays.map((day) => {
                        const holiday = dateToHoliday[day.date]
                        const classData = !day.isWeekend && !holiday
                          ? (dateToClasses[day.date] || []).find((s: any) => s.hour === slot.hour)
                          : null
                        const isCurrentSlot = day.isToday && currentHour === slot.hour
                        return (
                          <div
                            key={`${day.date}-${slot.hour}`}
                            className={`rounded min-h-[48px] transition-all overflow-hidden ${
                              day.isWeekend
                                ? "bg-secondary/5 opacity-30"
                                : holiday
                                ? "bg-green-500/5 border border-green-500/15"
                                : classData
                                ? `bg-gradient-to-br ${getTypeColor(classData.type)} border cursor-pointer`
                                : "bg-secondary/10"
                            } ${isCurrentSlot && classData ? "ring-1 ring-primary" : ""}`}
                          >
                            {/* Holiday indicator - only show on first slot */}
                            {holiday && !day.isWeekend && slot.hour === 1 && (
                              <div className="h-full flex items-center justify-center p-1">
                                <span className="text-[9px] text-green-400 text-center leading-tight">🎉<br/>Holiday</span>
                              </div>
                            )}
                            {classData && (
                              <div className="p-1 text-[9px] leading-tight">
                                <div className="font-semibold truncate">{classData.name}</div>
                                <div className="opacity-60 truncate">{classData.code}</div>
                                <div className="opacity-50 truncate">{classData.room}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* Mobile hint */}
              <div className="md:hidden text-center py-1 text-[10px] text-muted-foreground/40 border-t border-border/20">
                ← scroll to see all days →
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 p-4 rounded-xl neon-border glass">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><div className="text-2xl font-bold text-primary">{uniqueCourses}</div><div className="text-xs text-muted-foreground">Total Courses</div></div>
            <div><div className="text-2xl font-bold text-accent">{totalCredits}</div><div className="text-xs text-muted-foreground">Total Credits</div></div>
            <div><div className="text-2xl font-bold text-neon-purple">{labHours}</div><div className="text-xs text-muted-foreground">Lab Hours</div></div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">{selectedDayClasses.length}</div>
              <div className="text-xs text-muted-foreground">{selectedDay?.isToday ? "Classes Today" : `${selectedDay?.dayName} Classes`}</div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
