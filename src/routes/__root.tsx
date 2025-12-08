import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

// Import CSS directly so it's bundled and inlined
import '../styles.css'
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
        // Theme color for mobile browsers
        {
          name: 'theme-color',
          content: '#0f172a',
        },
        // Apple mobile web app
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'default',
        },
        {
          name: 'apple-mobile-web-app-title',
          content: 'AoC2025',
        },
      ],
      links: [
        {
          rel: 'preload',
          href: '/css/starry-night-dark.css',
          as: 'style',
        },
        {
          rel: 'stylesheet',
          href: '/css/starry-night-dark.css',
        },
        // Favicons
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon/favicon.ico',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon/favicon.svg',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          href: '/favicon/favicon-96x96.png',
        },
        {
          rel: 'apple-touch-icon',
          href: '/favicon/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/favicon/site.webmanifest',
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
        {/* Critical CSS to prevent FOUC */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                margin: 0;
                background: linear-gradient(to bottom, #0f172a, #1e293b, #0f172a);
                color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              * {
                box-sizing: border-box;
              }
            `,
          }}
        />
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
