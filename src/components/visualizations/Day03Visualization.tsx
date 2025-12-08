import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

interface BatterySelection {
  joltage: number
  selectedIndices: number[]
}

/**
 * Get the maximum joltage and which indices were selected
 */
const getJoltageWithSelection = (
  numbers: string,
  numDigits: number,
): BatterySelection => {
  const digits = numbers.split('').map(Number)
  const n = digits.length

  // dp[i][j] = maximum number we can form using j digits starting from position i
  // and the indices selected to form that number
  const memo = new Map<string, { maxNum: number; selectedIndices: number[] }>()

  const dp = (
    start: number,
    remaining: number,
  ): { maxNum: number; selectedIndices: number[] } => {
    // Base case: no digits left to select
    if (remaining === 0) return { maxNum: 0, selectedIndices: [] }

    // Not enough digits remaining
    if (n - start < remaining) return { maxNum: -1, selectedIndices: [] }

    const key = `${start},${remaining}`
    if (memo.has(key)) {
      return memo.get(key)!
    }

    let maxNum = -1
    let bestIndices: number[] = []

    // Try selecting each possible digit at position >= start
    // We need to leave at least (remaining - 1) digits after the selected one
    for (let i = start; i <= n - remaining; i++) {
      const rest = dp(i + 1, remaining - 1)
      if (rest.maxNum !== -1) {
        // Form the number: current digit * 10^(remaining-1) + rest
        const power = Math.pow(10, remaining - 1)
        const num = digits[i] * power + rest.maxNum
        if (num > maxNum) {
          maxNum = num
          bestIndices = [i, ...rest.selectedIndices]
        }
      }
    }

    const result = { maxNum, selectedIndices: bestIndices }
    memo.set(key, result)
    return result
  }

  const result = dp(0, numDigits)
  return {
    joltage: result.maxNum,
    selectedIndices: result.selectedIndices,
  }
}

export function Day03Visualization({ input }: { input: string }) {
  const [numBatteries, setNumBatteries] = useState(2)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBankIndex, setCurrentBankIndex] = useState(0)

  const banks = useMemo(() => {
    return input
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => line.trim())
  }, [input])

  const selections = useMemo(() => {
    return banks.map((bank) => {
      const maxDigits = Math.min(bank.length, 12)
      const validNumBatteries = Math.min(numBatteries, maxDigits)
      if (validNumBatteries === 0) {
        return { joltage: 0, selectedIndices: [] }
      }
      return getJoltageWithSelection(bank, validNumBatteries)
    })
  }, [banks, numBatteries])

  const totalJoltage = useMemo(() => {
    return selections.reduce((sum, sel) => sum + sel.joltage, 0)
  }, [selections])

  // Auto-play through banks
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentBankIndex((prev) => {
        if (prev >= banks.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 2000) // 2 seconds per bank

    return () => clearInterval(interval)
  }, [isPlaying, banks.length])

  const handlePlayPause = () => {
    if (currentBankIndex >= banks.length - 1) {
      setCurrentBankIndex(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentBankIndex(0)
  }

  const handleBankChange = (delta: number) => {
    setCurrentBankIndex((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next >= banks.length) return banks.length - 1
      return next
    })
  }

  const currentBank = banks[currentBankIndex]
  const currentSelection = selections[currentBankIndex]

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium">
              Number of Batteries: {numBatteries}
            </label>
            <input
              type="range"
              min="2"
              max="12"
              value={numBatteries}
              onChange={(e) => setNumBatteries(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>

          <div className="text-white text-sm space-y-1">
            <div>
              Bank: {currentBankIndex + 1} / {banks.length}
            </div>
            <div>
              Total Joltage:{' '}
              <span className="text-cyan-400 font-bold text-lg">
                {totalJoltage.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <ButtonGroup>
            <Button variant="outline" onClick={handlePlayPause}>
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBankChange(-1)}
              disabled={currentBankIndex === 0}
            >
              ← Prev Bank
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBankChange(1)}
              disabled={currentBankIndex >= banks.length - 1}
            >
              Next Bank →
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Current Bank Display */}
          <div className="w-full">
            <div className="text-white text-sm mb-2 text-center">
              Bank {currentBankIndex + 1} - Maximum Joltage:{' '}
              <span className="text-cyan-400 font-bold text-xl">
                {currentSelection.joltage.toLocaleString()}
              </span>
            </div>

            {/* Battery Sequence */}
            <div className="bg-slate-900/50 rounded-lg p-4 overflow-x-auto">
              <div className="flex gap-2 justify-center flex-wrap">
                {currentBank.split('').map((digit, index) => {
                  const isSelected =
                    currentSelection.selectedIndices.includes(index)
                  return (
                    <div
                      key={index}
                      className={`
                        w-12 h-12 rounded-lg flex items-center justify-center
                        font-bold text-lg transition-all duration-300
                        ${
                          isSelected
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-110'
                            : 'bg-slate-700 text-slate-300'
                        }
                      `}
                      title={`Position ${index + 1}, Digit: ${digit}`}
                    >
                      {digit}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected Number Display */}
            {currentSelection.selectedIndices.length > 0 && (
              <div className="mt-4 text-center">
                <div className="text-slate-400 text-sm mb-2">
                  Selected Number:
                </div>
                <div className="text-cyan-400 font-mono text-3xl font-bold">
                  {currentSelection.selectedIndices
                    .map((idx) => currentBank[idx])
                    .join('')}
                </div>
              </div>
            )}
            {currentSelection.selectedIndices.length === 0 && (
              <div className="mt-4 text-center">
                <div className="text-slate-400 text-sm">
                  Bank too short for {numBatteries} batteries
                </div>
              </div>
            )}
          </div>

          {/* All Banks Summary */}
          <div className="w-full mt-6">
            <div className="text-white text-sm mb-3 font-semibold">
              All Banks Summary:
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {banks.map((bank, index) => {
                  const selection = selections[index]
                  const isCurrent = index === currentBankIndex
                  return (
                    <div
                      key={index}
                      className={`
                        p-3 rounded-lg border transition-all
                        ${
                          isCurrent
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700 bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-medium ${
                            isCurrent ? 'text-cyan-400' : 'text-slate-300'
                          }`}
                        >
                          Bank {index + 1}
                        </span>
                        <span
                          className={`font-bold ${
                            isCurrent ? 'text-cyan-400' : 'text-white'
                          }`}
                        >
                          {selection.joltage.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {bank.split('').map((digit, digitIndex) => {
                          const isSelected =
                            selection.selectedIndices.includes(digitIndex)
                          return (
                            <span
                              key={digitIndex}
                              className={`
                                text-xs px-1.5 py-0.5 rounded
                                ${
                                  isSelected
                                    ? 'bg-cyan-500/30 text-cyan-300'
                                    : 'text-slate-500'
                                }
                              `}
                            >
                              {digit}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
