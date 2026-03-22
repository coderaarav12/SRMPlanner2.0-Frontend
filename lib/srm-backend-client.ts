// Proper SRM Backend Client
// This connects to a user-deployed backend (like GoScraper) via environment variables

interface BackendConfig {
  baseURL: string
}

interface LoginResponse {
  success: boolean
  token?: string
  accessToken?: string
  message?: string
  error?: string
}

interface DataResponse {
  data?: any
  success: boolean
  error?: string
}

export class SRMBackendClient {
  private baseURL: string

  constructor(config: BackendConfig) {
    this.baseURL = config.baseURL
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/login`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Authentication failed with status ${response.status}`,
        }
      }

      return {
        success: true,
        token: data.token || data.accessToken,
        message: "Successfully authenticated",
      }
    } catch (error) {
      return {
        success: false,
        error: `Backend connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  async getTimetable(token: string): Promise<DataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/timetable`, {
        method: "GET",
        headers: {
          ...this.getHeaders(),
          "x-access-token": token,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch timetable: ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.timetable || data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getAttendance(token: string): Promise<DataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/attendance`, {
        method: "GET",
        headers: {
          ...this.getHeaders(),
          "x-access-token": token,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch attendance: ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.attendance || data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getMarks(token: string): Promise<DataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/marks`, {
        method: "GET",
        headers: {
          ...this.getHeaders(),
          "x-access-token": token,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch marks: ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.marks || data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getCourses(token: string): Promise<DataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses`, {
        method: "GET",
        headers: {
          ...this.getHeaders(),
          "x-access-token": token,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch courses: ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.courses || data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export function getBackendClient(): SRMBackendClient | null {
  const backendURL = process.env.NEXT_PUBLIC_SRM_BACKEND_URL

  if (!backendURL) {
    console.warn("[v0] NEXT_PUBLIC_SRM_BACKEND_URL not configured. Backend integration disabled.")
    return null
  }

  return new SRMBackendClient({
    baseURL: backendURL,
  })
}
