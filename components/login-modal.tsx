"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, Lock, Mail, X, AlertCircle, ExternalLink, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginToSRM } from "@/lib/srm-api"
import { useAuth } from "@/lib/auth-context"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [cdigest, setCdigest] = useState<string | null>(null)
  const [showCaptchaStep, setShowCaptchaStep] = useState(false)
  const { login } = useAuth()

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_SRM_BACKEND_URL
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    // Normalize email: if user enters just the first part, append @srmist.edu.in
    let normalizedEmail = email.trim()
    if (!normalizedEmail.includes("@")) {
      normalizedEmail = `${normalizedEmail}@srmist.edu.in`
    } else if (!normalizedEmail.endsWith("@srmist.edu.in")) {
      // If they entered a different domain, warn them
      setError("Please use your SRM email address (@srmist.edu.in)")
      return
    }

    setIsLoading(true)

    try {
      const result = await loginToSRM(normalizedEmail, password)

      if (result.requiresCaptcha && result.captchaImage && result.cdigest) {
        setCaptchaImage(result.captchaImage)
        setCdigest(result.cdigest)
        setShowCaptchaStep(true)
        setIsLoading(false)
        return
      }

      if (result.success && result.token) {
        await login(result.token)
        onClose()
      } else {
        setError(result.error || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      console.error("[v0] Login error caught:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!captchaAnswer) {
      setError("Please enter the CAPTCHA")
      return
    }

    setIsLoading(true)

    try {
      // Normalize email for CAPTCHA submission too
      let normalizedEmail = email.trim()
      if (!normalizedEmail.includes("@")) {
        normalizedEmail = `${normalizedEmail}@srmist.edu.in`
      }

      const result = await loginToSRM(normalizedEmail, password, captchaAnswer, cdigest || "")

      if (result.success && result.token) {
        await login(result.token)
        onClose()
      } else {
        setError(result.error || "CAPTCHA verification failed. Please try again.")
        setCaptchaAnswer("")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="relative w-full max-w-md p-6 rounded-2xl neon-border glass max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow">
                <Lock className="w-8 h-8 text-background" />
              </div>
              <h2 className="text-2xl font-bold neon-text">{showCaptchaStep ? "Verify Human" : "Connect to SRM"}</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {showCaptchaStep
                  ? "SRM Academia requires CAPTCHA verification"
                  : "Login with your SRM Academia credentials"}
              </p>
            </div>

            {!showCaptchaStep ? (
              <>
                <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Secure Connection</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This app connects to SRM Academia via secure API to fetch your actual timetable, attendance, and
                    marks.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">SRM Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="text"
                        placeholder="ag0892 or ag0892@srmist.edu.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-secondary border-border"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your email ID (e.g., ag0892) or full email address
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="password">Academia Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your Academia password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-secondary border-border"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting to SRM...
                      </>
                    ) : (
                      "Login & Sync Real Data"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    SRM Academia requires you to solve a CAPTCHA to proceed. This is a security measure from their
                    server.
                  </p>
                </div>

                {captchaImage && (
                  <div className="mb-4">
                    <Label className="block text-sm font-medium mb-2">Solve the CAPTCHA</Label>
                    <div className="relative w-full bg-white p-2 rounded-lg border border-border">
                      <img
                        src={captchaImage.startsWith("data:") ? captchaImage : `data:image/png;base64,${captchaImage}`}
                        alt="CAPTCHA"
                        className="w-full h-24 object-contain"
                        onError={() => console.log("[v0] CAPTCHA image failed to load")}
                        onLoad={() => console.log("[v0] CAPTCHA image loaded successfully")}
                      />
                    </div>
                    {!captchaImage.startsWith("data:") && (
                      <p className="text-xs text-muted-foreground mt-1">Base64 image length: {captchaImage.length}</p>
                    )}
                  </div>
                )}

                <form onSubmit={handleCaptchaSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="captcha">Enter the CAPTCHA text</Label>
                    <Input
                      id="captcha"
                      type="text"
                      placeholder="Type the characters shown above"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="bg-secondary border-border mt-1"
                      autoFocus
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCaptchaStep(false)
                        setCaptchaImage(null)
                        setCdigest(null)
                        setCaptchaAnswer("")
                        setError("")
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-primary to-cyan-400 text-background hover:opacity-90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Login"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Your credentials are used only to authenticate with SRM servers. We never store your password.
              </p>
              <div className="flex justify-center mt-3">
                <a
                  href="https://academia.srmist.edu.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  SRM Portal
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
