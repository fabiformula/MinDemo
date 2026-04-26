/**
 * ═══════════════════════════════════════════════════════════════════════
 * PPG MONITOR MODULE - Photoplethysmography Heart Rate Detection
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Módulo profesional para detección de pulso cardíaco mediante cámara.
 * Diseñado para ser reutilizable en múltiples contextos:
 * - Sleep tracking
 * - Stress monitoring
 * - Group synchronization
 * - Meditation guidance
 * 
 * @version 2.0.0
 * @author Tu App
 * @license Proprietary
 */

class PPGMonitor {
  /**
   * Configuración por defecto (puede ser sobreescrita)
   */
  static CONFIG = {
    // Procesamiento de señal
    SAMPLE_RATE: 30,              // Hz - frames por segundo objetivo
    HISTORY_SIZE: 256,            // Muestras guardadas (~8.5s @ 30fps)
    SMOOTH_WINDOW: 3,             // Ventana de promedio móvil
    
    // Constrains de frecuencia cardíaca
    MIN_BPM: 40,                  // BPM mínimo válido
    MAX_BPM: 180,                 // BPM máximo válido
    MIN_PEAK_DISTANCE_MS: 333,    // 180 BPM = 333ms entre picos
    MAX_PEAK_DISTANCE_MS: 1500,   // 40 BPM = 1500ms entre picos
    
    // Calidad de señal
    MIN_SIGNAL_STRENGTH: 5,       // Varianza mínima del canal rojo
    SATURATION_THRESHOLD: 240,    // Detección de sobre-exposición
    MIN_BRIGHTNESS: 30,           // Umbral de oscuridad
    SIGNAL_LOSS_TIMEOUT_MS: 5000, // Timeout sin latido
    
    // Detección de picos
    PEAK_THRESHOLD_MULTIPLIER: 1.3,    // Pico = 130% de media local
    VALLEY_THRESHOLD_MULTIPLIER: 0.85, // Valle = 85% de media local
    LOCAL_WINDOW_SIZE: 15,             // Ventana para estadísticas locales
    
    // Validación y estabilización
    CONSISTENCY_WINDOW: 5,        // Latidos para promediar BPM
    CALIBRATION_BEATS: 8,         // Latidos necesarios para calibración
    OUTLIER_THRESHOLD: 0.3,       // 30% de desviación = outlier
    
    // Cámara
    TORCH_ENABLED: true,          // Intentar activar flash
    CANVAS_SIZE: 80,              // Tamaño del canvas de procesamiento
    REGION_CENTER_RATIO: 0.5,     // Usar centro del frame (50%)
    
    // Performance
    MAX_PROCESSING_TIME_MS: 33,   // Max 33ms por frame (30fps)
  };

