"use client"

import { motion } from "framer-motion"
import { Heart, ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="relative z-10 py-3 sm:py-4 px-3 sm:px-4 border-t border-border/30 glass mt-auto"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>Made with</span>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}>
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" />
          </motion.div>
          <span>by</span>
          <span className="font-semibold text-foreground neon-text">Aarav Goel</span>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <a
            href="https://academia.srmist.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>SRM Portal</span>
          </a>
          <span className="hidden sm:block text-border">|</span>
          <span className="text-xs text-muted-foreground">v1.0</span>
        </div>
      </div>
    </motion.footer>
  )
}
