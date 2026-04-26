// ═══════════════════════════════════════════════════════════════
// MinDeploy — Breath Audio Analyzer (TypeScript)
// Detección de respiración y estimación de ritmo cardíaco por micrófono
// usando Web Audio API
// ═══════════════════════════════════════════════════════════════

import type { BreathAudioConfig, BreathAudioCallbacks, BreathDetectionResult } from '@/lib/types/breath-pattern'

const DEFAULT_CONFIG: BreathAudioConfig = {
    SAMPLE_RATE: 16000,
    FFT_SIZE: 2048,
    SMOOTHING_TIME_CONSTANT: 0.8,
    BREATH_FREQ_MIN: 0.15,       // Hz (9 resp/min)
    BREATH_FREQ_MAX: 0.5,        // Hz (30 resp/min)
    BREATH_AMPLITUDE_THRESHOLD: 20,
    ANALYSIS_INTERVAL_MS: 1000,
    // Heart rate detection via audio (phonocardiography-like)
    HR_FREQ_MIN: 0.8,            // Hz (~48 BPM)
    HR_FREQ_MAX: 3.0,            // Hz (~180 BPM)
    HR_AMPLITUDE_THRESHOLD: 8,
}

const noop = () => { }

export class BreathAudioAnalyzer {
    private config: BreathAudioConfig
    private callbacks: Required<BreathAudioCallbacks>

    // Web Audio
    private audioContext: AudioContext | null = null
    private analyser: AnalyserNode | null = null
    private microphone: MediaStreamAudioSourceNode | null = null
    private mediaStream: MediaStream | null = null
    private frequencyData: Uint8Array<ArrayBuffer> | null = null
    private timeData: Uint8Array<ArrayBuffer> | null = null

    // State
    private isRunning = false
    private analysisIntervalId: ReturnType<typeof setInterval> | null = null

    // Amplitude history for heart rate estimation
    private amplitudeHistory: { timestamp: number; amplitude: number }[] = []

    // Public metrics
    breathRate = 0
    breathAmplitude = 0
    heartRateEstimate = 0

    constructor(config: Partial<BreathAudioConfig> = {}, callbacks: BreathAudioCallbacks = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.callbacks = {
            onBreathDetected: callbacks.onBreathDetected ?? noop,
            onHeartRateEstimate: callbacks.onHeartRateEstimate ?? noop,
            onError: callbacks.onError ?? ((err) => console.error('[BreathAudio]', err)),
        }
    }

    async start(): Promise<void> {
        try {
            // Init AudioContext
            this.audioContext = new AudioContext({ sampleRate: this.config.SAMPLE_RATE })
            if (this.audioContext.state === 'suspended') await this.audioContext.resume()

            // Solicitar micrófono
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            })