  /**
   * Constructor
   * @param {Object} config - Configuración personalizada (opcional)
   * @param {Object} callbacks - Callbacks para eventos
   */
  constructor(config = {}, callbacks = {}) {
    // Merge configuración
    this.config = { ...PPGMonitor.CONFIG, ...config };
    
    // Callbacks
    this.callbacks = {
      onBPMUpdate: callbacks.onBPMUpdate || (() => {}),
      onHRVUpdate: callbacks.onHRVUpdate || (() => {}),
      onSignalQuality: callbacks.onSignalQuality || (() => {}),
      onBeat: callbacks.onBeat || (() => {}),
      onCalibrated: callbacks.onCalibrated || (() => {}),
      onError: callbacks.onError || ((err) => console.error(err)),
      onStateChange: callbacks.onStateChange || (() => {}),
    };
    
    // Estado
    this.state = 'IDLE'; // IDLE, INITIALIZING, CALIBRATING, MONITORING, PAUSED, ERROR
    this.isRunning = false;
    
    // Elementos DOM (se crean internamente)
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasContext = null;
    
    // Stream de cámara
    this.mediaStream = null;
    this.videoTrack = null;
    this.animationFrameId = null;
    
    // Buffers de señal
    this.rawSignal = [];
    this.filteredSignal = [];
    this.timestamps = [];
    this.peakIndices = [];
    this.valleyIndices = [];
    
    // Métricas de frecuencia cardíaca
    this.rrIntervals = [];           // R-R intervals en ms
    this.currentBPM = 0;
    this.lastValidBPM = 0;
    this.signalQuality = 0;
    this.lastPeakTime = 0;
    this.beatCount = 0;
    
    // Métricas HRV (Heart Rate Variability)
    this.hrv = {
      rmssd: 0,      // Root Mean Square of Successive Differences
      sdnn: 0,       // Standard Deviation of NN intervals
      pnn50: 0,      // % of intervals differing >50ms
      coherence: 0   // Coherencia cardíaca (0-100)
    };
    
    // Timing
    this.startTime = 0;
    this.lastFrameTime = 0;
    this.processingTimes = [];
    
    // Calibración
    this.isCalibrated = false;
    this.calibrationBeats = 0;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PÚBLICOS
   * ═══════════════════════════════════════════════════════════════════════
   */

  /**
   * Inicializar y comenzar monitoreo
   * @returns {Promise<void>}
   */
  async start() {
    try {
      this._setState('INITIALIZING');
      this._log('Iniciando PPG Monitor...');
      
      // Crear elementos DOM
      this._createDOMElements();
      
      // Iniciar cámara
      await this._initCamera();
      
      // Resetear buffers
      this._resetBuffers();
      
      // Comenzar procesamiento
      this.isRunning = true;
      this.startTime = Date.now();
      this._setState('CALIBRATING');
      this._processFrame();
      
      this._log('PPG Monitor iniciado correctamente');
      
    } catch (error) {
      this._setState('ERROR');
      this.callbacks.onError({
        code: 'INITIALIZATION_ERROR',
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Detener monitoreo y liberar recursos
   */
  stop() {
    this._log('Deteniendo PPG Monitor...');
    
    this.isRunning = false;
    
    // Cancelar animación
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Detener cámara
    this._stopCamera();
    
    // Limpiar DOM
    this._cleanupDOMElements();
    
    this._setState('IDLE');
    this._log('PPG Monitor detenido');
  }

  /**
   * Pausar temporalmente (mantiene recursos)
   */
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this._setState('PAUSED');
    this._log('PPG Monitor pausado');
  }

  /**
   * Reanudar desde pausa
   */
  resume() {
    if (this.state !== 'PAUSED') return;
    
    this.isRunning = true;
    this._setState('MONITORING');
    this._processFrame();
    this._log('PPG Monitor reanudado');
  }

  /**
   * Recalibrar (útil si cambia condiciones de luz, posición, etc.)
   */
  recalibrate() {
    this._log('Iniciando recalibración...');
    this._resetBuffers();
    this.isCalibrated = false;
    this.calibrationBeats = 0;
    this._setState('CALIBRATING');
  }

  /**
   * Obtener estado actual
   * @returns {Object}
   */
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
      averageProcessingTime: this._getAverageProcessingTime()
    };
  }

  /**
   * Obtener datos históricos (para gráficos, análisis)
   * @returns {Object}
   */
  getHistoricalData() {
    return {
      rawSignal: [...this.rawSignal],
      filteredSignal: [...this.filteredSignal],
      timestamps: [...this.timestamps],
      peakIndices: [...this.peakIndices],
      rrIntervals: [...this.rrIntervals]
    };
  }

  /**
   * Exportar sesión completa (para análisis offline)
   * @returns {Object}
   */
  exportSession() {
    return {
      metadata: {
        startTime: this.startTime,
        duration: Date.now() - this.startTime,
        totalBeats: this.beatCount,
        config: this.config
      },
      metrics: {
        bpm: this.currentBPM,
        hrv: { ...this.hrv },
        signalQuality: this.signalQuality
      },
      rawData: this.getHistoricalData()
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - INICIALIZACIÓN
   * ═══════════════════════════════════════════════════════════════════════
   */

  _createDOMElements() {
    // Video (hidden)
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('playsinline', '');
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);
    
    // Canvas (hidden)
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = this.config.CANVAS_SIZE;
    this.canvasElement.height = this.config.CANVAS_SIZE;
    this.canvasElement.style.display = 'none';
    document.body.appendChild(this.canvasElement);
    
    this.canvasContext = this.canvasElement.getContext('2d', { 
      willReadFrequently: true 
    });
  }

  _cleanupDOMElements() {
    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }
    if (this.canvasElement) {
      this.canvasElement.remove();
      this.canvasElement = null;
    }
    this.canvasContext = null;
  }

  async _initCamera() {
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    };
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoTrack = this.mediaStream.getVideoTracks()[0];
      
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();
      
      // Intentar activar flash
      if (this.config.TORCH_ENABLED) {
        await this._enableTorch(true);
      }
      
      this._log('Cámara inicializada correctamente');
      
    } catch (error) {
      let userMessage = 'Error al acceder a la cámara';
      
      if (error.name === 'NotAllowedError') {
        userMessage = 'Permiso de cámara denegado';
      } else if (error.name === 'NotFoundError') {
        userMessage = 'No se encontró cámara trasera';
      } else if (error.name === 'NotReadableError') {
        userMessage = 'Cámara en uso por otra aplicación';
      }
      
      throw new Error(userMessage);
    }
  }

