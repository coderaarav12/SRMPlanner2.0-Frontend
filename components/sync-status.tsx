"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Loader2, RefreshCw, Clock, ChevronUp, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SyncStatus() {
  const { isAuthenticated, isLoading, dataStatus, lastSyncTime, refreshData } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExpanded, setIsExpanded]     = useState(false)

  if (!isAuthenticated) return null

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setIsRefreshing(false)
  }

  const statusItems = [
    { key: "attendance", label: "Attendance" },
    { key: "timetable",  label: "Timetable"  },
    { key: "courses",    label: "Courses"     },
    { key: "marks",      label: "Marks"       },
  ]

  const getStatusIcon = (status: "loading" | "success" | "error") => {
    if (status === "loading") return <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
    if (status === "success") return <CheckCircle className="w-3 h-3 text-green-400" />
    return <XCircle className="w-3 h-3 text-red-400" />
  }

  const successCount = Object.values(dataStatus).filter((s) => s === "success").length
  const totalCount   = Object.keys(dataStatus).length
  const allGood      = successCount === totalCount && !isLoading && !isRefreshing

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        {/* Collapsed pill — always visible, minimal footprint */}
        <div className="glass rounded-full neon-border overflow-hidden">
          <div className="flex items-center">
            {/* Status indicator + label */}
            <button
              onClick={() => setIsExpanded((p) => !p)}
              className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
            >
              {isLoading || isRefreshing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : allGood ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-yellow-400" />
              )}
              <span className="font-medium text-muted-foreground">
                {isLoading || isRefreshing ? "Syncing..." : `${successCount}/${totalCount}`}
              </span>
              {isExpanded
                ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                : <ChevronUp className="w-3 h-3 text-muted-foreground" />
              }
            </button>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="px-2 py-2 border-l border-border/40 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Expanded detail — slides open */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-1 border-t border-border/30">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                    {statusItems.map((item) => (
                      <div key={item.key} className="flex items-center gap-1.5 text-muted-foreground">
                        {getStatusIcon(dataStatus[item.key as keyof typeof dataStatus])}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  {lastSyncTime && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(lastSyncTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
