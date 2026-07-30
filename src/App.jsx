import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout.jsx'
import { Landing } from './pages/Landing.jsx'
import { Services } from './pages/Services.jsx'
import { ForPhysicians } from './pages/ForPhysicians.jsx'
import { NotFound } from './pages/NotFound.jsx'

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<Services />} />
        <Route path="/for-physicians" element={<ForPhysicians />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Demo flow routes are added in the next commit. */}
      <Route path="/demo/*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