  async _enableTorch(enabled) {
    try {
      if (!this.videoTrack) return;
      
      const capabilities = this.videoTrack.getCapabilities();
      
      if ('torch' in capabilities) {
        await this.videoTrack.applyConstraints({
          advanced: [{ torch: enabled }]
        });
        this._log(`Flash ${enabled ? 'encendido' : 'apagado'}`);
      } else {
        this._log('Dispositivo sin soporte de flash');
      }
    } catch (error) {
      this._log('Error activando flash: ' + error.message);
    }
  }

  _stopCamera() {
    // Intentar apagar flash explícitamente antes de detener
    if (this.videoTrack) {
        this.videoTrack.applyConstraints({
            advanced: [{ torch: false }]
        }).catch(() => {}); // Ignorar error si falla
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
      this.videoTrack = null;
    }
  }

  _resetBuffers() {
    this.rawSignal = [];
    this.filteredSignal = [];
    this.timestamps = [];
    this.peakIndices = [];
    this.valleyIndices = [];
    this.rrIntervals = [];
    this.lastPeakTime = 0;
    this.beatCount = 0;
    this.calibrationBeats = 0;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - PROCESAMIENTO DE SEÑAL
   * ═══════════════════════════════════════════════════════════════════════
   */

  _processFrame() {
    if (!this.isRunning) return;
    
    const startTime = performance.now();
    
    this.animationFrameId = requestAnimationFrame(() => this._processFrame());
    
    // Validaciones
    if (!this.mediaStream || 
        this.videoElement.paused || 
        this.videoElement.ended) {
      return;
    }
    
    try {
      // Extraer frame de video
      const size = this.config.CANVAS_SIZE;
      this.canvasContext.drawImage(this.videoElement, 0, 0, size, size);
      const imageData = this.canvasContext.getImageData(0, 0, size, size);
      
      // Calcular promedio del canal rojo (región central)
      const avgRed = this._extractRedChannel(imageData);
      const timestamp = Date.now();
      
      // Agregar a buffers
      this.rawSignal.push(avgRed);
      this.timestamps.push(timestamp);
      
      // Mantener tamaño de buffer
      if (this.rawSignal.length > this.config.HISTORY_SIZE) {
        this.rawSignal.shift();
        this.timestamps.shift();
      }
      
      // Procesar si hay suficientes muestras
      if (this.rawSignal.length >= 30) {
        this._analyzeSignal();
      }
      
      // Tracking de performance
      const processingTime = performance.now() - startTime;
      this._trackProcessingTime(processingTime);
      
      // Advertir si procesamiento es muy lento
      if (processingTime > this.config.MAX_PROCESSING_TIME_MS) {
        // Silencio warning para no saturar consola
        // this._log(`⚠️ Procesamiento lento: ${processingTime.toFixed(1)}ms`);
      }
      
    } catch (error) {
      this._log('Error procesando frame: ' + error.message);
    }
  }

  _extractRedChannel(imageData) {
    const data = imageData.data;
    const size = this.config.CANVAS_SIZE;
    const ratio = this.config.REGION_CENTER_RATIO;
    
    // Calcular región central
    const startX = Math.floor(size * (1 - ratio) / 2);
    const startY = Math.floor(size * (1 - ratio) / 2);
    const regionSize = Math.floor(size * ratio);
    
    let totalRed = 0;
    let pixelCount = 0;
    
    for (let y = startY; y < startY + regionSize; y++) {
      for (let x = startX; x < startX + regionSize; x++) {
        const index = (y * size + x) * 4;
        totalRed += data[index]; // Canal rojo
        pixelCount++;
      }
    }
    
    return totalRed / pixelCount;
  }

  _analyzeSignal() {
    // 1. Preprocesar señal (filtrado)
    this.filteredSignal = this._preprocessSignal(this.rawSignal);
    
    // 2. Calcular calidad de señal
    this.signalQuality = this._calculateSignalQuality(this.rawSignal);
    this.callbacks.onSignalQuality(this.signalQuality);
    
    // 3. Si calidad baja, no continuar (umbral bajado a 15)
    if (this.signalQuality < 15) {
      this._checkSignalLoss();
      return;
    }
    
    // 4. Detectar picos y valles
    const detected = this._detectPeaksAndValleys(
      this.filteredSignal, 
      this.timestamps
    );
    this.peakIndices = detected.peaks;
    this.valleyIndices = detected.valleys;
    
    // 5. Calcular BPM de picos recientes
    const recentPeaks = this.peakIndices.slice(-this.config.CONSISTENCY_WINDOW);
    const bpm = this._calculateBPM(recentPeaks, this.timestamps);
    
    if (bpm !== null) {
      const prevBPM = this.currentBPM;
      this.currentBPM = bpm;
      this.lastValidBPM = bpm;
      this.beatCount++;
      
      // Callback de latido
      this.callbacks.onBeat({
        bpm: this.currentBPM,
        timestamp: Date.now(),
        beatNumber: this.beatCount
      });
      
      // Callback de actualización BPM (solo si cambió significativamente)
      if (Math.abs(this.currentBPM - prevBPM) >= 1) {
        this.callbacks.onBPMUpdate(this.currentBPM);
      }
      
      // Calcular HRV
      if (this.rrIntervals.length >= 3) {
        this._calculateHRV();
        this.callbacks.onHRVUpdate(this.hrv);
      }
      
      // Verificar calibración
      this._checkCalibration();
    }
    
    // 6. Verificar pérdida de señal
    this._checkSignalLoss();
  }

  _preprocessSignal(rawValues) {
    if (rawValues.length < this.config.SMOOTH_WINDOW) {
      return rawValues;
    }
    
    // Paso 1: Remover componente DC (tendencia lenta)
    const dcRemoved = this._removeDC(rawValues);
    
    // Paso 2: Promedio móvil (suavizado)
    const smoothed = this._movingAverage(dcRemoved, this.config.SMOOTH_WINDOW);
    
    return smoothed;
  }

  _removeDC(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.map(v => v - mean);
  }

  _movingAverage(values, windowSize) {
    const result = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(values.length, i + halfWindow + 1);
      const window = values.slice(start, end);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      result.push(avg);
    }
    
    return result;
  }

