import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout.jsx'
import { DemoProvider } from './context/DemoProvider.jsx'
import { Landing } from './pages/Landing.jsx'
import { TheVisit } from './pages/TheVisit.jsx'
import { ForPhysicians } from './pages/ForPhysicians.jsx'
import { NotFound } from './pages/NotFound.jsx'
import { VisitPage } from './pages/VisitPage.jsx'
import { DemoLayout } from './pages/demo/DemoLayout.jsx'
import { BookingPage } from './pages/demo/BookingPage.jsx'
import { CarePacketPage } from './pages/demo/CarePacketPage.jsx'
import { VoiceVisitPage } from './pages/demo/VoiceVisitPage.jsx'
import { DocumentationPage } from './pages/demo/DocumentationPage.jsx'

/**
 * DemoProvider sits above the router rather than inside the /demo branch: a
 * provider mounted on the demo routes would unmount the moment someone clicked
 * "Exit demo", silently discarding a case they'd just run live API calls to
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
          <Route path="/the-visit" element={<TheVisit />} />
          {/* `/services` described a tiered subscription this product does not
              have. The path is kept as a redirect rather than deleted, because
              it is the one URL likely to be in someone's history or in a link
              from an earlier version of the deck. */}
          <Route path="/services" element={<Navigate to="/the-visit" replace />} />
          <Route path="/for-physicians" element={<ForPhysicians />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Standalone voice visit. Outside /demo and outside SiteLayout: it is
            opened in a second tab, which has none of the first tab's in-memory
            state, so everything it needs comes from the URL. */}
        <Route path="/visit/:caseId" element={<VisitPage />} />

        {/* The product demo — one bounded visit, in four stages. */}
        <Route path="/demo" element={<DemoLayout />}>
          <Route index element={<BookingPage />} />
          <Route path="packet" element={<CarePacketPage />} />
          <Route path="visit" element={<VoiceVisitPage />} />
          <Route path="documentation" element={<DocumentationPage />} />
        </Route>
      </Routes>
    </DemoProvider>
  )
}
