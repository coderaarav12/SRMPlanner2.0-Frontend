"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, LogIn, Megaphone, ChevronDown, ExternalLink, Filter, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CircularsSection() {
  const { isAuthenticated, circulars, isLoading, refreshData } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  const categories = ["all", ...Array.from(new Set(circulars.map((c) => c.category)))]

  const filteredCirculars = circulars.filter((c) => filter === "all" || c.category === filter)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Examination: "bg-red-500/20 text-red-400 border-red-500/30",
      Event: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      General: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      Placement: "bg-green-500/20 text-green-400 border-green-500/30",
      Finance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Workshop: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Hostel: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    }
    return colors[category] || "bg-primary/20 text-primary border-primary/30"
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Megaphone className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 neon-text">Connect to View Circulars</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Login with your SRM Academia credentials to view all announcements and circulars.
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
      <div className="w-full max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 neon-text">Circulars</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {circulars.filter((c) => c.isNew).length} new announcements
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 w-full">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {filteredCirculars.length} circular{filteredCirculars.length !== 1 ? "s" : ""}
          </span>
        </motion.div>

        <div className="space-y-2 sm:space-y-3 w-full">
          {filteredCirculars.map((circular, index) => (
            <motion.div
              key={circular.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * index }}
              className="rounded-lg sm:rounded-xl neon-border glass overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === circular.id ? null : circular.id)}
                className="w-full p-3 sm:p-4 flex items-start gap-3 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs sm:text-sm leading-tight pr-2">
                      {circular.isNew && <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 inline mr-1.5" />}
                      {circular.title}
                    </h3>
                    <ChevronDown
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-muted-foreground transition-transform mt-0.5 ${
                        expandedId === circular.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(circular.category)}`}>
                      {circular.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(circular.date)}</span>
                    </span>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedId === circular.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-border/30">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{circular.content}</p>
                      {circular.attachmentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 sm:mt-4 border-primary/50 text-primary hover:bg-primary/10 bg-transparent text-xs sm:text-sm"
                          asChild
                        >
                          <a href={circular.attachmentUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            View Attachment
                          </a>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {filteredCirculars.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 w-full">
            <p className="text-muted-foreground text-sm">No circulars found.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
