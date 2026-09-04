import Link from "next/link";

const STEPS = [
  {
    icon: "📝",
    title: "Farmers list what they have",
    body: "Livestock or crops, priced and photographed in minutes — no middleman required.",
  },
  {
    icon: "🔍",
    title: "Buyers search nearby",
    body: "Filter by product, distance, and rating to find trusted farmers close to you.",
  },
  {
    icon: "🤝",
    title: "Order, chat, and arrange delivery",
    body: "Message the farmer directly, pay into escrow, and track delivery to your door.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Hero */}
      <main className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-green-700 text-2xl shadow-lg shadow-green-900/10">
          🌾
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          Farmers Market Network
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Connect farmers and buyers directly. Discover trusted suppliers by
          product, location, and reviews — fresh produce and livestock, sourced locally.
        </p>
        <div className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <Link
            className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
            href="/auth"
          >
            Sign In / Register
          </Link>
          <Link
            className="flex-1 rounded-xl border border-green-700 px-5 py-3 font-semibold text-green-700 transition hover:bg-green-50"
            href="/marketplace"
          >
            Explore Marketplace
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-green-700">
          How it works
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <span className="absolute -top-3 -left-3 flex size-7 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="text-3xl">{step.icon}</div>
              <h3 className="mt-3 font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audience split */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-green-100 bg-white p-7 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
              🌾
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">For farmers</h3>
            <p className="mt-1.5 text-sm text-gray-500">
              List your farm&apos;s produce and livestock, manage orders and deliveries,
              and get discovered by buyers searching in your area.
            </p>
            <Link
              href="/auth"
              className="mt-4 inline-flex items-center text-sm font-semibold text-amber-700 hover:underline"
            >
              Start selling →
            </Link>
          </div>
          <div className="rounded-2xl border border-green-100 bg-white p-7 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-50 text-xl">
              🛒
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">For buyers</h3>
            <p className="mt-1.5 text-sm text-gray-500">
              Search farmers by product, distance, and reviews. Chat directly, place
              an order, and track delivery — all in one place.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center text-sm font-semibold text-green-700 hover:underline"
            >
              Browse the marketplace →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
