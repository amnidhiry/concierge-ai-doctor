import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout.jsx'
import { DemoProvider } from './context/DemoProvider.jsx'
import { Landing } from './pages/Landing.jsx'
import { Services } from './pages/Services.jsx'
import { ForPhysicians } from './pages/ForPhysicians.jsx'
import { NotFound } from './pages/NotFound.jsx'
import { DemoLayout } from './pages/demo/DemoLayout.jsx'
import { IntakePage } from './pages/demo/IntakePage.jsx'
import { SynthesisPage } from './pages/demo/SynthesisPage.jsx'
import { PhysicianPage } from './pages/demo/PhysicianPage.jsx'
import { PatientResponsePage } from './pages/demo/PatientResponsePage.jsx'

/**
 * DemoProvider sits above the router rather than inside the /demo branch: a
 * provider mounted on the demo routes would unmount the moment someone clicked
 * "Exit demo", silently discarding a case they'd just run a live API call to
 * produce. State is still session-only — a refresh clears it, which is the
 * intended scope for this pass.
 */
export function App() {
  return (
    <DemoProvider>
      <Routes>
        {/* Marketing site */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/for-physicians" element={<ForPhysicians />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Interactive product demo — Steps 1–4 */}
        <Route path="/demo" element={<DemoLayout />}>
          <Route index element={<IntakePage />} />
          <Route path="synthesis" element={<SynthesisPage />} />
          <Route path="physician" element={<PhysicianPage />} />
          <Route path="response" element={<PatientResponsePage />} />
        </Route>
      </Routes>
    </DemoProvider>
  )
}
