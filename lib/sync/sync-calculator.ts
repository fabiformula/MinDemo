// ═══════════════════════════════════════════════════════════════
// MinDeploy — Sync Calculator
// Cálculo de sincronía en tiempo real entre pareja
// ═══════════════════════════════════════════════════════════════

export interface SyncInput {
    breathRate: number
    heartRate: number
    timestamp: number
}

/**
 * Calcula el porcentaje de sincronía entre dos personas (0-100%)
 * Pondera:
 * - breath rate alignment (70% peso)
 * - heart rate alignment (30% peso)
 */
export function calculateSync(person1: SyncInput, person2: SyncInput): number {
    if (!person1.breathRate || !person2.breathRate) return 0

    // Breath rate sync (0-100) — más peso
    const brDiff = Math.abs(person1.breathRate - person2.breathRate)
    const brSync = Math.max(0, 100 - brDiff * 10) // 10 resp/min diff = 0%

    // Heart rate sync (0-100) — menos peso
    const hrDiff = Math.abs(person1.heartRate - person2.heartRate)
    const hrSync = Math.max(0, 100 - hrDiff * 3) // ~33 BPM diff = 0%

    const total = brSync * 0.7 + hrSync * 0.3
    return Math.round(Math.max(0, Math.min(100, total)))
}

/**
 * Genera un código de sesión de 6 caracteres alfanumérico
 */
export function generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin I, O, 0, 1 para evitar confusión
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}
