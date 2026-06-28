export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" data-testid="about-page">
      <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">About TestSeries</h1>
      <p className="mt-4 text-slate-600">
        TestSeries is built for Indian students who deserve great stationery at honest prices. From
        long-haul notebooks and LCD writing tablets to geometry boxes and study bottles — every product
        is hand-picked to last a full school year (and then some).
      </p>
      <p className="mt-4 text-slate-600">
        We started in a single corner of a college library. Today, we ship to thousands of students
        across India, but the mission stays the same: make studying lighter, brighter and more fun.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { k: "10K+", v: "Happy students" },
          { k: "50+", v: "Cities served" },
          { k: "4.8★", v: "Average rating" },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="font-display text-3xl font-bold text-blue-700">{s.k}</div>
            <div className="mt-1 text-sm text-slate-500">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
