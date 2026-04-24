import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BlueprintListPage } from './components/pages/BlueprintListPage'
import { CanvasPage } from './components/pages/CanvasPage'
import { SettingsPage } from './components/pages/SettingsPage'
import { TheoryPage } from './components/pages/TheoryPage'
import { ReviewHistoryPage } from './components/pages/ReviewHistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlueprintListPage />} />
        <Route path="/canvas/:blueprintId" element={<CanvasPage />} />
        <Route path="/canvas/:blueprintId/review" element={<ReviewHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/theories" element={<TheoryPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
