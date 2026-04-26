// ═══════════════════════════════════════════════════════════════
// MinDeploy — PPG Monitor (Fixed)
// Detección de pulso cardíaco mediante fotopletismografía (PPG)
// ═══════════════════════════════════════════════════════════════

import type { PPGConfig, PPGCallbacks, PPGState, HRVData } from '@/lib/types/breath-pattern'

const DEFAULT_CONFIG: PPGConfig = {
    SAMPLE_RATE: 30,
    HISTORY_SIZE: 256,
    SMOOTH_WINDOW: 5,
    MIN_BPM: 40,
    MAX_BPM: 180,
    MIN_PEAK_DISTANCE_MS: 333,
    MAX_PEAK_DISTANCE_MS: 1500,
    MIN_SIGNAL_STRENGTH: 5,
    SATURATION_THRESHOLD: 240,
    MIN_BRIGHTNESS: 30,
    SIGNAL_LOSS_TIMEOUT_MS: 5000,
    PEAK_THRESHOLD_MULTIPLIER: 0.6,
    VALLEY_THRESHOLD_MULTIPLIER: 0.85,
    LOCAL_WINDOW_SIZE: 9,
    CONSISTENCY_WINDOW: 8,
    CALIBRATION_BEATS: 5,
    OUTLIER_THRESHOLD: 0.35,
    TORCH_ENABLED: true,
    CANVAS_SIZE: 80,
    REGION_CENTER_RATIO: 0.8,
    MAX_PROCESSING_TIME_MS: 33,
}

const noop = () => { }

export class PPGMonitor {
    private config: PPGConfig
    private callbacks: Required<PPGCallbacks>

    private state: PPGState = 'IDLE'
    private isRunning = false

    // DOM / Camera
    private videoElement: HTMLVideoElement | null = null
    private canvasElement: HTMLCanvasElement | null = null
    private canvasContext: CanvasRenderingContext2D | null = null
    private mediaStream: MediaStream | null = null
    private videoTrack: MediaStreamTrack | null = null
    private animationFrameId: number | null = null

    // Signal buffers
    private rawSignal: number[] = []
    private filteredSignal: number[] = []
    private timestamps: number[] = []
    private peakIndices: number[] = []
    private valleyIndices: number[] = []

    // HR metrics
    private rrIntervals: number[] = []
    currentBPM = 0
    private lastValidBPM = 0
    signalQuality = 0
    private lastPeakTime = 0
    beatCount = 0

    // FIX #4/#5: Track last processed peak to avoid duplicate RR intervals
    private lastProcessedPeakIdx = -1

    // FIX #7: Finger detection state
    private fingerDetected = false
    private lastFingerState = false

    // HRV
    hrv: HRVData = { rmssd: 0, sdnn: 0, pnn50: 0, coherence: 0 }

    // Timing
    private startTime = 0
    private lastFrameTime = 0
    private processingTimes: number[] = []

    // Calibration
    isCalibrated = false
    private calibrationBeats = 0

    // Bandpass filter state (IIR)
    private bpX: number[] = [0, 0, 0]
    private bpY: number[] = [0, 0, 0]

