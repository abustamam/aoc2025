import path from 'node:path'
import fs from 'node:fs'
import { createServerFn } from '@tanstack/react-start'

/**
 * Check if a visualization component exists for a given day
 */
export const checkVisualizationExists = createServerFn({ method: 'GET' })
  .inputValidator((d: { day: string }) => d)
  .handler(async ({ data }) => {
    const { day } = data
    const dayPadded = day.padStart(2, '0')
    const visualizationPath = path.join(
      process.cwd(),
      'src',
      'components',
      'visualizations',
      `Day${dayPadded}Visualization.tsx`,
    )

    try {
      await fs.promises.access(visualizationPath, fs.constants.F_OK)
      return { exists: true }
    } catch {
      return { exists: false }
    }
  })