  _calculateSignalQuality(rawValues) {
    if (rawValues.length < 10) return 0;
    
    const recent = rawValues.slice(-30);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    // Verificar brillo (bajado a 15 para soportar dedos oscuros o poca luz ambiente)
    if (mean < 15) return 0;
    
    // Verificar saturación (subido a 255 para permitir flash intenso)
    if (mean > 255) return 0;
    
    // Calcular varianza (fuerza de señal)
    const variance = recent.reduce((sum, val) => {
      return sum + Math.pow(val - mean, 2);
    }, 0) / recent.length;
    
    const stdDev = Math.sqrt(variance);
    
    // Calidad: 0-100
    let quality = 0;
    // Bajado umbral de desviación mínima a 2
    if (stdDev >= 2) {
      // Escalado mejorado: stdDev 20 ya es 100%
      quality = Math.min(100, (stdDev / 15) * 100);
    }
    
    // Penalizar varianza excesiva (movimiento brusco) - subido umbral a 60
    if (stdDev > 60) {
      quality = quality * 0.5;
    }
    
    return Math.round(quality);
  }

  _detectPeaksAndValleys(signal, timestamps) {
    const peaks = [];
    const valleys = [];
    const windowSize = this.config.LOCAL_WINDOW_SIZE;
    
    for (let i = windowSize; i < signal.length - windowSize; i++) {
      const window = signal.slice(i - windowSize, i + windowSize);
      const localMean = window.reduce((a, b) => a + b, 0) / window.length;
      
      const current = signal[i];
      const prev = signal[i - 1];
      const next = signal[i + 1];
      
      // Detección de pico
      if (current > prev && current > next) {
        if (current > localMean * this.config.PEAK_THRESHOLD_MULTIPLIER) {
          const timeSinceLastPeak = timestamps[i] - this.lastPeakTime;
          
          if (timeSinceLastPeak > this.config.MIN_PEAK_DISTANCE_MS && 
              timeSinceLastPeak < this.config.MAX_PEAK_DISTANCE_MS) {
            peaks.push(i);
            this.lastPeakTime = timestamps[i];
          }
        }
      }
      
      // Detección de valle
      if (current < prev && current < next) {
        if (current < localMean * this.config.VALLEY_THRESHOLD_MULTIPLIER) {
          valleys.push(i);
        }
      }
    }
    
    return { peaks, valleys };
  }

