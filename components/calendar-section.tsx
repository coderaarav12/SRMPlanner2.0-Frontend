"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  RefreshCw, LogIn, CalendarDays, ChevronLeft, ChevronRight,
  BookOpen, PartyPopper, FileText, Bell, Filter, Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

export function CalendarSection() {
  const { isAuthenticated, calendar, timetable, isLoading, refreshData } = useAuth()
  const [isLoginOpen, setIsLoginOpen]   = useState(false)
  const [currentDate, setCurrentDate]   = useState(new Date())
  const [filter, setFilter]             = useState<"all"|"holiday"|"exam"|"event"|"deadline">("all")
  const [viewMode, setViewMode]         = useState<"calendar"|"list">("calendar")
  const [selectedDay, setSelectedDay]   = useState<number|null>(null)

  const currentMonth = currentDate.getMonth()
  const currentYear  = currentDate.getFullYear()

  // Build date → day_order map from timetable slots
  const dateToDayOrder = useMemo(() => {
    const map: Record<string, number> = {}
    if (Array.isArray(timetable)) {
      timetable.forEach((slot: any) => {
        if (slot.date && slot.day_order) map[slot.date] = slot.day_order
      })
    }
    return map
  }, [timetable])

  const calendarDays = useMemo(() => {
    const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDay     = new Date(currentYear, currentMonth, 1).getDay()
    const days: (number|null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [currentMonth, currentYear])

  const getDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`

  const getEventsForDay = (day: number) => {
    const dateStr = getDateStr(day)
    return calendar.filter((e) => e.date === dateStr)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "holiday":  return <PartyPopper className="w-3 h-3" />
      case "exam":     return <BookOpen className="w-3 h-3" />
      case "deadline": return <FileText className="w-3 h-3" />
      default:         return <Bell className="w-3 h-3" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "holiday":  return "bg-green-500/20 text-green-400 border-green-500/30"
      case "exam":     return "bg-red-500/20 text-red-400 border-red-500/30"
      case "deadline": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:         return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    }
  }

  const getDayOrderColor = (do_: number) => {
    const colors = [
      "bg-purple-500/20 text-purple-400 border-purple-500/40",
      "bg-blue-500/20 text-blue-400 border-blue-500/40",
      "bg-orange-500/20 text-orange-400 border-orange-500/40",
      "bg-pink-500/20 text-pink-400 border-pink-500/40",
      "bg-teal-500/20 text-teal-400 border-teal-500/40",
    ]
    return colors[(do_ - 1) % 5]
  }

  const filteredEvents = calendar
    .filter((e) => filter === "all" || e.type === filter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const isToday = (day: number) => {
    const t = new Date()
    return day === t.getDate() && currentMonth === t.getMonth() && currentYear === t.getFullYear()
  }

  const isWeekend = (day: number) => {
    const d = new Date(currentYear, currentMonth, day).getDay()
    return d === 0 || d === 6
  }

  // Events for selected day popup
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []
  const selectedDayOrder  = selectedDay ? dateToDayOrder[getDateStr(selectedDay)] : undefined

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <CalendarDays className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 neon-text">Connect to View Calendar</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Login with your SRM Academia credentials to view the academic calendar with holidays and day orders.
            </p>
            <Button size="lg" onClick={() => setIsLoginOpen(true)} className="bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90 animate-glow">
              <LogIn className="w-5 h-5 mr-2" />Connect to SRM Academia
            </Button>
          </motion.div>
        </div>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 neon-text">Academic Calendar</h1>
              <p className="text-sm text-muted-foreground">{calendar.length} events synced</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as "calendar"|"list")}>
                <SelectTrigger className="w-28 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={refreshData} disabled={isLoading} className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent">
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-3 mb-4">
          {/* Day order legend */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/30">
            <Hash className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-muted-foreground">Day Order</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(do_ => (
                <span key={do_} className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${getDayOrderColor(do_)}`}>
                  {do_}
                </span>
              ))}
            </div>
          </div>
          {/* Event type legend */}
          {[{type:"holiday",label:"Holiday"},{type:"exam",label:"Exam"},{type:"event",label:"Event"},{type:"deadline",label:"Deadline"}].map(({type,label}) => (
            <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/30">
              <span className={`w-2.5 h-2.5 rounded-full ${getEventColor(type).split(" ")[0]}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {["all","holiday","exam","event","deadline"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f as typeof filter)}
              className={filter === f ? "bg-primary text-background" : "border-border bg-transparent hover:bg-secondary"}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </motion.div>

        {viewMode === "calendar" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-xl neon-border glass p-3 sm:p-6">
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => { setCurrentDate(new Date(currentYear, currentMonth-1, 1)); setSelectedDay(null) }}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-lg sm:text-2xl font-bold">{MONTHS[currentMonth]} {currentYear}</h2>
                <Button variant="ghost" size="icon" onClick={() => { setCurrentDate(new Date(currentYear, currentMonth+1, 1)); setSelectedDay(null) }}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} />

                  const dateStr  = getDateStr(day)
                  const dayOrder = dateToDayOrder[dateStr]
                  const events   = getEventsForDay(day).filter(e => filter === "all" || e.type === filter)
                  const weekend  = isWeekend(day)
                  const today    = isToday(day)
                  const isSelected = selectedDay === day

                  return (
                    <motion.div
                      key={day}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`
                        relative min-h-[64px] sm:min-h-[84px] p-1 sm:p-2 rounded-lg border cursor-pointer transition-all
                        ${today ? "bg-primary/15 border-primary/60" : weekend ? "bg-secondary/20 border-border/20" : "border-border/30 hover:border-primary/40"}
                        ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                        ${events.length > 0 ? "bg-green-500/5" : ""}
                      `}
                    >
                      {/* Date number */}
                      <div className="flex items-start justify-between gap-0.5">
                        <span className={`text-xs sm:text-sm font-bold leading-none ${today ? "text-primary" : weekend ? "text-muted-foreground/50" : "text-foreground"}`}>
                          {day}
                        </span>
                        {/* Day order badge */}
                        {dayOrder && !weekend && (
                          <span className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded border font-bold leading-none ${getDayOrderColor(dayOrder)}`}>
                            {dayOrder}
                          </span>
                        )}
                      </div>

                      {/* Events */}
                      <div className="mt-1 space-y-0.5">
                        {events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`flex items-center gap-0.5 px-1 py-0.5 rounded border text-[8px] sm:text-[10px] truncate ${getEventColor(event.type)}`}
                            title={event.title}
                          >
                            {getEventIcon(event.type)}
                            <span className="truncate hidden sm:block">{event.title.replace(" - Holiday","").replace(" - holiday","")}</span>
                          </div>
                        ))}
                        {/* Mobile: just show colored dot if there are events */}
                        {events.length > 0 && (
                          <div className="flex gap-0.5 sm:hidden mt-0.5">
                            {events.slice(0, 3).map((e, i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e.type).split(" ")[0]}`} />
                            ))}
                          </div>
                        )}
                        {events.length > 2 && (
                          <span className="text-[8px] text-muted-foreground hidden sm:block">+{events.length - 2} more</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Selected day detail panel */}
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl neon-border glass"
              >
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-lg">
                    {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("en-IN", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </h3>
                  {selectedDayOrder && (
                    <span className={`px-2 py-1 rounded-lg border text-sm font-bold flex items-center gap-1 ${getDayOrderColor(selectedDayOrder)}`}>
                      <Hash className="w-3 h-3" />Day Order {selectedDayOrder}
                    </span>
                  )}
                  {isWeekend(selectedDay) && (
                    <span className="px-2 py-1 rounded-lg border text-sm text-muted-foreground border-border/30">Weekend</span>
                  )}
                </div>

                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isWeekend(selectedDay) ? "No classes — enjoy your weekend!" : selectedDayOrder ? `Day Order ${selectedDayOrder} — regular class day` : "No events scheduled"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event) => (
                      <div key={event.id} className={`flex items-start gap-3 p-3 rounded-lg border ${getEventColor(event.type)}`}>
                        <div className="mt-0.5">{getEventIcon(event.type)}</div>
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs opacity-70 capitalize">{event.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

        ) : (
          /* List View */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No events found</div>
            ) : filteredEvents.map((event, index) => {
              const dayOrder = dateToDayOrder[event.date]
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * index }}
                  className="p-4 rounded-xl neon-border glass flex items-start gap-4"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">{event.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                    {dayOrder && (
                      <span className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded border font-medium ${getDayOrderColor(dayOrder)}`}>
                        <Hash className="w-2.5 h-2.5" />Day Order {dayOrder}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${getEventColor(event.type)}`}>
                    {event.type}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
