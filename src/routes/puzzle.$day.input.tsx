import fs from 'node:fs'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const getInputContent = createServerFn({ method: 'GET' })
  .inputValidator((d: { day: string }) => d)
  .handler(async ({ data }) => {
    const { day } = data
    const inputPath = path.join(
      process.cwd(),
      'src',
      'inputs',
      `day${day}`,
      'input',
    )

    try {
      const content = await fs.promises.readFile(inputPath, 'utf-8')
      return { content, day }
    } catch (error) {
      throw new Error(`Input file not found for day ${day}`)
    }
  })

export const Route = createFileRoute('/puzzle/$day/input')({
  component: InputPage,
  loader: async ({ params }) => {
    const day = params.day
    return await getInputContent({ data: { day } })
  },
})

function InputPage() {
  const { content } = Route.useLoaderData()

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
      <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap break-words">
        {content}
      </pre>
    </div>
  )
}
