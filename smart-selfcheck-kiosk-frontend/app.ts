
import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

export async function postDataLogin(cardnumber: string | undefined) {
  if (cardnumber) {
    const res = await api.post('/api/v1/auth/login', { cardnumber: cardnumber })
    return res.data
  }
}