            this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream)

            // Setup analyzer
            this.analyser = this.audioContext.createAnalyser()
            this.analyser.fftSize = this.config.FFT_SIZE
            this.analyser.smoothingTimeConstant = this.config.SMOOTHING_TIME_CONSTANT
            this.microphone.connect(this.analyser)

            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
            this.timeData = new Uint8Array(this.analyser.fftSize)

            // Start loop
            this.isRunning = true
            this.analysisIntervalId = setInterval(() => {
                if (this.isRunning) this.analyze()
            }, this.config.ANALYSIS_INTERVAL_MS)

            console.log('[BreathAudioAnalyzer] Iniciado con detección de HR')
        } catch (error) {
            const err = error as Error
            this.callbacks.onError({ code: 'MIC_INIT_ERROR', message: err.message, error })
            throw error
        }
    }

    stop(): void {
        this.isRunning = false

        if (this.analysisIntervalId) {
            clearInterval(this.analysisIntervalId)
            this.analysisIntervalId = null
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop())
            this.mediaStream = null
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
        }

        this.audioContext = null
        this.analyser = null
        this.microphone = null
        this.amplitudeHistory = []
        console.log('[BreathAudioAnalyzer] Detenido')
    }

    private analyze(): void {
        if (!this.analyser || !this.frequencyData || !this.audioContext || !this.timeData) return

        this.analyser.getByteFrequencyData(this.frequencyData)
        this.analyser.getByteTimeDomainData(this.timeData)

        // Breath detection (low-frequency analysis)
        const breathResult = this.detectBreathing()
        this.breathRate = breathResult.rate
        this.breathAmplitude = breathResult.amplitude

        if (breathResult.detected) {
            this.callbacks.onBreathDetected({
                rate: breathResult.rate,
                amplitude: breathResult.amplitude,
                timestamp: Date.now(),
            })
        }

        // Heart rate estimation (time-domain amplitude peaks)
        const hrEstimate = this.estimateHeartRate()
        if (hrEstimate > 0) {
            this.heartRateEstimate = hrEstimate
            this.callbacks.onHeartRateEstimate({
                bpm: hrEstimate,
                confidence: this.calculateHRConfidence(),
                timestamp: Date.now(),
            })
        }
    }

    private detectBreathing(): BreathDetectionResult {
        const binCount = this.analyser!.frequencyBinCount
        const sampleRate = this.audioContext!.sampleRate
        const binWidth = sampleRate / this.analyser!.fftSize

        const minBin = Math.floor(this.config.BREATH_FREQ_MIN / binWidth)
        const maxBin = Math.min(Math.ceil(this.config.BREATH_FREQ_MAX / binWidth), binCount - 1)

        let peakBin = minBin
        let peakValue = this.frequencyData![minBin]

        for (let i = minBin; i <= maxBin; i++) {
            if (this.frequencyData![i] > peakValue) {
                peakValue = this.frequencyData![i]
                peakBin = i
            }
        }

        const peakFreq = peakBin * binWidth
        const breathsPerMin = peakFreq * 60
        const detected = peakValue > this.config.BREATH_AMPLITUDE_THRESHOLD

        return {
            detected,
            rate: Math.round(breathsPerMin),
            amplitude: peakValue,
            frequency: peakFreq,
        }
    }

    /**
     * Heart rate estimation via audio amplitude envelope analysis.
     * Tracks the overall amplitude over time and count peaks (heartbeat sounds).
     * Works best when the mic is near the chest.
     */
    private estimateHeartRate(): number {
        if (!this.timeData) return 0

        // Calculate RMS amplitude of current frame
        let sumSq = 0
        for (let i = 0; i < this.timeData.length; i++) {
            const normalized = (this.timeData[i] - 128) / 128
            sumSq += normalized * normalized
        }
        const rms = Math.sqrt(sumSq / this.timeData.length) * 100

        const now = Date.now()
        this.amplitudeHistory.push({ timestamp: now, amplitude: rms })

        // Keep 15 seconds of history
        const windowMs = 15000
        this.amplitudeHistory = this.amplitudeHistory.filter(p => now - p.timestamp < windowMs)

        if (this.amplitudeHistory.length < 5) return 0

        // Find peaks in amplitude history (heartbeat-like impulses)
        const peaks = this.findAmplitudePeaks()

        if (peaks.length < 2) return 0

        // Calculate average interval between peaks
        const intervals: number[] = []
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i].timestamp - peaks[i - 1].timestamp)
        }

        // Filter outliers
        const sorted = [...intervals].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        const filtered = intervals.filter(v => Math.abs(v - median) < median * 0.4)

        if (filtered.length === 0) return 0

        const avgInterval = filtered.reduce((a, b) => a + b, 0) / filtered.length
        const bpm = 60000 / avgInterval

        // Sanity check
        if (bpm < 40 || bpm > 180) return 0
        return Math.round(bpm)
    }

    private findAmplitudePeaks(): { timestamp: number; amplitude: number }[] {
        const history = this.amplitudeHistory
        const peaks: typeof history = []

        if (history.length < 3) return peaks

        // Calculate mean and threshold
        const mean = history.reduce((s, p) => s + p.amplitude, 0) / history.length
        const threshold = mean * 1.3

        for (let i = 1; i < history.length - 1; i++) {
            const prev = history[i - 1].amplitude
            const curr = history[i].amplitude
            const next = history[i + 1].amplitude

            if (curr > prev && curr > next && curr > threshold) {
                // Minimum distance between peaks: 333ms (180 BPM max)
                const lastPeak = peaks[peaks.length - 1]
                if (!lastPeak || history[i].timestamp - lastPeak.timestamp > 333) {
                    peaks.push(history[i])
                }
            }
        }

        return peaks
    }

    private calculateHRConfidence(): number {
        const peakCount = this.findAmplitudePeaks().length
        // More peaks = higher confidence, max at ~10 peaks
        return Math.min(100, peakCount * 12)
    }
}
