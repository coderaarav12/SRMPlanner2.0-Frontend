"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User, GraduationCap, Hash, Calendar, RefreshCw,
  LogIn, ExternalLink, Award, Building, Layers, Clock,
  BookOpen, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"

export function AboutSection() {
  const auth = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const isAuthenticated = auth.isAuthenticated
  const user            = auth.user
  const attendance      = auth.attendance  || []
  const marks           = auth.marks       || []
  const courses         = auth.courses     || []
  const timetable       = auth.timetable   || []
  const isLoading       = auth.isLoading
  const refreshData     = auth.refreshData
  const logout          = auth.logout

  // Today's day order
  const todayStr  = new Date().toISOString().split("T")[0]
  const todaySlot = (timetable as any[]).find((s) => s.date === todayStr)
  const todayDO   = todaySlot?.day_order ?? null

  // Stats
  const totalCredits  = (courses as any[]).reduce((s, c) => s + (c.credits || 0), 0)
  const avgAttendance = attendance.length > 0
    ? Math.round((attendance as any[]).reduce((s, a) => s + (a.percentage || 0), 0) / attendance.length)
    : 0
  const atRisk        = (attendance as any[]).filter((a) => a.percentage < 75).length
  const totalScored   = (marks as any[]).reduce((s, m) => s + (m.total || 0), 0)
  const totalMax      = (marks as any[]).reduce((s, m) => s + (m.maxTotal || 0), 0)
  const marksPercent  = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4 neon-text">Your Profile</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Login to view your student profile and academic summary.
          </p>
          <Button size="lg" onClick={() => setIsLoginOpen(true)}
            className="bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90">
            <LogIn className="w-5 h-5 mr-2" />Connect to SRM Academia
          </Button>
        </motion.div>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    )
  }

  const stats = [
    { label: "Avg Attendance", value: `${avgAttendance}%`, color: avgAttendance >= 75 ? "text-green-400" : "text-red-400" },
    { label: "At Risk",        value: atRisk,               color: atRisk > 0 ? "text-yellow-400" : "text-green-400"       },
    { label: "Total Credits",  value: totalCredits,         color: "text-cyan-400"                                          },
    { label: "Marks Score",    value: `${marksPercent}%`,   color: marksPercent >= 60 ? "text-green-400" : "text-yellow-400"},
  ]

  const infoItems = [
    { icon: User,          label: "Full Name",         value: user?.name           },
    { icon: Hash,          label: "Register Number",   value: user?.username       },
    { icon: GraduationCap, label: "Program",           value: user?.program        },
    { icon: Building,      label: "Department",        value: user?.department     },
    { icon: Layers,        label: "Specialization",    value: user?.specialization },
    { icon: Calendar,      label: "Semester",          value: user?.semester ? `Semester ${user.semester}` : "—" },
    { icon: User,          label: "Batch",             value: user?.batch    ? `Batch ${user.batch}`    : "—" },
    { icon: Clock,         label: "Today's Day Order", value: todayDO        ? `Day Order ${todayDO}`  : "Weekend / Holiday" },
  ]

  return (
    <div className="min-h-screen pt-20 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-1 neon-text">My Profile</h1>
              <p className="text-sm text-muted-foreground">Academic overview & student details</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshData} disabled={isLoading}
                className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />Refresh
              </Button>
              <Button variant="outline" asChild className="border-border bg-transparent">
                <a href="https://academia.srmist.edu.in/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />Portal
                </a>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl neon-border glass mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 animate-glow">
            <span className="text-3xl font-bold text-background">{user?.name?.charAt(0) || "?"}</span>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold neon-text">{user?.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{user?.username}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">{user?.program}</span>
              <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                Sem {user?.semester} • Batch {user?.batch}
              </span>
              {todayDO && (
                <span className="text-xs bg-cyan-400/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-400/20 flex items-center gap-1">
                  <Hash className="w-3 h-3" />Day Order {todayDO} Today
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl neon-border glass text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Info list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl neon-border glass overflow-hidden mb-6">
          <div className="p-4 border-b border-border/30 bg-secondary/30">
            <h3 className="font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />Student Information
            </h3>
          </div>
          <div className="divide-y divide-border/20">
            {infoItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value || "—"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button onClick={logout} variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent">
            <LogIn className="w-4 h-4 mr-2 rotate-180" />
            Logout from SRM Academia
          </Button>
        </motion.div>

      </div>
    </div>
  )
}

export { AboutSection as profile }
