"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Calendar, BarChart3, ExternalLink, LogIn, LogOut,
  User, RefreshCw, BookOpen, Award, CalendarDays,
  Menu, X, Hash, GraduationCap, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginModal } from "./login-modal"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TabType = "timetable" | "attendance" | "courses" | "marks" | "calendar" | "about"

interface NavbarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

function SRMLogo({ className = "w-8 h-8 sm:w-10 sm:h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#00FFFF", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#0088AA", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#1a1a2e", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#16213e", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#logoGrad2)" />
      <path d="M128 320 L128 192 Q128 160 160 160 L224 160 Q256 160 256 192 Q256 224 224 224 L176 224 L176 256 L224 256 Q256 256 256 288 L256 320 Q256 352 224 352 L160 352 Q128 352 128 320 Z" fill="url(#logoGrad1)" />
      <path d="M280 352 L280 160 L328 160 Q376 160 400 184 Q424 208 424 256 Q424 304 400 328 Q376 352 328 352 Z M328 304 Q352 304 364 292 Q376 280 376 256 Q376 232 364 220 Q352 208 328 208 L328 304 Z" fill="url(#logoGrad1)" />
      <circle cx="256" cy="420" r="24" fill="url(#logoGrad1)" />
    </svg>
  )
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [isLoginOpen, setIsLoginOpen]       = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, timetable, calendar, logout, refreshData, isLoading } = useAuth()

  // Get today's day order + holiday from timetable and calendar
  const todayStr    = new Date().toISOString().split("T")[0]
  const todaySlot   = timetable.find((s: any) => s.date === todayStr)
  const todayDO     = todaySlot?.day_order ?? null
  const todayHoliday = calendar.find((e: any) => e.date === todayStr)

  const navItems = [
    { id: "timetable"  as const, label: "Timetable",  icon: Calendar     },
    { id: "attendance" as const, label: "Attendance", icon: BarChart3    },
    { id: "marks"      as const, label: "Marks",      icon: Award        },
    { id: "courses"    as const, label: "Courses",    icon: BookOpen     },
    { id: "calendar"   as const, label: "Calendar",   icon: CalendarDays },
    { id: "about"      as const, label: "About",      icon: Info         },
  ]

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo + info */}
          <motion.div className="flex items-center gap-2 sm:gap-3" whileHover={{ scale: 1.02 }}>
            <div className="animate-glow rounded-xl overflow-hidden">
              <SRMLogo className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold neon-text">SRMPlanner</span>
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Specialization */}
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {user.specialization || user.section}
                  </span>
                  {/* Batch */}
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    B{user.batch}
                  </span>
                  {/* Today's Day Order or Holiday */}
                  {todayDO ? (
                    <span className="text-[10px] sm:text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-full">
                      <Hash className="w-2.5 h-2.5" />
                      DO {todayDO}
                    </span>
                  ) : todayHoliday ? (
                    <span className="text-[10px] sm:text-xs font-medium text-green-400 flex items-center gap-1 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                      🎉 {todayHoliday.title.replace(/ - Holiday$/i, "").trim().split(" ").slice(0, 2).join(" ")}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-muted-foreground/50 hidden sm:flex items-center gap-1">
                      <Hash className="w-2.5 h-2.5" />
                      No class
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">Academic Planner</p>
              )}
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${
                  activeTab === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 neon-border rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg neon-border bg-primary/10"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-background" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px]">
                      {user?.name?.split(" ")[0]}
                    </span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-border w-60">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{user?.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user?.username}</span>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Sem {user?.semester}
                        </span>
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          Batch {user?.batch}
                        </span>
                        {todayDO && (
                          <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Hash className="w-2 h-2" />DO {todayDO}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleTabClick("about")}>
                    <Info className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={refreshData} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh Data
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://academia.srmist.edu.in/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Portal
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90 animate-glow"
                >
                  <LogIn className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </motion.div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMobileMenuOpen ? "auto" : 0 }}
          className="lg:hidden overflow-hidden border-t border-border/50"
        >
          <div className="container mx-auto px-3 py-3 grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
