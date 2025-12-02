import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'
import { Navbar } from '../components/Navbar'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

// Get base URL from environment variable or default to localhost for development
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin
  }
  // Server-side: use environment variable or default
  return import.meta.env.VITE_SITE_URL || 'http://localhost:3002'
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    const baseUrl = getBaseUrl()
    const siteTitle = 'Advent of Code 2025'
    const siteDescription =
      'Solutions and visualizations for Advent of Code 2025 puzzles'
    const imageUrl = `${baseUrl}/images/advent-of-code-2025.png`

    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: siteTitle,
        },
        {
          name: 'description',
          content: siteDescription,
        },
        // Open Graph tags
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:title',
          content: siteTitle,
        },
        {
          property: 'og:description',
          content: siteDescription,
        },
        {
          property: 'og:image',
          content: imageUrl,
        },
        {
          property: 'og:image:type',
          content: 'image/png',
        },
        {
          property: 'og:image:width',
          content: '1200',
        },
        {
          property: 'og:image:height',
          content: '630',
        },
        {
          property: 'og:url',
          content: baseUrl,
        },
        // Twitter Card tags
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: siteTitle,
        },
        {
          name: 'twitter:description',
          content: siteDescription,
        },
        {
          name: 'twitter:image',
          content: imageUrl,
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
        {
          rel: 'stylesheet',
          href: '/css/starry-night-dark.css',
        },
      ],
    }
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Navbar />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
