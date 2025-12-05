#!/usr/bin/env bun

/**
 * Script to download Advent of Code puzzle descriptions and inputs
 * 
 * Usage:
 *   bun scripts/download-puzzle.ts [day] [year]
 * 
 * Environment variables:
 *   AOC_SESSION - Your Advent of Code session cookie (required)
 * 
 * Examples:
 *   bun scripts/download-puzzle.ts 5 2025
 *   bun scripts/download-puzzle.ts 5        # Uses current year
 *   bun scripts/download-puzzle.ts          # Uses today's date
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const AOC_BASE_URL = 'https://adventofcode.com'

interface DownloadOptions {
  day: number
  year: number
  session: string
}

async function fetchWithSession(url: string, session: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'Cookie': `session=${session}`,
      'User-Agent': 'Mozilla/5.0 (compatible; AOC-Downloader/1.0)',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Puzzle not found. Day ${url.match(/day\/(\d+)/)?.[1]} may not be available yet.`)
    }
    if (response.status === 400) {
      throw new Error('Invalid session cookie. Please check your AOC_SESSION environment variable.')
    }
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response
}

async function downloadInput(day: number, year: number, session: string): Promise<string> {
  const url = `${AOC_BASE_URL}/${year}/day/${day}/input`
  console.log(`Downloading input from ${url}...`)
  
  const response = await fetchWithSession(url, session)
  const input = await response.text()
  
  // Remove trailing newline if present
  return input.trimEnd()
}

async function downloadPuzzle(day: number, year: number, session: string): Promise<string> {
  const url = `${AOC_BASE_URL}/${year}/day/${day}`
  console.log(`Downloading puzzle description from ${url}...`)
  
  const response = await fetchWithSession(url, session)
  const html = await response.text()
  
  // Extract the puzzle description from the HTML
  // The puzzle is in <article class="day-desc"> tags
  const articleMatch = html.match(/<article class="day-desc">([\s\S]*?)<\/article>/)
  
  if (!articleMatch) {
    throw new Error('Could not find puzzle description in HTML')
  }
  
  let markdown = articleMatch[1]
  
  // Convert HTML to markdown-like format
  // Remove script tags
  markdown = markdown.replace(/<script[\s\S]*?<\/script>/gi, '')
  
  // Convert <h2> to ##
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
  
  // Convert <p> to paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  
  // Convert <em> to *italic*
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  
  // Convert <strong> to **bold**
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  
  // Convert <code> to `code`
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  
  // Convert <pre><code> to code blocks
  markdown = markdown.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1```')
  
  // Convert <ul> and <li> to markdown lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n')
  markdown = markdown.replace(/<\/ul>/gi, '\n')
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  
  // Convert <a> links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  
  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  markdown = markdown.trim()
  
  // Add day header
  const dayTitle = html.match(/<h2>--- Day \d+: (.*?) ---<\/h2>/)?.[1] || `Day ${day}`
  const header = `--- Day ${day}: ${dayTitle} ---\n----------\n\n`
  
  return header + markdown
}

async function saveFiles(day: number, puzzle: string, input: string): Promise<void> {
  const dayPadded = day.toString().padStart(2, '0')
  const dayDir = path.join(process.cwd(), 'src', 'inputs', `day${dayPadded}`)
  
  // Create directory if it doesn't exist
  if (!existsSync(dayDir)) {
    await mkdir(dayDir, { recursive: true })
    console.log(`Created directory: ${dayDir}`)
  }
  
  const puzzlePath = path.join(dayDir, 'puzzle.md')
  const inputPath = path.join(dayDir, 'input')
  
  await writeFile(puzzlePath, puzzle, 'utf-8')
  console.log(`Saved puzzle description to ${puzzlePath}`)
  
  await writeFile(inputPath, input, 'utf-8')
  console.log(`Saved input to ${inputPath}`)
}

async function main() {
  // Get day and year from command line args
  const args = process.argv.slice(2)
  const dayArg = args[0] ? parseInt(args[0], 10) : null
  const yearArg = args[1] ? parseInt(args[1], 10) : null
  
  // Get session cookie from environment
  const session = process.env.AOC_SESSION
  if (!session) {
    console.error('Error: AOC_SESSION environment variable is required')
    console.error('Get your session cookie from https://adventofcode.com (browser dev tools -> Application -> Cookies)')
    process.exit(1)
  }
  
  // Determine day
  let day: number
  if (dayArg) {
    day = dayArg
  } else {
    const now = new Date()
    const month = now.getMonth() + 1 // 0-indexed
    const date = now.getDate()
    
    if (month === 12 && date >= 1 && date <= 25) {
      day = date
    } else {
      console.error('Error: No day specified and it is not December 1-25')
      console.error('Usage: bun scripts/download-puzzle.ts [day] [year]')
      process.exit(1)
    }
  }
  
  if (day < 1 || day > 25) {
    console.error('Error: Day must be between 1 and 25')
    process.exit(1)
  }
  
  // Determine year
  const year = yearArg || new Date().getFullYear()
  
  console.log(`Downloading Advent of Code ${year}, Day ${day}...`)
  
  try {
    const puzzle = await downloadPuzzle(day, year, session)
    const input = await downloadInput(day, year, session)
    
    await saveFiles(day, puzzle, input)
    
    console.log(`\n✅ Successfully downloaded Day ${day}!`)
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main()

