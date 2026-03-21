const API_BASE_URL = "http://localhost:3000/projects"

class ProjectService {

  getToken(){
    return localStorage.getItem("authToken")
  }

  async getProjects(){

    const res = await fetch(API_BASE_URL,{
      headers:{
        "Authorization":`Bearer ${this.getToken()}`
      }
    })

    if(!res.ok){
      throw new Error("Failed to fetch projects")
    }

    return await res.json()
  }

async createProject(data:any){

 const token = localStorage.getItem("authToken")
 const clientId = localStorage.getItem("userId")

 const res = await fetch(API_BASE_URL,{
  method:"POST",
  headers:{
   "Content-Type":"application/json",
   "Authorization":`Bearer ${token}`
  },
  body:JSON.stringify({
   client_id: clientId,
   title: data.title,
   description: data.description,
   total_price: data.budget,
   timeline_days: 14
  })
 })

 if(!res.ok){
  throw new Error("Failed to create project")
 }

 return await res.json()
}

  async updateProject(id:string,data:any){

    const res = await fetch(`${API_BASE_URL}/${id}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${this.getToken()}`
      },
      body:JSON.stringify(data)
    })

    if(!res.ok){
      throw new Error("Failed to update project")
    }

    return await res.json()
  }

}

export const projectService = new ProjectService()