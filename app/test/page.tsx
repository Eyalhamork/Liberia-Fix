// app/test/page.tsx
export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tailwind Test</h1>
        <p className="text-gray-600">
          If you see a blue background and this styled card, Tailwind is
          working!
        </p>
        <button className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Test Button
        </button>
      </div>
    </div>
  );
}
