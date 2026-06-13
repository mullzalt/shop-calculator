import { evaluate } from 'mathjs'

// Replace display operators with mathjs-compatible ones
function normalize(expr: string): string {
  return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
}

export function evalExpression(expr: string): number | null {
  if (!expr.trim()) return null
  try {
    const result = evaluate(normalize(expr))
    if (typeof result !== 'number' || !isFinite(result)) return null
    return Math.round(result)
  } catch {
    return null
  }
}
