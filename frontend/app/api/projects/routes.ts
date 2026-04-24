import { NextResponse } from "next/server"

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export async function GET() {

  const res = await fetch(`${BACKEND}/projects`)

  const data = await res.json()

  return NextResponse.json(data)

}

export async function POST(req: Request) {

  const body = await req.json()

  const res = await fetch(`${BACKEND}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}