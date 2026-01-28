
import axios from "axios"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

export const api = axios.create({
  baseURL: API_BASE
})

export async function postDataLogin(cardnumber: string, password: string) {
  const res = await api.post('/api/v1/auth/login', { 
    cardnumber: cardnumber,
    password: password 
  });
  return res.data;
}











