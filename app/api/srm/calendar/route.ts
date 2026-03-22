import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_SRM_BACKEND_URL || process.env.SRM_BACKEND_URL

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-access-token")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!BACKEND_URL) return NextResponse.json({ error: "Backend not configured" }, { status: 503 })

  try {
    const response = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/calendar`, {
      method: "GET",
      headers: { Accept: "application/json", "x-access-token": token },
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json(data, { status: response.status })
    // Return full response — srm-api.ts reads data.academic_planner.holidays
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 })
  }
}
