"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { RefreshCw, LogIn, Award, BookOpen, Trophy, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"

export function MarksSection() {
  const { isAuthenticated, marks, isLoading, refreshData, user } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "O":
      case "A+":
        return "text-green-400"
      case "A":
        return "text-emerald-400"
      case "B+":
        return "text-cyan-400"
      case "B":
        return "text-blue-400"
      case "C":
        return "text-yellow-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getPercentage = (total: number | null, max: number) => {
    if (total === null || max === 0) return 0
    return Math.round((total / max) * 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-gradient-to-r from-green-500 to-emerald-400"
    if (percentage >= 60) return "bg-gradient-to-r from-cyan-500 to-blue-400"
    if (percentage >= 40) return "bg-gradient-to-r from-yellow-500 to-amber-400"
    return "bg-gradient-to-r from-red-500 to-rose-400"
  }

  const totalMarks = marks.reduce((sum, m) => sum + (m.total || 0), 0)
  const maxMarks = marks.reduce((sum, m) => sum + (m.maxTotal || 0), 0)
  const overallPercentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0

  const excellentCount = marks.filter((m) => m.grade === "O" || m.grade === "A+" || m.grade === "A").length

  // Calculate avg score only from subjects that have marks
  const marksWithData = marks.filter((m) => m.total !== null && m.maxTotal > 0)
  const averageScore =
    marksWithData.length > 0
      ? Math.round(
          marksWithData.reduce((sum, m) => sum + getPercentage(m.total, m.maxTotal), 0) / marksWithData.length
        )
      : 0

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 neon-text">Connect to View Marks</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Login with your SRM Academia credentials to view your test scores, assignments, and grades.
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

  // Format a test score: "11/15" or "-" if null
  const fmtTest = (scored: number | null | undefined, max: number | undefined) => {
    if (scored === null || scored === undefined) return "-"
    if (!max) return `${scored}`
    return `${scored}/${max}`
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 neon-text">Marks & Grades</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {user?.section} | {user?.semester} | {marks.length} Subjects
              </p>
            </div>
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isLoading}
              className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="p-4 sm:p-6 rounded-xl neon-border glass col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm sm:text-lg font-semibold">Overall Score</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {totalMarks.toFixed(2)} / {maxMarks}
                </p>
              </div>
              <span
                className={`text-2xl sm:text-4xl font-bold ${overallPercentage >= 60 ? "text-green-400 neon-text" : "text-yellow-400"}`}
              >
                {overallPercentage}%
              </span>
            </div>
            <div className="relative h-3 sm:h-4 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercentage}%` }}
                transition={{ duration: 1 }}
                className={getProgressColor(overallPercentage)}
                style={{ height: "100%" }}
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Excellent</p>
                <p className="text-xl sm:text-3xl font-bold text-green-400">{excellentCount}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Score</p>
                <p className="text-xl sm:text-3xl font-bold text-cyan-400">{averageScore}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marks Table - Desktop */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="hidden lg:block rounded-xl neon-border glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/50">
                  <th className="text-left p-4 font-semibold">Subject</th>
                  {/* Collect all unique test names across all marks */}
                  {Array.from(new Set(marks.flatMap(m => m.tests.map(t => t.test)))).map(testName => (
                    <th key={testName} className="text-center p-4 font-semibold">{testName}</th>
                  ))}
                  <th className="text-center p-4 font-semibold">Total</th>
                  <th className="text-center p-4 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark, index) => {
                  const allTestNames = Array.from(new Set(marks.flatMap(m => m.tests.map(t => t.test))))
                  return (
                    <motion.tr
                      key={`${mark.code}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs font-mono text-primary">{mark.code}</p>
                            <p className="font-medium text-sm">{mark.name}</p>
                          </div>
                        </div>
                      </td>
                      {allTestNames.map(testName => {
                        const test = mark.tests.find(t => t.test === testName)
                        return (
                          <td key={testName} className="text-center p-4">
                            <span className={test ? "text-foreground" : "text-muted-foreground"}>
                              {test ? `${test.scored}/${test.max}` : "-"}
                            </span>
                          </td>
                        )
                      })}
                      <td className="text-center p-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold">
                            {mark.total !== null && mark.total !== undefined
                              ? `${mark.total}/${mark.maxTotal}`
                              : "-"}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(getPercentage(mark.total, mark.maxTotal))}`}
                              style={{ width: `${getPercentage(mark.total, mark.maxTotal)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <span className={`text-xl font-bold ${getGradeColor(mark.grade)}`}>
                          {mark.grade || "-"}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid gap-3">
            {marks.map((mark, index) => (
              <motion.div
                key={`${mark.code}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="p-4 rounded-xl neon-border glass"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <p className="text-xs font-mono text-primary">{mark.code}</p>
                    </div>
                    <h3 className="font-semibold text-sm mt-1">{mark.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${getGradeColor(mark.grade)}`}>
                      {mark.grade || "-"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {mark.total !== null && mark.total !== undefined
                        ? `${mark.total}/${mark.maxTotal}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="relative h-2 rounded-full bg-secondary overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getPercentage(mark.total, mark.maxTotal)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full ${getProgressColor(getPercentage(mark.total, mark.maxTotal))}`}
                  />
                </div>

                <div className={`grid gap-2 text-center text-xs`} style={{ gridTemplateColumns: `repeat(${Math.max(mark.tests.length, 1)}, 1fr)` }}>
                  {mark.tests.length === 0 ? (
                    <div className="p-2 rounded-lg bg-secondary/50 col-span-3">
                      <p className="text-muted-foreground">No tests yet</p>
                    </div>
                  ) : mark.tests.map(test => (
                    <div key={test.test} className="p-2 rounded-lg bg-secondary/50">
                      <p className="text-muted-foreground text-[10px]">{test.test}</p>
                      <p className="font-semibold">{test.scored}/{test.max}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
