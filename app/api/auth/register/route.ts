const backendBaseUrl =
  process.env.BACKEND_BASE_URL ?? 'http://backend:8000/api/v1'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, email, password, user_type } = body

    if (!email || !password || !full_name) {
      return Response.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 },
      )
    }

    const response = await fetch(`${backendBaseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name,
        email,
        password,
        user_type: user_type ?? 'student',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return Response.json(
        { error: data.message ?? data.error ?? 'Registration failed.' },
        { status: response.status },
      )
    }

    return Response.json(data)
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
