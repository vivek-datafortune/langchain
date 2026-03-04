import { Routes, Route, Navigate } from 'react-router-dom'
import { MediVoiceShell } from '../layout/MediVoiceShell'
import { MediVoicePage } from '../pages/MediVoicePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MediVoiceShell />}>
        <Route index element={<MediVoicePage />} />
      </Route>
      <Route path="/medivoice" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
