import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Macro Tracker</h1>
      <p className="text-gray-500 mb-8">Your personal Indian vegetarian macro tracker</p>
      <div className="flex gap-4">
        <Link href="/meal-logger" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
          Log a Meal
        </Link>
        <Link href="/daily-dashboard" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">
          Dashboard
        </Link>
      </div>
    </main>
  );
}