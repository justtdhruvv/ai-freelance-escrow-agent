import { NextResponse } from "next/server"

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export async function PUT(req: Request,{params}:{params:{id:string}}){

 const body = await req.json()

 const res = await fetch(`${BACKEND}/projects/${params.id}`,{
  method:"PUT",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify(body)
 })

 const data = await res.json()

 return NextResponse.json(data,{status:res.status})
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const authHeader = req.headers.get('Authorization');

    const response = await fetch(`${backendUrl}/projects/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const authHeader = req.headers.get('Authorization');

    const response = await fetch(`${backendUrl}/projects/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}