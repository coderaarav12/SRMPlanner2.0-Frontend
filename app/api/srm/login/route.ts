export const runtime = 'edge'

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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    let loginResponse: Response
    try {
      loginResponse = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password, captcha, cdigest }),
        signal: controller.signal,
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
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid response from backend" }, { status: 500 })
    }

    if (data.captcha) {
      return NextResponse.json({ success: false, captcha: data.captcha }, { status: 401 })
    }

    if (!loginResponse.ok || !data.authenticated) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || "Authentication failed" },
        { status: 401 },
      )
    }

    const token: string = data.token
    if (!token || token.trim() === "") {
      return NextResponse.json({ success: false, error: "Backend returned no token." }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      token,
      message: "Connected to SRM Academia",
      isAuthenticated: true,
    })

    response.cookies.set({
      name: "srm-token",
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 500 },
    )
  }
}