  _calculateBPM(peaks, timestamps) {
    if (peaks.length < 2) return null;
    
    // Calcular intervalos entre picos consecutivos
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = timestamps[peaks[i]] - timestamps[peaks[i - 1]];
      intervals.push(interval);
    }
    
    // Agregar a buffer RR
    this.rrIntervals.push(...intervals);
    if (this.rrIntervals.length > this.config.CONSISTENCY_WINDOW) {
      this.rrIntervals = this.rrIntervals.slice(-this.config.CONSISTENCY_WINDOW);
    }
    
    if (this.rrIntervals.length < 2) return null;
    
    // Filtrar outliers (mediana)
    const sorted = [...this.rrIntervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const threshold = median * this.config.OUTLIER_THRESHOLD;
    
    const filtered = this.rrIntervals.filter(val => {
      return Math.abs(val - median) < threshold;
    });
    
    if (filtered.length === 0) return null;
    
    // Calcular BPM promedio
    const avgInterval = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    const bpm = 60000 / avgInterval;
    
    // Validar rango
    if (bpm < this.config.MIN_BPM || bpm > this.config.MAX_BPM) {
      return null;
    }
    
    return Math.round(bpm);
  }

  _calculateHRV() {
    if (this.rrIntervals.length < 3) return;
    
    const intervals = this.rrIntervals;
    const n = intervals.length;
    
    // RMSSD: Root Mean Square of Successive Differences
    let sumSquaredDiffs = 0;
    for (let i = 1; i < n; i++) {
      const diff = intervals[i] - intervals[i - 1];
      sumSquaredDiffs += diff * diff;
    }
    this.hrv.rmssd = Math.sqrt(sumSquaredDiffs / (n - 1));
    
    // SDNN: Standard Deviation of NN intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / n;
    const variance = intervals.reduce((sum, val) => {
      return sum + Math.pow(val - mean, 2);
    }, 0) / n;
    this.hrv.sdnn = Math.sqrt(variance);
    
    // pNN50: % of intervals differing by >50ms
    let count50 = 0;
    for (let i = 1; i < n; i++) {
      if (Math.abs(intervals[i] - intervals[i - 1]) > 50) {
        count50++;
      }
    }
    this.hrv.pnn50 = (count50 / (n - 1)) * 100;
    
    // Coherencia cardíaca (0-100)
    // Basado en regularidad de intervalos
    const cv = this.hrv.sdnn / mean; // Coeficiente de variación
    this.hrv.coherence = Math.max(0, Math.min(100, (1 - cv) * 100));
  }

  _checkCalibration() {
    if (this.isCalibrated) return;
    
    this.calibrationBeats++;
    
    if (this.calibrationBeats >= this.config.CALIBRATION_BEATS) {
      this.isCalibrated = true;
      this._setState('MONITORING');
      this.callbacks.onCalibrated({
        bpm: this.currentBPM,
        beats: this.calibrationBeats,
        quality: this.signalQuality
      });
      this._log(`✓ Calibrado: ${this.currentBPM} BPM`);
    }
  }

  _checkSignalLoss() {
    const timeSinceLastBeat = Date.now() - this.lastPeakTime;
    
    if (timeSinceLastBeat > this.config.SIGNAL_LOSS_TIMEOUT_MS) {
      if (this.currentBPM > 0) {
        this._log('Señal perdida');
        this.currentBPM = 0;
        this.callbacks.onBPMUpdate(0);
      }
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - UTILIDADES
   * ═══════════════════════════════════════════════════════════════════════
   */

  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.callbacks.onStateChange({ from: oldState, to: newState });
  }

  _trackProcessingTime(time) {
    this.processingTimes.push(time);
    if (this.processingTimes.length > 30) {
      this.processingTimes.shift();
    }
  }

  _getAverageProcessingTime() {
    if (this.processingTimes.length === 0) return 0;
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    return sum / this.processingTimes.length;
  }

  _log(message) {
    console.log(`[PPGMonitor] ${message}`);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXPORTAR MÓDULO
 * ═══════════════════════════════════════════════════════════════════════
 */

// CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PPGMonitor;
}

// ES6 Module
if (typeof exports !== 'undefined') {
  exports.PPGMonitor = PPGMonitor;
}

// Global (Browser)
if (typeof window !== 'undefined') {
  window.PPGMonitor = PPGMonitor;
}
