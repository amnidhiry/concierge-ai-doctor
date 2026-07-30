import { Button, Container, Eyebrow } from '../components/ui/primitives.jsx'

export function NotFound() {
  return (
    <Container className="py-28 text-center">
      <Eyebrow tone="pulse">404</Eyebrow>
      <h1 className="mt-4 font-display text-4xl text-ink">This page doesn't exist.</h1>
      <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-slate">
        The link may be out of date. Everything in this prototype is reachable from the home page or
        the demo.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button as="link" to="/" variant="outline">
          Back to home
        </Button>
        <Button as="link" to="/demo" variant="primary">
          Open the demo
        </Button>
      </div>
    </Container>
  )
}
