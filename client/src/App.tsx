import { Toast } from '@heroui/react'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <>
      <Toast.Provider placement="top end" />
      <AppRoutes />
    </>
  )
}
