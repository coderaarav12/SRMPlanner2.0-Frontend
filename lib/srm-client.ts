const VCADEMIA_API = "https://vcademia.api.vishok.tech"

interface LoginCredentials {
  username: string
  password: string
}

interface SRMSession {
  username: string
  accessToken: string
}

export class SRMApiClient {
  private session: SRMSession | null = null

  async login(credentials: LoginCredentials): Promise<SRMSession> {
    try {
      console.log("[v0] Starting authentication with username:", credentials.username)

      // Try making request from browser context to bypass server IP restrictions
      const authString = btoa(`${credentials.username}:${credentials.password}`)

      const keyResponse = await fetch(`${VCADEMIA_API}/key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authString}`,
        },
        body: `user=${encodeURIComponent(credentials.username)}&pass=${encodeURIComponent(credentials.password)}`,
        mode: "cors",
        credentials: "omit",
      })

      const responseText = await keyResponse.text()
      console.log("[v0] vcademia response status:", keyResponse.status)
      console.log("[v0] vcademia response body:", responseText.substring(0, 100))

      // Check if response contains error message even with 200 status
      if (responseText.includes("only public URLs") || responseText.includes("Invalid request")) {
        throw new Error("VCademia API is blocking this request. Try again in a moment or use demo data.")
      }

      if (!keyResponse.ok && keyResponse.status !== 200) {
        throw new Error(`Authentication failed with status ${keyResponse.status}`)
      }

      let keyData: any
      try {
        keyData = JSON.parse(responseText)
      } catch {
        // If not JSON, try to extract token from response text
        const tokenMatch = responseText.match(/["']?(?:token|accessToken|key)["']?\s*[:=]\s*["']?([^"'\s,}]+)/)
        if (tokenMatch && tokenMatch[1]) {
          keyData = { accessToken: tokenMatch[1] }
        } else {
          throw new Error(`Invalid response format: ${responseText}`)
        }
      }

      if (!keyData.accessToken && !keyData.token && !keyData.key) {
        throw new Error("No access token in response")
      }

      const token = keyData.accessToken || keyData.token || keyData.key

      this.session = {
        username: credentials.username,
        accessToken: token,
      }

      console.log("[v0] Authentication successful")
      return this.session
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("[v0] Login error:", errorMsg)
      throw error
    }
  }

  async getTimetable(): Promise<any> {
    if (!this.session) throw new Error("Not authenticated")

    const response = await fetch(`${VCADEMIA_API}/timetable`, {
      method: "GET",
      headers: {
        "x-access-token": this.session.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch timetable: ${response.status}`)
    }

    return await response.json()
  }

  async getAttendance(): Promise<any> {
    if (!this.session) throw new Error("Not authenticated")

    const response = await fetch(`${VCADEMIA_API}/attendance`, {
      method: "GET",
      headers: {
        "x-access-token": this.session.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance: ${response.status}`)
    }

    return await response.json()
  }

  async getMarks(): Promise<any> {
    if (!this.session) throw new Error("Not authenticated")

    const response = await fetch(`${VCADEMIA_API}/marks`, {
      method: "GET",
      headers: {
        "x-access-token": this.session.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch marks: ${response.status}`)
    }

    return await response.json()
  }

  async getCourses(): Promise<any> {
    if (!this.session) throw new Error("Not authenticated")

    const response = await fetch(`${VCADEMIA_API}/courses`, {
      method: "GET",
      headers: {
        "x-access-token": this.session.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status}`)
    }

    return await response.json()
  }

  async getStudent(): Promise<any> {
    if (!this.session) throw new Error("Not authenticated")

    const response = await fetch(`${VCADEMIA_API}/student`, {
      method: "GET",
      headers: {
        "x-access-token": this.session.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch student info: ${response.status}`)
    }

    return await response.json()
  }
}

export const srmClient = new SRMApiClient()
