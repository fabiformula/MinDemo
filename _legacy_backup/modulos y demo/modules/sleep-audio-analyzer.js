/**
 * ═══════════════════════════════════════════════════════════════════════
 * SLEEP AUDIO ANALYZER MODULE - Deep Sleep Detection & Subliminal Audio
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Módulo profesional para:
 * - Detección de fases de sueño mediante análisis de respiración (audio)
 * - Reproducción de afirmaciones subliminales en sueño profundo
 * - Inducción de sueños lúcidos
 * - Procesamiento de traumas mediante EMDR auditivo
 * - Grabación y análisis de sesión completa
 * 
 * FASES DE SUEÑO DETECTADAS:
 * - AWAKE: Despierto
 * - DROWSY: Somnoliento (Theta 4-8Hz)
 * - LIGHT_SLEEP: Sueño ligero (Stage 1-2)
 * - DEEP_SLEEP: Sueño profundo (Delta 0.5-4Hz) ← AFIRMACIONES AQUÍ
 * - REM: Sueño REM (sueños) ← INDUCCIÓN LÚCIDA AQUÍ
 * 
 * @version 2.0.0
 * @author Tu App
 * @license Proprietary
 */

class SleepAudioAnalyzer {
  /**
   * Configuración por defecto
   */
  static CONFIG = {
    // Captura de audio
    SAMPLE_RATE: 16000,           // Hz - suficiente para respiración
    FFT_SIZE: 2048,               // Resolución FFT
    SMOOTHING_TIME_CONSTANT: 0.8, // Suavizado de análisis
    
    // Detección de respiración
    BREATH_FREQ_MIN: 0.15,        // Hz (9 respiraciones/min)
    BREATH_FREQ_MAX: 0.5,         // Hz (30 respiraciones/min)
    BREATH_AMPLITUDE_THRESHOLD: 20, // dB - mínimo detectable
    
    // Clasificación de fases
    AWAKE_BREATH_RATE: { min: 15, max: 25 },      // resp/min
    DROWSY_BREATH_RATE: { min: 12, max: 18 },     // resp/min
    LIGHT_SLEEP_BREATH_RATE: { min: 10, max: 15 }, // resp/min
    DEEP_SLEEP_BREATH_RATE: { min: 6, max: 12 },  // resp/min
    REM_BREATH_RATE: { min: 12, max: 20 },        // resp/min (irregular)
    
    // Tiempos de transición
    PHASE_CONFIRMATION_TIME: 120000,  // 2 min en misma fase para confirmar
    DEEP_SLEEP_MIN_DURATION: 300000,  // 5 min mínimo en delta para afirmaciones
    REM_DETECTION_WINDOW: 60000,      // 1 min ventana para detectar REM
    
    // Afirmaciones subliminales
    SUBLIMINAL_VOLUME: 0.05,          // Muy bajo (5%)
    SUBLIMINAL_FREQ_SHIFT: -200,      // Hz - pitch down (más subliminal)
    SUBLIMINAL_INTERVAL_MS: 30000,    // 30s entre afirmaciones
    SUBLIMINAL_DURATION_MS: 10000,    // 10s por afirmación
    
    // Inducción sueños lúcidos
    LUCID_TRIGGER_FREQ: 40,           // Hz - Gamma para awareness
    LUCID_TRIGGER_VOLUME: 0.1,        // 10% volumen
    LUCID_TRIGGER_DURATION: 5000,     // 5s pulso gamma
    LUCID_TRIGGER_INTERVAL: 300000,   // 5 min entre triggers
    
    // EMDR (Eye Movement Desensitization and Reprocessing)
    EMDR_ENABLED: false,              // Activar bajo demanda
    EMDR_FREQUENCY: 1.5,              // Hz - bilateral stimulation
    EMDR_TONE_LEFT: 250,              // Hz
    EMDR_TONE_RIGHT: 254,             // Hz (beat frequency = 4Hz Theta)
    
    // Grabación
    RECORDING_ENABLED: true,          // Grabar sesión completa
    RECORDING_FORMAT: 'webm',         // Formato de salida
    RECORDING_BITRATE: 32000,         // 32kbps (voz suficiente)
    
    // Performance
    ANALYSIS_INTERVAL_MS: 1000,       // Analizar cada 1s
  };

