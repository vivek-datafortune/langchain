import { Toast } from '@heroui/react'
import { AppRoutes } from './routes'

// Hot reload test - updated
export default function App() {
  return (
    <>
      <Toast.Provider placement="top end" />
      <AppRoutes />
    </>
  )
}
