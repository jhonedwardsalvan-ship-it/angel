export function Newsletter() {
  return (
    <section className="section bg-accent" aria-labelledby="newsletter-title">
      <div className="container-narrow stack items-center gap-4 text-center">
        <p className="eyebrow text-accent-foreground/70">Stay in bloom</p>
        <h2 id="newsletter-title">Get 10% off your first order</h2>
        <p className="text-accent-foreground/80">
          Seasonal launches, care tips and early access to holiday collections.
        </p>
        {/* Not wired to a backend yet. */}
        <form className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Your email address"
            className="input border-transparent"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
