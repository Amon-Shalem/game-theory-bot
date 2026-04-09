import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BlueprintListPage } from './components/pages/BlueprintListPage'
import { CanvasPage } from './components/pages/CanvasPage'
import { SettingsPage } from './components/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlueprintListPage />} />
        <Route path="/canvas/:blueprintId" element={<CanvasPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
