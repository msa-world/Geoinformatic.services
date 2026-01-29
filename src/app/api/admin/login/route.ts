import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[MSA] Admin login API called")

    // Check content type
    const contentType = request.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.log("[MSA] Invalid content type:", contentType)
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("[MSA] Request body parsed successfully")
    } catch (error) {
      console.error("[MSA] JSON parse error:", error)
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { username, password } = body

    if (!username || !password) {
      console.log("[MSA] Missing username or password")
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const ADMIN_USERNAME = "admin"
    const ADMIN_PASSWORD = "Geo@1122"

    console.log("[MSA] Checking credentials for username:", username)

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create a simple token
      // Return the static admin secret token that other APIs expect
      const token = process.env.ADMIN_SECRET_TOKEN || 'admin-secret-123'

      console.log("[MSA] Admin login successful")

      return NextResponse.json(
        {
          success: true,
          message: "Login successful",
          token: token,
          username: username,
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } else {
      console.log("[MSA] Invalid credentials provided")
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("[MSA] Unexpected error in admin login:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