  /**
   * Constructor
   */
  constructor(config = {}, callbacks = {}) {
    this.config = { ...SleepAudioAnalyzer.CONFIG, ...config };
    
    this.callbacks = {
      onPhaseChange: callbacks.onPhaseChange || (() => {}),
      onBreathDetected: callbacks.onBreathDetected || (() => {}),
      onSubliminalPlayed: callbacks.onSubliminalPlayed || (() => {}),
      onLucidTrigger: callbacks.onLucidTrigger || (() => {}),
      onRecordingReady: callbacks.onRecordingReady || (() => {}),
      onError: callbacks.onError || ((err) => console.error(err)),
    };
    
    // Estado
    this.state = 'IDLE'; // IDLE, INITIALIZING, MONITORING, PAUSED
    this.isRunning = false;
    
    // Web Audio API
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.mediaStream = null;
    
    // Análisis
    this.frequencyData = null;
    this.timeDomainData = null;
    this.breathRate = 0;
    this.breathAmplitude = 0;
    
    // Fases de sueño
    this.currentPhase = 'AWAKE';
    this.phaseStartTime = 0;
    this.phaseDuration = 0;
    this.phaseHistory = [];
    
    // Subliminal audio
    this.subliminalQueue = [];
    this.lastSubliminalTime = 0;
    this.subliminalPlayer = null;
    
    // Lucid dreaming
    this.lastLucidTrigger = 0;
    this.lucidTriggersCount = 0;
    
    // EMDR
    this.emdrOscillators = null;
    
    // Grabación
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStartTime = 0;
    
    // Timers
    this.analysisIntervalId = null;
    
    // Métricas
    this.sessionStartTime = 0;
    this.totalBreaths = 0;
    this.deepSleepDuration = 0;
    this.remDuration = 0;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PÚBLICOS
   * ═══════════════════════════════════════════════════════════════════════
   */

  /**
   * Iniciar análisis de audio
   */
  async start() {
    try {
      this.state = 'INITIALIZING';
      this._log('Iniciando Sleep Audio Analyzer...');
      
      // Inicializar Web Audio API
      await this._initAudioContext();
      
      // Solicitar acceso al micrófono
      await this._initMicrophone();
      
      // Setup análisis
      this._setupAnalyzer();
      
      // Iniciar grabación si está habilitado
      if (this.config.RECORDING_ENABLED) {
        this._startRecording();
      }
      
      // Iniciar análisis periódico
      this.isRunning = true;
      this.state = 'MONITORING';
      this.sessionStartTime = Date.now();
      this.phaseStartTime = Date.now();
      
      this._startAnalysisLoop();
      
      this._log('Sleep Audio Analyzer iniciado');
      
    } catch (error) {
      this.state = 'IDLE';
      this.callbacks.onError({
        code: 'INITIALIZATION_ERROR',
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Detener análisis
   */
  stop() {
    this._log('Deteniendo Sleep Audio Analyzer...');
    
    this.isRunning = false;
    
    // Detener análisis
    if (this.analysisIntervalId) {
      clearInterval(this.analysisIntervalId);
      this.analysisIntervalId = null;
    }
    
    // Detener grabación
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Detener EMDR si está activo
    this._stopEMDR();
    
    // Cerrar micrófono
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Cerrar audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.state = 'IDLE';
    this._log('Sleep Audio Analyzer detenido');
  }

  /**
   * Cargar afirmaciones subliminales
   * @param {Array<string>} affirmations - Lista de textos o URLs de audio
   */
  loadAffirmations(affirmations) {
    this.subliminalQueue = affirmations.map((aff, index) => ({
      id: `aff_${index}`,
      content: aff,
      type: typeof aff === 'string' && aff.startsWith('http') ? 'url' : 'text',
      played: false
    }));
    
    this._log(`Cargadas ${this.subliminalQueue.length} afirmaciones`);
  }

  /**
   * Activar/desactivar EMDR
   */
  toggleEMDR(enabled) {
    this.config.EMDR_ENABLED = enabled;
    
    if (enabled) {
      this._startEMDR();
    } else {
      this._stopEMDR();
    }
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      state: this.state,
      currentPhase: this.currentPhase,
      phaseDuration: this.phaseDuration,
      breathRate: this.breathRate,
      sessionDuration: Date.now() - this.sessionStartTime,
      deepSleepTotal: this.deepSleepDuration,
      remTotal: this.remDuration,
      totalBreaths: this.totalBreaths,
      subliminalPlayed: this.subliminalQueue.filter(a => a.played).length,
      lucidTriggersCount: this.lucidTriggersCount
    };
  }

  /**
   * Exportar sesión completa
   */
  async exportSession() {
    const recording = this.recordedChunks.length > 0 
      ? await this._createRecordingBlob() 
      : null;
    
    return {
      metadata: {
        startTime: this.sessionStartTime,
        duration: Date.now() - this.sessionStartTime,
        config: this.config
      },
      metrics: {
        phases: this.phaseHistory,
        totalBreaths: this.totalBreaths,
        deepSleepDuration: this.deepSleepDuration,
        remDuration: this.remDuration,
        subliminalCount: this.subliminalQueue.filter(a => a.played).length,
        lucidTriggersCount: this.lucidTriggersCount
      },
      recording: recording ? {
        blob: recording,
        url: URL.createObjectURL(recording),
        duration: Date.now() - this.recordingStartTime,
        format: this.config.RECORDING_FORMAT
      } : null
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - INICIALIZACIÓN
   * ═══════════════════════════════════════════════════════════════════════
   */

  async _initAudioContext() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: this.config.SAMPLE_RATE
    });
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async _initMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.config.SAMPLE_RATE
        }
      });
      
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);
      this._log('Micrófono inicializado');
      
    } catch (error) {
      throw new Error('Error al acceder al micrófono: ' + error.message);
    }
  }

  _setupAnalyzer() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.config.FFT_SIZE;
    this.analyser.smoothingTimeConstant = this.config.SMOOTHING_TIME_CONSTANT;
    
    this.microphone.connect(this.analyser);
    
    // Buffers
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.fftSize);
  }

  _startRecording() {
    try {
      const options = {
        mimeType: `audio/${this.config.RECORDING_FORMAT}`,
        audioBitsPerSecond: this.config.RECORDING_BITRATE
      };
      
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this._log('Grabación finalizada');
        this._processRecording();
      };
      
      this.recordingStartTime = Date.now();
      this.mediaRecorder.start(1000); // Chunks cada 1s
      
      this._log('Grabación iniciada');
      
    } catch (error) {
      this._log('Error iniciando grabación: ' + error.message);
    }
  }

  async _processRecording() {
    const blob = await this._createRecordingBlob();
    
    this.callbacks.onRecordingReady({
      blob,
      url: URL.createObjectURL(blob),
      duration: Date.now() - this.recordingStartTime
    });
  }

  async _createRecordingBlob() {
    return new Blob(this.recordedChunks, {
      type: `audio/${this.config.RECORDING_FORMAT}`
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - ANÁLISIS
   * ═══════════════════════════════════════════════════════════════════════
   */

  _startAnalysisLoop() {
    this.analysisIntervalId = setInterval(() => {
      if (!this.isRunning) return;
      
      this._analyzeAudio();
      this._classifyPhase();
      this._handlePhaseActions();
      
    }, this.config.ANALYSIS_INTERVAL_MS);
  }

  _analyzeAudio() {
    // Obtener datos de frecuencia
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);
    
    // Detectar respiración en el espectro de frecuencias
    const breathData = this._detectBreathing();
    
    this.breathRate = breathData.rate;
    this.breathAmplitude = breathData.amplitude;
    
    if (breathData.detected) {
      this.totalBreaths++;
      this.callbacks.onBreathDetected({
        rate: this.breathRate,
        amplitude: this.breathAmplitude,
        timestamp: Date.now()
      });
    }
  }

  _detectBreathing() {
    const binCount = this.analyser.frequencyBinCount;
    const sampleRate = this.audioContext.sampleRate;
    const binWidth = sampleRate / this.analyser.fftSize;
    
    // Calcular índices de bins para rango de respiración
    const minBin = Math.floor(this.config.BREATH_FREQ_MIN / binWidth);
    const maxBin = Math.ceil(this.config.BREATH_FREQ_MAX / binWidth);
    
    // Encontrar pico en rango de respiración
    let peakBin = minBin;
    let peakValue = this.frequencyData[minBin];
    
    for (let i = minBin; i <= maxBin; i++) {
      if (this.frequencyData[i] > peakValue) {
        peakValue = this.frequencyData[i];
        peakBin = i;
      }
    }
    
    // Convertir bin a frecuencia y luego a respiraciones por minuto
    const peakFreq = peakBin * binWidth;
    const breathsPerMin = peakFreq * 60;
    
    const detected = peakValue > this.config.BREATH_AMPLITUDE_THRESHOLD;
    
    return {
      detected,
      rate: Math.round(breathsPerMin),
      amplitude: peakValue,
      frequency: peakFreq
    };
  }

  _classifyPhase() {
    const rate = this.breathRate;
    let newPhase = this.currentPhase;
    
    // Clasificar basado en tasa respiratoria
    if (rate >= this.config.AWAKE_BREATH_RATE.min && 
        rate <= this.config.AWAKE_BREATH_RATE.max) {
      newPhase = 'AWAKE';
    } 
    else if (rate >= this.config.DROWSY_BREATH_RATE.min && 
             rate <= this.config.DROWSY_BREATH_RATE.max) {
      newPhase = 'DROWSY';
    }
    else if (rate >= this.config.LIGHT_SLEEP_BREATH_RATE.min && 
             rate <= this.config.LIGHT_SLEEP_BREATH_RATE.max) {
      newPhase = 'LIGHT_SLEEP';
    }
    else if (rate >= this.config.DEEP_SLEEP_BREATH_RATE.min && 
             rate <= this.config.DEEP_SLEEP_BREATH_RATE.max) {
      newPhase = 'DEEP_SLEEP';
    }
    
    // Detectar REM (respiración irregular similar a despierto pero en sueño)
    // REM típicamente viene después de deep sleep
    const inSleep = ['LIGHT_SLEEP', 'DEEP_SLEEP'].includes(this.currentPhase);
    const irregularBreathing = this._detectIrregularBreathing();
    
    if (inSleep && irregularBreathing) {
      newPhase = 'REM';
    }
    
    // Cambiar fase solo si ha estado suficiente tiempo
    if (newPhase !== this.currentPhase) {
      const timeInPhase = Date.now() - this.phaseStartTime;
      
      if (timeInPhase > this.config.PHASE_CONFIRMATION_TIME) {
        this._changePhase(newPhase);
      }
    } else {
      // Actualizar duración de fase actual
      this.phaseDuration = Date.now() - this.phaseStartTime;
      
      // Acumular tiempo en deep sleep y REM
      if (this.currentPhase === 'DEEP_SLEEP') {
        this.deepSleepDuration += this.config.ANALYSIS_INTERVAL_MS;
      } else if (this.currentPhase === 'REM') {
        this.remDuration += this.config.ANALYSIS_INTERVAL_MS;
      }
    }
  }

  _detectIrregularBreathing() {
    // Analizar variabilidad en los últimos 60s
    const recent = this.phaseHistory.slice(-60);
    if (recent.length < 30) return false;
    
    const rates = recent.map(p => p.breathRate);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    
    // REM tiene alta variabilidad (CV > 0.15)
    const cv = stdDev / mean;
    return cv > 0.15;
  }

  _changePhase(newPhase) {
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    this.phaseStartTime = Date.now();
    this.phaseDuration = 0;
    
    this.phaseHistory.push({
      phase: oldPhase,
      startTime: this.phaseStartTime,
      duration: Date.now() - this.phaseStartTime,
      breathRate: this.breathRate
    });
    
    this.callbacks.onPhaseChange({
      from: oldPhase,
      to: newPhase,
      timestamp: Date.now()
    });
    
    this._log(`Fase cambiada: ${oldPhase} → ${newPhase}`);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - ACCIONES POR FASE
   * ═══════════════════════════════════════════════════════════════════════
   */

  _handlePhaseActions() {
    const now = Date.now();
    
    // DEEP SLEEP: Afirmaciones subliminales
    if (this.currentPhase === 'DEEP_SLEEP') {
      if (this.phaseDuration > this.config.DEEP_SLEEP_MIN_DURATION) {
        const timeSinceLastSubliminal = now - this.lastSubliminalTime;
        
        if (timeSinceLastSubliminal > this.config.SUBLIMINAL_INTERVAL_MS) {
          this._playSubliminal();
        }
      }
    }
    
    // REM: Triggers para sueños lúcidos
    if (this.currentPhase === 'REM') {
      const timeSinceLastTrigger = now - this.lastLucidTrigger;
      
      if (timeSinceLastTrigger > this.config.LUCID_TRIGGER_INTERVAL) {
        this._playLucidTrigger();
      }
    }
  }

  _playSubliminal() {
    const unplayed = this.subliminalQueue.filter(a => !a.played);
    
    if (unplayed.length === 0) {
      this._log('No hay más afirmaciones en cola');
      return;
    }
    
    const affirmation = unplayed[0];
    affirmation.played = true;
    
    this._log(`Reproduciendo afirmación subliminal: ${affirmation.id}`);
    
    if (affirmation.type === 'url') {
      this._playSubliminalFromURL(affirmation.content);
    } else {
      this._playSubliminalFromText(affirmation.content);
    }
    
    this.lastSubliminalTime = Date.now();
    
    this.callbacks.onSubliminalPlayed({
      affirmation: affirmation.content,
      phase: this.currentPhase,
      timestamp: Date.now()
    });
  }

  async _playSubliminalFromURL(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const pitchShifter = this.audioContext.createBiquadFilter();
      
      source.buffer = audioBuffer;
      
      // Configurar volumen bajo
      gainNode.gain.value = this.config.SUBLIMINAL_VOLUME;
      
      // Pitch shift (más subliminal)
      pitchShifter.type = 'lowpass';
      pitchShifter.frequency.value = 2000 + this.config.SUBLIMINAL_FREQ_SHIFT;
      
      // Conectar nodos
      source.connect(pitchShifter);
      pitchShifter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
      
    } catch (error) {
      this._log('Error reproduciendo subliminal: ' + error.message);
    }
  }

  _playSubliminalFromText(text) {
    // Usar Web Speech API (TTS)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.config.SUBLIMINAL_VOLUME;
      utterance.rate = 0.8; // Más lento
      utterance.pitch = 0.8; // Más grave
      
      window.speechSynthesis.speak(utterance);
    } else {
      this._log('Web Speech API no disponible');
    }
  }

  _playLucidTrigger() {
    this._log('Reproduciendo trigger para sueño lúcido');
    
    // Pulso de 40Hz (gamma) para incrementar awareness
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.frequency.value = this.config.LUCID_TRIGGER_FREQ;
    oscillator.type = 'sine';
    
    // Envelope
    const now = this.audioContext.currentTime;
    const duration = this.config.LUCID_TRIGGER_DURATION / 1000;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.config.LUCID_TRIGGER_VOLUME, now + 0.5);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    this.lastLucidTrigger = Date.now();
    this.lucidTriggersCount++;
    
    this.callbacks.onLucidTrigger({
      phase: this.currentPhase,
      triggerNumber: this.lucidTriggersCount,
      timestamp: Date.now()
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MÉTODOS PRIVADOS - EMDR
   * ═══════════════════════════════════════════════════════════════════════
   */

  _startEMDR() {
    if (this.emdrOscillators) return; // Ya activo
    
    this._log('Iniciando EMDR bilateral stimulation');
    
    const leftOsc = this.audioContext.createOscillator();
    const rightOsc = this.audioContext.createOscillator();
    
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();
    
    const merger = this.audioContext.createChannelMerger(2);
    
    // Frecuencias ligeramente diferentes (beat frequency = 4Hz Theta)
    leftOsc.frequency.value = this.config.EMDR_TONE_LEFT;
    rightOsc.frequency.value = this.config.EMDR_TONE_RIGHT;
    
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';
    
    // Alternar volumen entre canales (bilateral)
    const emdrFreq = this.config.EMDR_FREQUENCY;
    const period = 1 / emdrFreq;
    
    this._modulateEMDRGain(leftGain, rightGain, period);
    
    // Conectar
    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    
    leftGain.connect(merger, 0, 0);  // Canal izquierdo
    rightGain.connect(merger, 0, 1); // Canal derecho
    
    merger.connect(this.audioContext.destination);
    
    leftOsc.start();
    rightOsc.start();
    
    this.emdrOscillators = { leftOsc, rightOsc, leftGain, rightGain };
  }

  _modulateEMDRGain(leftGain, rightGain, period) {
    const now = this.audioContext.currentTime;
    const steps = 100; // Resolución de modulación
    const stepDuration = period / steps;
    
    for (let i = 0; i < steps; i++) {
      const time = now + (i * stepDuration);
      const progress = i / steps;
      const angle = progress * Math.PI * 2;
      
      const leftValue = (Math.sin(angle) + 1) / 2 * 0.2; // 0-0.2
      const rightValue = (Math.sin(angle + Math.PI) + 1) / 2 * 0.2;
      
      leftGain.gain.setValueAtTime(leftValue, time);
      rightGain.gain.setValueAtTime(rightValue, time);
    }
    
    // Repetir continuamente
    setTimeout(() => {
      if (this.emdrOscillators) {
        this._modulateEMDRGain(leftGain, rightGain, period);
      }
    }, period * 1000);
  }

  _stopEMDR() {
    if (!this.emdrOscillators) return;
    
    this._log('Deteniendo EMDR');
    
    this.emdrOscillators.leftOsc.stop();
    this.emdrOscillators.rightOsc.stop();
    this.emdrOscillators = null;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * UTILIDADES
   * ═══════════════════════════════════════════════════════════════════════
   */

  _log(message) {
    console.log(`[SleepAudioAnalyzer] ${message}`);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXPORTAR MÓDULO
 * ═══════════════════════════════════════════════════════════════════════
 */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SleepAudioAnalyzer;
}

if (typeof exports !== 'undefined') {
  exports.SleepAudioAnalyzer = SleepAudioAnalyzer;
}

if (typeof window !== 'undefined') {
  window.SleepAudioAnalyzer = SleepAudioAnalyzer;
}
