import Link from "next/link";

export default function Home() {
  return (
    <div className="relative z-10 overflow-x-clip">
      <div className="noise-layer" />

      <section className="grid-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#b8c7e2]">
          E-Commerce Decision Intelligence
        </p>

        <h1 className="text-display max-w-4xl text-5xl font-semibold leading-[0.95] md:text-7xl lg:text-8xl">
          Decisions That Move Commerce Forward
        </h1>

        <p className="mt-8 max-w-2xl text-base leading-8 text-[var(--muted)] md:text-lg">
          Deterministic product ranking with TOPSIS, explainable scoring,
          governance workflows, and AI-assisted optimization. India-first,
          globally scalable.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="glow rounded-full border border-cyan-300/40 bg-cyan-300/15 px-8 py-3.5 text-sm font-semibold tracking-wide text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-300/20"
          >
            Open Dashboard
          </Link>
          <Link
            href="/dashboard/topsis/run"
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Run TOPSIS Analysis
          </Link>
        </div>

        <div className="mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              title: "TOPSIS Core",
              desc: "Multi-criteria ranked decisions. Not binary A/B — full ranked optimization across 5+ dimensions.",
              color: "text-cyan-300",
            },
            {
              title: "Explainable",
              desc: "Every ranking decomposed. Every weight change logged. Full audit trail for compliance.",
              color: "text-lime-300",
            },
            {
              title: "Governed",
              desc: "Weight approval gates, sensitivity analysis, rank stability checks. Enterprise-grade governance.",
              color: "text-amber-300",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left"
            >
              <h3 className={`text-display text-lg font-semibold ${item.color}`}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
