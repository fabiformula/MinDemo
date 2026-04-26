// ═══════════════════════════════════════════════════════════════
// MinDeploy — Pattern Matcher
// Calcula similitud entre patrones respiratorios
// ═══════════════════════════════════════════════════════════════

import type { BreathPattern, ActivePattern, ActivePatternWithSimilarity } from '@/lib/types/breath-pattern'

/**
 * Calcula la similitud entre dos patrones respiratorios (0-100%)
 * Fórmula: 100 - (|HR_diff|*2 + |BR_diff|*5 + |Var_diff|*1)
 */
export function calculateSimilarity(a: BreathPattern, b: BreathPattern): number {
    const hrDiff = Math.abs(a.heartRate - b.heartRate)
    const brDiff = Math.abs(a.breathRate - b.breathRate)
    const varDiff = Math.abs(a.variability - b.variability)

    const raw = 100 - (hrDiff * 2 + brDiff * 5 + varDiff * 1)
    return Math.max(0, Math.min(100, Math.round(raw)))
}

/**
 * Encuentra patrones similares al mío, ordenados por similitud descendente
 * Excluye el usuario actual (myUserId)
 */
export function findMatches(
    myPattern: BreathPattern,
    patterns: ActivePattern[],
    myUserId?: string
): ActivePatternWithSimilarity[] {
    return patterns
        .filter(p => p.userId !== myUserId)
        .map(p => ({
            ...p,
            similarity: calculateSimilarity(myPattern, {
                heartRate: p.heartRate,
                breathRate: p.breathRate,
                variability: p.variability,
            }),
        }))
        .sort((a, b) => b.similarity - a.similarity)
}
