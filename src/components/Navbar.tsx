import { Link } from '@tanstack/react-router'

export function Navbar() {
  return (
    <nav className="w-full border-b border-slate-700 bg-slate-900 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-start">
          <Link
            to="/"
            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all duration-300"
          >
            Advent of Code 2025
          </Link>
        </div>
      </div>
    </nav>
  )
}
