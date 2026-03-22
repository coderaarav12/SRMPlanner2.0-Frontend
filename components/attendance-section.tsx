"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  LogIn,
  BarChart3,
  Filter,
  Calendar,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AttendanceSection() {
  const { isAuthenticated, attendance, isLoading, refreshData, user } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "safe" | "danger">("all")
  const [goalPercentage] = useState(75)

  useEffect(() => {
    console.log("[v0] Attendance data:", attendance)
    console.log("[v0] Is Authenticated:", isAuthenticated)
  }, [attendance, isAuthenticated])

  const getStatus = (percentage: number) => {
    if (percentage >= goalPercentage) return "safe"
    if (percentage >= goalPercentage - 10) return "warning"
    return "danger"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "danger":
        return "text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-gradient-to-r from-green-500 to-emerald-400"
      case "warning":
        return "bg-gradient-to-r from-yellow-500 to-amber-400"
      case "danger":
        return "bg-gradient-to-r from-red-500 to-rose-400"
      default:
        return "bg-muted"
    }
  }

  const classesNeeded = (attended: number, total: number, goal: number) => {
    if (total === 0) return 0
    const currentPercentage = (attended / total) * 100
    if (currentPercentage >= goal) return 0

    let needed = 0
    let newAttended = attended
    let newTotal = total

    while ((newAttended / newTotal) * 100 < goal) {
      newAttended++
      newTotal++
      needed++
      if (needed > 100) break
    }

    return needed
  }

  const canSkip = (attended: number, total: number, goal: number) => {
    if (total === 0) return 0
    let skippable = 0
    let newTotal = total

    while ((attended / (newTotal + 1)) * 100 >= goal) {
      newTotal++
      skippable++
      if (skippable > 50) break
    }

    return skippable
  }

  const filteredAttendance = attendance.filter((record) => {
    if (filter === "all") return true
    const status = getStatus(record.percentage)
    if (filter === "safe") return status === "safe"
    return status === "danger" || status === "warning"
  })

  const overallAttended = attendance.reduce((sum, r) => sum + r.attended, 0)
  const overallTotal = attendance.reduce((sum, r) => sum + r.total, 0)
  const overallPercentage = overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 0

  const safeCount = attendance.filter((r) => getStatus(r.percentage) === "safe").length
  const atRiskCount = attendance.filter((r) => getStatus(r.percentage) !== "safe").length

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 neon-text">Connect to Track Attendance</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Login with your SRM Academia credentials to automatically sync your attendance data with real-time
              insights.
            </p>
            <Button
              size="lg"
              onClick={() => setIsLoginOpen(true)}
              className="bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90 animate-glow"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Connect to SRM Academia
            </Button>
          </motion.div>
        </div>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-4 w-full">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 neon-text">Attendance Tracker</h1>
              <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {user?.section}
                </span>
                <span className="hidden sm:block">|</span>
                <span>{user?.semester}</span>
                <span className="hidden sm:block">|</span>
                <span>{attendance.length} Subjects</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isLoading}
              className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="p-4 sm:p-6 rounded-xl neon-border glass sm:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
              <div className="flex-1">
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold">Overall Attendance</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {overallAttended} / {overallTotal} classes
                </p>
              </div>
              <span
                className={`text-3xl sm:text-4xl font-bold ${
                  overallPercentage >= 75
                    ? "text-green-400 neon-text"
                    : overallPercentage >= 65
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {overallPercentage}%
              </span>
            </div>
            <div className="relative h-3 sm:h-4 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  overallPercentage >= 75
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : overallPercentage >= 65
                      ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                      : "bg-gradient-to-r from-red-500 to-rose-400"
                }`}
              />
              <div className="absolute top-0 h-full w-1 bg-white/50" style={{ left: "75%" }} />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between mt-2 text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
              <span>Goal: 75% minimum</span>
              <span className={overallPercentage >= 75 ? "text-green-400" : "text-yellow-400"}>
                {overallPercentage >= 75 ? "On Track" : "Needs Attention"}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Safe Subjects</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">{safeCount}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Above 75% attendance</p>
          </div>

          <div className="p-4 sm:p-6 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-400">{atRiskCount}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Below 75% attendance</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 w-full"
        >
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "safe" | "danger")}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="safe">Safe Only</SelectItem>
              <SelectItem value="danger">At Risk Only</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing {filteredAttendance.length} / {attendance.length}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
          {filteredAttendance.map((record, index) => {
            const status = getStatus(record.percentage)
            const needed = classesNeeded(record.attended, record.total, goalPercentage)
            const skippable = canSkip(record.attended, record.total, goalPercentage)

            return (
              <motion.div
                key={record.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ y: -2, scale: 1.01 }}
                className="p-4 sm:p-5 rounded-xl neon-border glass group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                      <p className="text-xs font-mono text-primary font-bold truncate">{record.code}</p>
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2">{record.name}</h3>
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground mt-1">
                      {record.category}
                    </span>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${getStatusColor(status)} flex-shrink-0`}>
                    {record.percentage}%
                  </div>
                </div>

                <div className="relative h-2 sm:h-3 rounded-full bg-secondary mb-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${record.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.1 + index * 0.03 }}
                    className={`h-full rounded-full ${getProgressColor(status)}`}
                  />
                  <div className="absolute top-0 h-full w-0.5 bg-white/30" style={{ left: "75%" }} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2 mb-3">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{record.attended}</strong> / {record.total}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3 flex-shrink-0" />
                    {goalPercentage}%
                  </span>
                </div>

                <div className="p-2 sm:p-3 rounded-lg bg-secondary/50 border border-border/50">
                  {status === "safe" ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs sm:text-sm">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>
                        Skip <strong>{skippable}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400 text-xs sm:text-sm">
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>
                        Attend <strong>{needed}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredAttendance.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 w-full">
            <p className="text-muted-foreground text-sm">No subjects matching filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
