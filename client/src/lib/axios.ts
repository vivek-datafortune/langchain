import axios from 'axios'
import { useAuthStore } from './stores/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
})

axiosClient.interceptors.request.use((config) => {
  const match = document.cookie.match(/(?:^|; )medivoice_token=([^;]*)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    // Don't auto-logout on the login endpoint itself — a 401 there just means
    // the phone number wasn't found; it's not an expired session.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      console.warn('[axios] 401 on protected route → logging out')
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

export default axiosClient
