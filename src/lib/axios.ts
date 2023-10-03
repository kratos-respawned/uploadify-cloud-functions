import axios from "axios";
// "VERCEL_URL":"https://uploadify.itsgaurav.co"
export const instance=axios.create(
    {
        baseURL:process.env.VERCEL_URL||"http://localhost:3000",
        headers:{
            Authorization:process.env.ADMIN_SECRET
        }
    }
)