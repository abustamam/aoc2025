import { common, createStarryNight } from '@wooorm/starry-night'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { useEffect, useState } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'

// Create starry-night instance (only once, shared across renders)
let starryNightInstance: Awaited<ReturnType<typeof createStarryNight>> | null =
  null

async function getStarryNight() {
  if (!starryNightInstance) {
    starryNightInstance = await createStarryNight(common)
  }
  return starryNightInstance
}

interface CodeHighlightProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeHighlight({
  code,
  language = 'source.ts',
  showLineNumbers = false,
  className = '',
}: CodeHighlightProps) {
  const [highlightedTree, setHighlightedTree] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getStarryNight()
      .then((starryNight) => {
        if (cancelled) return

        try {
          const scope = starryNight.flagToScope(language as any)
          if (scope) {
            const tree = starryNight.highlight(code, scope)
            const jsxTree = toJsxRuntime(tree, {
              Fragment,
              jsx,
              jsxs,
              development: false,
            })
            setHighlightedTree(jsxTree)
          } else {
            setHighlightedTree(null)
          }
        } catch (e) {
          console.error('Error highlighting code:', e)
          setHighlightedTree(null)
        } finally {
          setIsLoading(false)
        }
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Error initializing starry-night:', e)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [code, language])

  const HeaderButtons = () => (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
        <HeaderButtons />
        <pre
          className={`font-mono text-sm overflow-x-auto bg-slate-900/50 p-4 ${className}`}
        >
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  if (!highlightedTree) {
    return (
      <div className="rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
        <HeaderButtons />
        <pre
          className={`font-mono text-sm overflow-x-auto bg-slate-900/50 p-4 ${className}`}
        >
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  const lines = code.split('\n')
  const lineNumbers = showLineNumbers
    ? lines.map((_, i) => (
        <span
          key={i}
          className="block min-w-[3em] pr-4 text-slate-500 select-none"
        >
          {i + 1}
        </span>
      ))
    : null

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
      <HeaderButtons />
      <pre
        className={`font-mono text-sm overflow-x-auto p-6 ${className}`}
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          background: '#1e1e1e',
          margin: 0,
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        <code className="block">
          {showLineNumbers ? (
            <div className="flex">
              <div className="pr-4 border-r border-slate-700/50 text-slate-500 select-none">
                {lineNumbers}
              </div>
              <div className="flex-1 pl-4">{highlightedTree}</div>
            </div>
          ) : (
            highlightedTree
          )}
        </code>
      </pre>
    </div>
  )
}
