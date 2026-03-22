"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { RefreshCw, BookOpen, LogIn, User, Clock, Award, GraduationCap, Beaker, BookText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CoursesSection() {
  const { isAuthenticated, courses, isLoading, refreshData, user } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "Theory" | "Lab">("all")

  useEffect(() => {
    console.log("[v0] Courses data:", courses)
    console.log("[v0] Is Authenticated:", isAuthenticated)
  }, [courses, isAuthenticated])

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0)
  const theoryCount = courses.filter((c) => c.type === "Theory").length
  const labCount = courses.filter((c) => c.type === "Lab" || c.type === "Practical").length

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.faculty.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      typeFilter === "all" || course.type === typeFilter || (typeFilter === "Lab" && course.type === "Practical")

    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "theory":
        return <BookText className="w-4 h-4" />
      case "lab":
      case "practical":
        return <Beaker className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "theory":
        return "bg-primary/20 text-primary border-primary/30"
      case "lab":
      case "practical":
        return "bg-accent/20 text-accent border-accent/30"
      default:
        return "bg-neon-purple/20 text-neon-purple border-neon-purple/30"
    }
  }

  const getTypeBgColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "theory":
        return "from-primary/10 to-cyan-500/10 border-primary/20"
      case "lab":
      case "practical":
        return "from-accent/10 to-pink-500/10 border-accent/20"
      default:
        return "from-purple-500/10 to-violet-500/10 border-purple-500/20"
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 neon-text">Connect to View Courses</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Login with your SRM Academia credentials to see your registered courses, credits, and faculty details.
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
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
      <div className="w-full max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 neon-text">My Courses</h1>
              <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                  {user?.semester}
                </span>
                <span className="hidden sm:block">|</span>
                <span>{user?.department}</span>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="p-3 sm:p-5 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Courses</p>
                <p className="text-xl sm:text-3xl font-bold text-primary neon-text">{courses.length}</p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-5 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Credits</p>
                <p className="text-xl sm:text-3xl font-bold text-green-400">{totalCredits}</p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-5 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <BookText className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Theory</p>
                <p className="text-xl sm:text-3xl font-bold text-cyan-400">{theoryCount}</p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-5 rounded-xl neon-border glass">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Beaker className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Labs</p>
                <p className="text-xl sm:text-3xl font-bold text-accent">{labCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3 mb-6 w-full"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "Theory" | "Lab")}>
            <SelectTrigger className="w-full sm:w-auto bg-secondary border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Theory">Theory Only</SelectItem>
              <SelectItem value="Lab">Labs Only</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              whileHover={{ y: -2, scale: 1.01 }}
              className={`p-4 sm:p-5 rounded-xl bg-gradient-to-br ${getTypeBgColor(course.type)} border neon-border glass`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded inline-block mb-2">
                    {course.code}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">{course.name}</h3>
                </div>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 flex-shrink-0 ${getTypeColor(course.type)}`}
                >
                  {getTypeIcon(course.type)}
                  <span className="hidden sm:inline">{course.type}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Cr</p>
                    <p className="text-sm sm:font-semibold text-foreground">{course.credits}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Slot</p>
                    <p className="text-sm sm:font-semibold text-foreground">{course.slot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 col-span-3 sm:col-span-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Faculty</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {course.faculty.replace(/\s*\(\d+\)\s*$/, "").trim()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 w-full">
            <p className="text-muted-foreground text-sm">No courses matching filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
