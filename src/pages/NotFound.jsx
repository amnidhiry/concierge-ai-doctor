import { Button, Container } from '../components/ui/primitives.jsx'

export function NotFound() {
  return (
    <Container className="py-20 lg:py-28">
      <div className="max-w-measure">
        <p className="sheet-label">404</p>
        <h1 className="mt-4 text-display-sm">This page doesn’t exist.</h1>
        <p className="mt-4 text-body leading-relaxed text-ink-muted">
          The link may be out of date. Everything in this prototype is reachable from the home page
          or the demo.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          <Button as="link" to="/" variant="outline">
            Back to home
          </Button>
          <Button as="link" to="/demo" variant="primary">
            Book a call
          </Button>
        </div>
      </div>
    </Container>
  )
}
