# Advent of Code 2025

[![GitHub](https://img.shields.io/badge/GitHub-abustamam%2Faoc2025-blue)](https://github.com/abustamam/aoc2025)

A web application for solving and tracking [Advent of Code](https://adventofcode.com/2025) puzzles, built with [TanStack Start](https://tanstack.com/start/latest).

## About

This project provides a beautiful web interface for viewing Advent of Code puzzles, submitting solutions, and tracking your progress. The app reads puzzle descriptions and input files from the filesystem and provides an interactive interface for solving each day's challenges.

## Features

- 📖 View puzzle descriptions with markdown rendering
- 📝 View puzzle inputs
- 💻 Interactive solver interface
- 📊 Track progress across all days
- 🎨 Modern, responsive UI with Tailwind CSS

## Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later)
- [aoc-cli](https://github.com/scarvalhojr/aoc-cli) for downloading puzzles

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Download Puzzles

Use [aoc-cli](https://github.com/scarvalhojr/aoc-cli) to download puzzle descriptions and inputs. The app expects files in the following structure:

```
src/inputs/
  day01/
    puzzle.md    # Puzzle description (markdown)
    input        # Puzzle input (plain text)
  day02/
    puzzle.md
    input
  ...
```

Example using aoc-cli:

```bash
# Download today's puzzle (if it's December 1-25)
aoc download

# Download a specific day
aoc download --day 1

# Download puzzle description only
aoc download --puzzle-only --puzzle-file src/inputs/day01/puzzle.md

# Download input only
aoc download --input-only --input-file src/inputs/day01/input
```

For more information on using aoc-cli, see the [aoc-cli documentation](https://github.com/scarvalhojr/aoc-cli).

#### Automated Download Script

This project includes a built-in script to download puzzles programmatically. This is useful for automation and GitHub Actions.

**Get your session cookie:**
1. Log in to [adventofcode.com](https://adventofcode.com)
2. Open browser developer tools (F12)
3. Go to Application/Storage → Cookies → `https://adventofcode.com`
4. Copy the value of the `session` cookie

**Using the script locally:**

```bash
# Set your session cookie as an environment variable
export AOC_SESSION="your-session-cookie-here"

# Download today's puzzle (if it's December 1-25)
bun run download

# Download a specific day
bun run download 5

# Download a specific day and year
bun run download 5 2025
```

Or use the script directly:

```bash
AOC_SESSION="your-session-cookie" bun scripts/download-puzzle.ts [day] [year]
```

**Automated GitHub Actions (9pm PST / Midnight EST):**

The project includes a GitHub Action workflow that automatically downloads puzzles at 9pm PST (when puzzles are released). To set it up:

1. Add your AOC session cookie as a GitHub secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AOC_SESSION`
   - Value: Your session cookie (from above)
   - Click "Add secret"

2. The workflow will automatically:
   - Run daily at 5am UTC (9pm PST / 10pm PDT) during December
   - Download the puzzle description and input
   - Commit and push the files to your repository
   - Trigger your deployment workflow (if configured)

3. You can also manually trigger the workflow:
   - Go to Actions → "Download AOC Puzzle" → "Run workflow"
   - Optionally specify a day and year

This allows you to compete in leaderboards even when you're not at your desk! The puzzle will be automatically downloaded, committed, and ready for you to solve.

### 3. Run Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:3002`.

## Building for Production

```bash
bun run build
```

The built application will be in the `.output` directory.

## Deployment

### Docker

This project includes a Dockerfile for containerized deployment.

#### Build Docker Image

```bash
docker build -t aoc2025 .
```

#### Run Docker Container

```bash
docker run -p 3000:3000 aoc2025
```

The app will be available at `http://localhost:3000`.

### GitHub Actions

The project includes two GitHub Actions workflows:

**1. Deploy Workflow** (`.github/workflows/deploy.yml`)
- Automatically builds and publishes Docker images to GitHub Container Registry (GHCR) on pushes to the `main` branch
- Builds a multi-stage Docker image
- Pushes to `ghcr.io/<your-username>/aoc2025:latest`
- Also tags images with the commit SHA

**2. Download Puzzle Workflow** (`.github/workflows/download-puzzle.yml`)
- Automatically downloads puzzles at 9pm PST (5am UTC) during December
- Commits and pushes the downloaded files
- See the "Automated Download Script" section above for setup instructions

## Project Structure

```
src/
  inputs/          # Puzzle inputs and descriptions
    day01/
      puzzle.md    # Puzzle description
      input        # Puzzle input
  routes/          # TanStack Router file-based routes
    index.tsx      # Home page (day selector)
    puzzle.$day.tsx        # Puzzle description view
    puzzle.$day.input.tsx  # Input view
    puzzle.$day.solve.tsx  # Solver interface
  solvers/         # Solution implementations
    day01.ts
    index.ts
```

## Development

### Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run serve` - Preview production build
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
- `bun run check` - Format and lint (fixes issues)
- `bun run download [day] [year]` - Download puzzle and input (requires `AOC_SESSION` env var)

### Adding a New Day

1. Download the puzzle using aoc-cli:
   ```bash
   aoc download --day <day> --puzzle-file src/inputs/day<day>/puzzle.md --input-file src/inputs/day<day>/input
   ```

2. Create a solver file in `src/solvers/day<day>.ts`:
   ```typescript
   export async function solvePart1(input: string): Promise<string> {
     // Your solution here
   }

   export async function solvePart2(input: string): Promise<string> {
     // Your solution here
   }
   ```

3. Export the solver in `src/solvers/index.ts`

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start/latest) (React + SSR)
- **Router**: [TanStack Router](https://tanstack.com/router/latest)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **Runtime**: [Bun](https://bun.sh/)
- **Deployment**: Docker + GitHub Actions

## Links

- [GitHub Repository](https://github.com/abustamam/aoc2025)
- [Advent of Code 2025](https://adventofcode.com/2025)
- [aoc-cli](https://github.com/scarvalhojr/aoc-cli) - Command-line tool for downloading puzzles
- [TanStack Start Documentation](https://tanstack.com/start/latest)

## License

MIT
