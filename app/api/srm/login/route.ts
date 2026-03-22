// app/api/srm/login/route.ts
import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_SRM_BACKEND_URL || process.env.SRM_BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, error: "Backend not configured. Set SRM_BACKEND_URL environment variable." },
        { status: 503 },
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const { email, password, captcha, cdigest } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const username = email.includes("@")
      ? email.toLowerCase()
      : `${email.toLowerCase()}@srmist.edu.in`

    console.log("[v0] Authenticating via backend:", BACKEND_URL)
    console.log("[v0] Sending username:", username)

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 120000)

    let loginResponse: Response
    try {
      loginResponse = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        // Forward captcha fields to the Worker if present
        body:    JSON.stringify({ username, password, captcha, cdigest }),
        signal:  controller.signal,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { success: false, error: "Request timed out. SRM portal may be slow, please try again." },
          { status: 504 },
        )
      }
      return NextResponse.json(
        { success: false, error: `Failed to connect to backend: ${fetchError.message}` },
        { status: 503 },
      )
    }

    clearTimeout(timeoutId)

    let data: any
    try {
      const text = await loginResponse.text()
      console.log("[v0] Backend response status:", loginResponse.status)
      console.log("[v0] Backend response body:", text.substring(0, 500))
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid response from backend" }, { status: 500 })
    }

    // ── Captcha challenge: Worker returns { authenticated: false, captcha: { image, cdigest } }
    if (data.captcha) {
      return NextResponse.json({ success: false, captcha: data.captcha }, { status: 401 })
    }

    // ── Auth failure
    if (!loginResponse.ok || !data.authenticated) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || "Authentication failed" },
        { status: 401 },
      )
    }

    // ── Success: Worker returns { authenticated: true, token: "..." }
    const token: string = data.token
    if (!token || token.trim() === "") {
      console.log("[v0] No token in Worker response:", JSON.stringify(data))
      return NextResponse.json({ success: false, error: "Backend returned no token." }, { status: 401 })
    }

    console.log("[v0] Authentication successful")

    const response = NextResponse.json({
      success:         true,
      token,
      message:         "Connected to SRM Academia",
      isAuthenticated: true,
    })

    // Set as httpOnly cookie too (backup for SSR)
    response.cookies.set({
      name:     "srm-token",
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60,
      path:     "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 500 },
    )
  }
}
