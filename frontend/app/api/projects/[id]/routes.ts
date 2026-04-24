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