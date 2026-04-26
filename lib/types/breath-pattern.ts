// ═══════════════════════════════════════════════════════════════
// MinDeploy — Breath Pattern Types
// ═══════════════════════════════════════════════════════════════

export interface UserLocation {
  lat: number
  lng: number
  city?: string
  country?: string
}

export interface BreathPattern {
  heartRate: number       // BPM
  breathRate: number      // respiraciones/min
  variability: number     // HRV coherence 0-100
}

export interface ActivePattern {
  id: string
  userId: string
  heartRate: number
  breathRate: number
  variability: number
  location: UserLocation
  createdAt: string
  expiresAt: string
}

export interface ActivePatternWithSimilarity extends ActivePattern {
  similarity: number     // 0-100%
}

export interface SyncSession {
  id: string
  sessionCode: string
  user1Id: string
  user2Id: string | null
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  durationSeconds: number | null
  avgSyncPercentage: number | null
  syncData: SyncDataPoint[]
}

export interface SyncDataPoint {
  timestamp: number
  syncPercentage: number
  user1BreathRate: number
  user2BreathRate: number
}

export interface SyncRealtimeData {
  sessionId: string
  userId: string
  timestamp: string
  breathRate: number
  heartRate: number
}

// ═══════════════════════════════════════════════════════════════
// PPG Monitor Types
// ═══════════════════════════════════════════════════════════════

export type PPGState = 'IDLE' | 'INITIALIZING' | 'CALIBRATING' | 'MONITORING' | 'PAUSED' | 'ERROR'

export interface PPGConfig {
  SAMPLE_RATE: number
  HISTORY_SIZE: number
  SMOOTH_WINDOW: number
  MIN_BPM: number
  MAX_BPM: number
  MIN_PEAK_DISTANCE_MS: number
  MAX_PEAK_DISTANCE_MS: number
  MIN_SIGNAL_STRENGTH: number
  SATURATION_THRESHOLD: number
  MIN_BRIGHTNESS: number
  SIGNAL_LOSS_TIMEOUT_MS: number
  PEAK_THRESHOLD_MULTIPLIER: number
  VALLEY_THRESHOLD_MULTIPLIER: number
  LOCAL_WINDOW_SIZE: number
  CONSISTENCY_WINDOW: number
  CALIBRATION_BEATS: number
  OUTLIER_THRESHOLD: number
  TORCH_ENABLED: boolean
  CANVAS_SIZE: number
  REGION_CENTER_RATIO: number
  MAX_PROCESSING_TIME_MS: number
}

export interface HRVData {
  rmssd: number
  sdnn: number
  pnn50: number
  coherence: number
}

export interface PPGCallbacks {
  onBPMUpdate?: (bpm: number) => void
  onHRVUpdate?: (hrv: HRVData) => void
  onSignalQuality?: (quality: number) => void
  onBeat?: (data: { bpm: number; timestamp: number; beatNumber: number }) => void
  onCalibrated?: (info: { bpm: number; beats: number; quality: number }) => void
  onError?: (error: { code: string; message: string; error?: unknown }) => void
  onStateChange?: (state: { from: PPGState; to: PPGState }) => void
  onFingerDetected?: (detected: boolean) => void
}

// ═══════════════════════════════════════════════════════════════
// Breath Audio Analyzer Types
// ═══════════════════════════════════════════════════════════════

export interface BreathAudioConfig {
  SAMPLE_RATE: number
  FFT_SIZE: number
  SMOOTHING_TIME_CONSTANT: number
  BREATH_FREQ_MIN: number
  BREATH_FREQ_MAX: number
  BREATH_AMPLITUDE_THRESHOLD: number
  ANALYSIS_INTERVAL_MS: number
  // Heart rate detection via audio
  HR_FREQ_MIN: number
  HR_FREQ_MAX: number
  HR_AMPLITUDE_THRESHOLD: number
}

export interface BreathDetectionResult {
  detected: boolean
  rate: number          // respiraciones/min
  amplitude: number
  frequency: number     // Hz
}

export interface BreathAudioCallbacks {
  onBreathDetected?: (data: { rate: number; amplitude: number; timestamp: number }) => void
  onHeartRateEstimate?: (data: { bpm: number; confidence: number; timestamp: number }) => void
  onError?: (error: { code: string; message: string; error?: unknown }) => void
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

export function patternFromRow(row: {
  id: string
  user_id: string
  heart_rate: number | null
  breath_rate: number | null
  variability: number | null
  location: UserLocation | null
  created_at: string
  expires_at: string
}): ActivePattern {
  return {
    id: row.id,
    userId: row.user_id,
    heartRate: row.heart_rate ?? 0,
    breathRate: row.breath_rate ?? 0,
    variability: row.variability ?? 0,
    location: row.location ?? { lat: 0, lng: 0 },
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}

export function sessionFromRow(row: {
  id: string
  session_code: string
  user1_id: string
  user2_id: string | null
  created_at: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  avg_sync_percentage: number | null
  sync_data: SyncDataPoint[] | null
}): SyncSession {
  return {
    id: row.id,
    sessionCode: row.session_code,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    avgSyncPercentage: row.avg_sync_percentage,
    syncData: row.sync_data ?? [],
  }
}
