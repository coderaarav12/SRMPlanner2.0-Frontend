"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { TimetableSection } from "@/components/timetable-section"
import { AttendanceSection } from "@/components/attendance-section"
import { CoursesSection } from "@/components/courses-section"
import { MarksSection } from "@/components/marks-section"
import { CalendarSection } from "@/components/calendar-section"
import { AboutSection } from "@/components/profile"
import { ParticleBackground } from "@/components/particle-background"
import { AuthProvider } from "@/lib/auth-context"
import { Footer } from "@/components/footer"
import { SyncStatus } from "@/components/sync-status"

type TabType = "timetable" | "attendance" | "courses" | "marks" | "calendar" | "about"

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>("timetable")

  const sections: { id: TabType; component: React.ReactNode }[] = [
    { id: "timetable",  component: <TimetableSection />  },
    { id: "attendance", component: <AttendanceSection /> },
    { id: "courses",    component: <CoursesSection />    },
    { id: "marks",      component: <MarksSection />      },
    { id: "calendar",   component: <CalendarSection />   },
    { id: "about",      component: <AboutSection />      },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />
      <div className="relative z-10 flex-1">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="w-full">
          <AnimatePresence mode="wait">
            {sections.map(({ id, component }) =>
              activeTab === id ? (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {component}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </main>
      </div>
      <Footer />
      <SyncStatus />
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
