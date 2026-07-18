import { describe, it, expect } from 'vitest'
import { optimizeMiddleOrder } from './optimizer.js'

function pathCost(durations, order) {
  const n = durations.length
  let cost = durations[0][order[0]]
  for (let i = 0; i < order.length - 1; i++) cost += durations[order[i]][order[i + 1]]
  cost += durations[order[order.length - 1]][n - 1]
  return cost
}

describe('optimizeMiddleOrder', () => {
  it('returns an empty order when there are no middle stops', () => {
    expect(optimizeMiddleOrder([[0, 5], [5, 0]])).toEqual([])
  })

  it('returns the single middle stop when there is only one', () => {
    const durations = [
      [0, 5, 10],
      [5, 0, 5],
      [10, 5, 0],
    ]
    expect(optimizeMiddleOrder(durations)).toEqual([1])
  })

  it('keeps stops on a line in straight visiting order', () => {
    // O=0, A=10, B=20, D=30 on a line — straight-line order is optimal.
    const durations = [
      [0, 10, 20, 30],
      [10, 0, 10, 20],
      [20, 10, 0, 10],
      [30, 20, 10, 0],
    ]
    expect(optimizeMiddleOrder(durations)).toEqual([1, 2])
  })

  it('corrects a greedy nearest-neighbor mistake via 2-opt', () => {
    // Nearest-neighbor from O sees A (3) as closer than B (10) and visits it
    // first — but finishing O->A->B->D (24) is worse than O->B->A->D (12)
    // because leaving B for last is expensive. 2-opt should find the cheaper
    // order even though greedy nearest-neighbor did not.
    const durations = [
      [0, 3, 10, 999],
      [3, 0, 1, 1],
      [10, 1, 0, 20],
      [999, 1, 20, 0],
    ]
    const order = optimizeMiddleOrder(durations)
    expect(order).toEqual([2, 1])
    expect(pathCost(durations, order)).toBe(12)
  })

  it('never returns a worse total than the naive (insertion) order', () => {
    const durations = [
      [0, 40, 15, 25, 30],
      [40, 0, 20, 45, 10],
      [15, 20, 0, 12, 35],
      [25, 45, 12, 0, 18],
      [30, 10, 35, 18, 0],
    ]
    const naive = [1, 2, 3]
    const optimized = optimizeMiddleOrder(durations)
    // Same set of stops, just possibly reordered.
    expect(optimized.slice().sort()).toEqual(naive.slice().sort())
    expect(pathCost(durations, optimized)).toBeLessThanOrEqual(pathCost(durations, naive))
  })
})
