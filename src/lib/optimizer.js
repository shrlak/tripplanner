// Best-path ordering over the OSRM duration matrix. The origin stays first
// and the destination stays last; the middle stops are ordered by a
// nearest-neighbor seed refined with 2-opt until no swap improves the total.
//
// Matrix layout: index 0 = origin, indices 1..n-2 = middle stops,
// index n-1 = destination. Returns middle indices in visit order.

export function optimizeMiddleOrder(durations) {
  const n = durations.length
  if (n <= 3) return n === 3 ? [1] : []
  const middles = []
  for (let i = 1; i < n - 1; i++) middles.push(i)

  // Nearest-neighbor seed from the origin.
  const order = []
  const remaining = new Set(middles)
  let current = 0
  while (remaining.size > 0) {
    let best = null
    let bestCost = Infinity
    for (const idx of remaining) {
      const cost = durations[current][idx]
      if (cost < bestCost) {
        bestCost = cost
        best = idx
      }
    }
    order.push(best)
    remaining.delete(best)
    current = best
  }

  const pathCost = (ord) => {
    let cost = durations[0][ord[0]]
    for (let i = 0; i < ord.length - 1; i++) cost += durations[ord[i]][ord[i + 1]]
    cost += durations[ord[ord.length - 1]][n - 1]
    return cost
  }

  // 2-opt: reverse segments while it shortens the tour.
  let improved = true
  let guard = 0
  while (improved && guard++ < 300) {
    improved = false
    for (let i = 0; i < order.length - 1; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const candidate = order
          .slice(0, i)
          .concat(order.slice(i, j + 1).reverse(), order.slice(j + 1))
        if (pathCost(candidate) < pathCost(order) - 1e-9) {
          order.splice(0, order.length, ...candidate)
          improved = true
        }
      }
    }
  }
  return order
}
