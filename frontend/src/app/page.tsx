export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-amber-50">
      <main className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
          Farmers Market Network
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Connect farmers and customers at scale. Discover trusted suppliers by
          product, location, and reviews.
        </p>
        <div className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <a
            className="flex-1 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            href="/auth"
          >
            Sign In / Register
          </a>
          <a
            className="flex-1 rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-700 transition hover:bg-green-50"
            href="/marketplace"
          >
            Explore Marketplace
          </a>
        </div>
        <div className="mt-4 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <a
            className="flex-1 rounded-lg border border-amber-600 px-5 py-3 font-semibold text-amber-700 transition hover:bg-amber-50"
            href="/dashboard/farmer"
          >
            Farmer Dashboard
          </a>
          <a
            className="flex-1 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/dashboard/buyer"
          >
            Buyer Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