    constructor(config: Partial<PPGConfig> = {}, callbacks: PPGCallbacks = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.callbacks = {
            onBPMUpdate: callbacks.onBPMUpdate ?? noop,
            onHRVUpdate: callbacks.onHRVUpdate ?? noop,
            onSignalQuality: callbacks.onSignalQuality ?? noop,
            onBeat: callbacks.onBeat ?? noop,
            onCalibrated: callbacks.onCalibrated ?? noop,
            onError: callbacks.onError ?? ((err) => console.error('[PPG]', err)),
            onStateChange: callbacks.onStateChange ?? noop,
            onFingerDetected: callbacks.onFingerDetected ?? noop,
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════

    async start(): Promise<void> {
        try {
            this.setState('INITIALIZING')
            this.log('Iniciando PPG Monitor...')

            this.createDOMElements()
            await this.initCamera()
            this.resetBuffers()

            this.isRunning = true
            this.startTime = Date.now()
            // FIX #1: Initialize lastPeakTime to now so first peak can be detected
            this.lastPeakTime = Date.now()
            this.setState('CALIBRATING')
            this.processFrame()

            this.log('PPG Monitor iniciado correctamente')
        } catch (error) {
            this.setState('ERROR')
            const err = error as Error
            this.callbacks.onError({ code: 'INITIALIZATION_ERROR', message: err.message, error })
            throw error
        }
    }

    stop(): void {
        this.log('Deteniendo PPG Monitor...')
        this.isRunning = false

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }

        this.stopCamera()
        this.cleanupDOMElements()
        this.setState('IDLE')
    }

    pause(): void {
        if (!this.isRunning) return
        this.isRunning = false
        this.setState('PAUSED')
    }

    resume(): void {
        if (this.state !== 'PAUSED') return
        this.isRunning = true
        this.setState('MONITORING')
        this.processFrame()
    }

    recalibrate(): void {
        this.resetBuffers()
        this.isCalibrated = false
        this.calibrationBeats = 0
        this.lastPeakTime = Date.now()
        this.setState('CALIBRATING')
    }

    getStatus() {
        return {
            state: this.state,
            isRunning: this.isRunning,
            isCalibrated: this.isCalibrated,
            bpm: this.currentBPM,
            signalQuality: this.signalQuality,
            beatCount: this.beatCount,
            hrv: { ...this.hrv },
            uptime: Date.now() - this.startTime,
        }
    }

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    private createDOMElements(): void {
        this.videoElement = document.createElement('video')
        this.videoElement.setAttribute('playsinline', '')
        this.videoElement.setAttribute('muted', '')
        this.videoElement.muted = true
        this.videoElement.style.display = 'none'
        document.body.appendChild(this.videoElement)

        this.canvasElement = document.createElement('canvas')
        this.canvasElement.width = this.config.CANVAS_SIZE
        this.canvasElement.height = this.config.CANVAS_SIZE
        this.canvasElement.style.display = 'none'
        document.body.appendChild(this.canvasElement)

        this.canvasContext = this.canvasElement.getContext('2d', { willReadFrequently: true })
    }

    private cleanupDOMElements(): void {
        if (this.videoElement) { this.videoElement.remove(); this.videoElement = null }
        if (this.canvasElement) { this.canvasElement.remove(); this.canvasElement = null }
        this.canvasContext = null
    }

    private async initCamera(): Promise<void> {
        const constraints: MediaStreamConstraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 320 },
                height: { ideal: 240 },
            },
        }

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
            this.videoTrack = this.mediaStream.getVideoTracks()[0]

            this.videoElement!.srcObject = this.mediaStream
            await this.videoElement!.play()

            if (this.config.TORCH_ENABLED) {
                await this.enableTorch(true)
            }
        } catch (error) {
            const err = error as DOMException
            let userMessage = 'Error al acceder a la cámara'
            if (err.name === 'NotAllowedError') userMessage = 'Permiso de cámara denegado. Por favor habilítalo en la configuración del navegador.'
            else if (err.name === 'NotFoundError') userMessage = 'No se encontró cámara trasera'
            else if (err.name === 'NotReadableError') userMessage = 'Cámara en uso por otra aplicación'
            throw new Error(userMessage)
        }
    }

    private async enableTorch(enabled: boolean): Promise<void> {
        try {
            if (!this.videoTrack) return
            const capabilities = this.videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
            if ('torch' in capabilities) {
                await this.videoTrack.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] })
                this.log(`Flash ${enabled ? 'encendido' : 'apagado'}`)
            }
        } catch {
            // Flash not available — silent
        }
    }

    private stopCamera(): void {
        if (this.videoTrack) {
            this.videoTrack.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] }).catch(() => { })
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop())
            this.mediaStream = null
            this.videoTrack = null
        }
    }

    private resetBuffers(): void {
        this.rawSignal = []
        this.filteredSignal = []
        this.timestamps = []
        this.peakIndices = []
        this.valleyIndices = []
        this.rrIntervals = []
        this.lastPeakTime = Date.now()
        this.beatCount = 0
        this.calibrationBeats = 0
        this.lastProcessedPeakIdx = -1
        this.bpX = [0, 0, 0]
        this.bpY = [0, 0, 0]
        this.fingerDetected = false
        this.lastFingerState = false
    }

    // ═══════════════════════════════════════════════════════════
    // SIGNAL PROCESSING
    // ═══════════════════════════════════════════════════════════

    private processFrame = (): void => {
        if (!this.isRunning) return

        const startTime = performance.now()
        this.animationFrameId = requestAnimationFrame(this.processFrame)

        if (!this.mediaStream || !this.videoElement || this.videoElement.paused || this.videoElement.ended) return

        try {
            const size = this.config.CANVAS_SIZE
            this.canvasContext!.drawImage(this.videoElement, 0, 0, size, size)
            const imageData = this.canvasContext!.getImageData(0, 0, size, size)

            const { red: avgRed, green: avgGreen } = this.extractChannels(imageData)
            const timestamp = Date.now()

            // FIX #7: Finger detection — when finger covers camera+flash, red channel is very high
            const isFingerNow = avgRed > 80 && avgRed > avgGreen * 1.4
            if (isFingerNow !== this.lastFingerState) {
                this.fingerDetected = isFingerNow
                this.lastFingerState = isFingerNow
                this.callbacks.onFingerDetected(isFingerNow)
                if (!isFingerNow) {
                    this.log('Dedo no detectado sobre la cámara')
                } else {
                    this.log('Dedo detectado sobre la cámara')
                }
            }

            if (!this.fingerDetected) {
                this.callbacks.onSignalQuality(0)
                this.signalQuality = 0
                return
            }

            this.rawSignal.push(avgRed)
            this.timestamps.push(timestamp)

            if (this.rawSignal.length > this.config.HISTORY_SIZE) {
                this.rawSignal.shift()
                this.timestamps.shift()
            }

            if (this.rawSignal.length >= 30) {
                this.analyzeSignal()
            }

            this.trackProcessingTime(performance.now() - startTime)
        } catch {
            // Silently skip frame errors
        }
    }

    // FIX #6: Extract both red and green channels; use more of the image
    private extractChannels(imageData: ImageData): { red: number; green: number } {
        const data = imageData.data
        const size = this.config.CANVAS_SIZE
        const ratio = this.config.REGION_CENTER_RATIO // Now 0.8

        const start = Math.floor(size * (1 - ratio) / 2)
        const regionSize = Math.floor(size * ratio)

        let totalRed = 0
        let totalGreen = 0
        let pixelCount = 0

        for (let y = start; y < start + regionSize; y++) {
            for (let x = start; x < start + regionSize; x++) {
                const idx = (y * size + x) * 4
                totalRed += data[idx]
                totalGreen += data[idx + 1]
                pixelCount++
            }
        }

        return { red: totalRed / pixelCount, green: totalGreen / pixelCount }
    }

    private analyzeSignal(): void {
        // FIX #3 & #4: Use bandpass-filtered signal with proper adaptive peak detection
        this.filteredSignal = this.bandpassFilter(this.rawSignal)

        this.signalQuality = this.calculateSignalQuality(this.rawSignal)
        this.callbacks.onSignalQuality(this.signalQuality)

        if (this.signalQuality < 10) {
            this.checkSignalLoss()
            return
        }

        // FIX #3: Adaptive peak detection using stdDev threshold
        const detected = this.detectPeaksAdaptive(this.filteredSignal, this.timestamps)
        this.peakIndices = detected.peaks
        this.valleyIndices = detected.valleys

        // FIX #5: Only process NEW peaks (avoid duplicate RR intervals)
        const newPeaks: number[] = []
        for (const pi of this.peakIndices) {
            if (pi > this.lastProcessedPeakIdx) {
                newPeaks.push(pi)
            }
        }

        if (newPeaks.length > 0) {
            // Calculate new RR intervals from consecutive new peaks
            // Also include interval from last processed peak to first new peak
            const allRelevantPeaks = this.lastProcessedPeakIdx >= 0
                ? [this.lastProcessedPeakIdx, ...newPeaks]
                : newPeaks

            for (let i = 1; i < allRelevantPeaks.length; i++) {
                const interval = this.timestamps[allRelevantPeaks[i]] - this.timestamps[allRelevantPeaks[i - 1]]
                if (interval > this.config.MIN_PEAK_DISTANCE_MS && interval < this.config.MAX_PEAK_DISTANCE_MS) {
                    this.rrIntervals.push(interval)
                    // FIX #2: Increment beat count per actual new peak
                    this.beatCount++
                    this.callbacks.onBeat({ bpm: this.currentBPM, timestamp: Date.now(), beatNumber: this.beatCount })
                }
            }

            // Keep RR buffer capped
            if (this.rrIntervals.length > this.config.CONSISTENCY_WINDOW * 2) {
                this.rrIntervals = this.rrIntervals.slice(-this.config.CONSISTENCY_WINDOW * 2)
            }

            this.lastProcessedPeakIdx = newPeaks[newPeaks.length - 1]
        }

        // Calculate BPM from RR intervals
        if (this.rrIntervals.length >= 2) {
            const bpm = this.calculateBPMFromRR()
            if (bpm !== null) {
                const prevBPM = this.currentBPM
                this.currentBPM = bpm
                this.lastValidBPM = bpm

                if (Math.abs(this.currentBPM - prevBPM) >= 1) {
                    this.callbacks.onBPMUpdate(this.currentBPM)
                }

                if (this.rrIntervals.length >= 3) {
                    this.calculateHRV()
                    this.callbacks.onHRVUpdate(this.hrv)
                }

                this.checkCalibration()
            }
        }

        this.checkSignalLoss()
    }

    // FIX #4: Proper bandpass filter (IIR 2nd order, ~0.67-3.0 Hz for 40-180 BPM)
    // Butterworth bandpass coefficients for ~30fps sample rate
    private bandpassFilter(rawValues: number[]): number[] {
        const result: number[] = []

        // Simple DC removal + smoothing approach that works reliably
        // Step 1: Remove DC with running mean
        const windowLen = Math.min(rawValues.length, 90) // ~3 seconds at 30fps
        const dcRemoved: number[] = []
        for (let i = 0; i < rawValues.length; i++) {
            const start = Math.max(0, i - windowLen)
            const end = i + 1
            let sum = 0
            for (let j = start; j < end; j++) sum += rawValues[j]
            const localMean = sum / (end - start)
            dcRemoved.push(rawValues[i] - localMean)
        }

        // Step 2: Moving average (low-pass to remove high-freq noise)
        const w = this.config.SMOOTH_WINDOW
        const half = Math.floor(w / 2)
        for (let i = 0; i < dcRemoved.length; i++) {
            const s = Math.max(0, i - half)
            const e = Math.min(dcRemoved.length, i + half + 1)
            let sum = 0
            for (let j = s; j < e; j++) sum += dcRemoved[j]
            result.push(sum / (e - s))
        }

        return result
    }

    // FIX #3: Adaptive peak detection using standard deviation
    private detectPeaksAdaptive(signal: number[], timestamps: number[]): { peaks: number[]; valleys: number[] } {
        const peaks: number[] = []
        const valleys: number[] = []
        const w = this.config.LOCAL_WINDOW_SIZE

        if (signal.length < w * 2 + 1) return { peaks, valleys }

        // Calculate global stats for adaptive threshold
        const globalMean = signal.reduce((a, b) => a + b, 0) / signal.length
        const globalVariance = signal.reduce((s, v) => s + (v - globalMean) ** 2, 0) / signal.length
        const globalStdDev = Math.sqrt(globalVariance)

        // Threshold: a peak must be above k * stdDev from local mean
        const k = this.config.PEAK_THRESHOLD_MULTIPLIER // Now 0.6

        for (let i = w; i < signal.length - w; i++) {
            const current = signal[i]
            const prev = signal[i - 1]
            const next = signal[i + 1]

            // Local statistics
            const localWindow = signal.slice(i - w, i + w + 1)
            const localMean = localWindow.reduce((a, b) => a + b, 0) / localWindow.length

            // Peak: local maximum AND above threshold
            if (current > prev && current > next && current > localMean + k * globalStdDev) {
                // FIX #1: Check timing against lastPeakTime (now properly initialized)
                const timeSince = timestamps[i] - this.lastPeakTime
                if (timeSince > this.config.MIN_PEAK_DISTANCE_MS && timeSince < this.config.MAX_PEAK_DISTANCE_MS) {
                    peaks.push(i)
                    this.lastPeakTime = timestamps[i]
                } else if (timeSince >= this.config.MAX_PEAK_DISTANCE_MS) {
                    // If too much time has passed, accept this peak as a reset point
                    peaks.push(i)
                    this.lastPeakTime = timestamps[i]
                }
            }

            // Valley detection
            if (current < prev && current < next && current < localMean - k * globalStdDev) {
                valleys.push(i)
            }
        }

        return { peaks, valleys }
    }

    // FIX #5: Calculate BPM directly from accumulated RR intervals
    private calculateBPMFromRR(): number | null {
        if (this.rrIntervals.length < 2) return null

        const sorted = [...this.rrIntervals].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        const threshold = median * this.config.OUTLIER_THRESHOLD
        const filtered = this.rrIntervals.filter(v => Math.abs(v - median) < threshold)
        if (filtered.length === 0) return null

        const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length
        const bpm = 60000 / avg
        if (bpm < this.config.MIN_BPM || bpm > this.config.MAX_BPM) return null
        return Math.round(bpm)
    }

    private calculateSignalQuality(rawValues: number[]): number {
        if (rawValues.length < 10) return 0
        const recent = rawValues.slice(-30)
        const mean = recent.reduce((a, b) => a + b, 0) / recent.length
        if (mean < 15 || mean > 255) return 0

        const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length
        const stdDev = Math.sqrt(variance)

        let quality = 0
        if (stdDev >= 1.5) quality = Math.min(100, (stdDev / 12) * 100)
        if (stdDev > 60) quality *= 0.5

        return Math.round(quality)
    }

    private calculateHRV(): void {
        const intervals = this.rrIntervals
        const n = intervals.length
        if (n < 3) return

        let sumSqDiffs = 0
        let count50 = 0
        for (let i = 1; i < n; i++) {
            const diff = intervals[i] - intervals[i - 1]
            sumSqDiffs += diff * diff
            if (Math.abs(diff) > 50) count50++
        }
        this.hrv.rmssd = Math.sqrt(sumSqDiffs / (n - 1))

        const mean = intervals.reduce((a, b) => a + b, 0) / n
        const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / n
        this.hrv.sdnn = Math.sqrt(variance)
        this.hrv.pnn50 = (count50 / (n - 1)) * 100
        this.hrv.coherence = Math.max(0, Math.min(100, (1 - this.hrv.sdnn / mean) * 100))
    }

    private checkCalibration(): void {
        if (this.isCalibrated) return
        this.calibrationBeats++
        if (this.calibrationBeats >= this.config.CALIBRATION_BEATS) {
            this.isCalibrated = true
            this.setState('MONITORING')
            this.callbacks.onCalibrated({ bpm: this.currentBPM, beats: this.calibrationBeats, quality: this.signalQuality })
        }
    }

    private checkSignalLoss(): void {
        if (Date.now() - this.lastPeakTime > this.config.SIGNAL_LOSS_TIMEOUT_MS && this.currentBPM > 0) {
            this.currentBPM = 0
            this.callbacks.onBPMUpdate(0)
        }
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════

    private setState(newState: PPGState): void {
        const old = this.state
        this.state = newState
        this.callbacks.onStateChange({ from: old, to: newState })
    }

    private trackProcessingTime(time: number): void {
        this.processingTimes.push(time)
        if (this.processingTimes.length > 30) this.processingTimes.shift()
    }

    private log(msg: string): void {
        console.log(`[PPGMonitor] ${msg}`)
    }
}
