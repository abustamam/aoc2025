import { Link } from '@tanstack/react-router'
import { Github } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="w-full border-b border-slate-700 bg-slate-900 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all duration-300"
          >
            Advent of Code 2025
          </Link>
          <a
            href="https://github.com/abustamam/aoc2025"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 text-gray-300 hover:text-cyan-400"
            aria-label="View on GitHub"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm font-medium">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
