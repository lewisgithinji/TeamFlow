export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-indigo-600">TeamFlow</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered agile project management platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">Fast Setup</h3>
            <p className="text-gray-600">Get started in minutes with our intuitive interface</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600">Let AI help you plan sprints and break down tasks</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Real-time</h3>
            <p className="text-gray-600">Collaborate with your team in real-time</p>
          </div>
        </div>

        <div className="mt-12 space-x-4">
          <a
            href="/login"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Get Started
          </a>
          <a
            href="/api/v1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
          >
            API Docs
          </a>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Frontend: <span className="font-mono bg-gray-100 px-2 py-1 rounded">localhost:3000</span></p>
          <p className="mt-2">Backend: <span className="font-mono bg-gray-100 px-2 py-1 rounded">localhost:4000</span></p>
        </div>
      </div>
    </div>
  );
}
