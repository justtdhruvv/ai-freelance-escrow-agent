'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "../components/LoginForm"

export default function LoginPage(){

  const router = useRouter()

  useEffect(()=>{

    const token = localStorage.getItem("authToken")

    if(token){
      router.push("/dashboard")
    }

  },[])

  return(

    <div className="flex justify-center items-center h-screen">

      <div className="w-[400px]">

        <h1 className="text-2xl mb-6 font-bold">
          Login
        </h1>

        <LoginForm/>

      </div>

    </div>
  )
}