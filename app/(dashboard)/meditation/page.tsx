"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Headphones, Play, Pause, SkipForward, Volume2, VolumeX, Clock, Sparkles, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MeditationTrack {
    id: string
    title: string
    artist: string
    duration: string
    durationSec: number
    category: "relajacion" | "concentracion" | "sueno" | "guiada"
    color: string
    url?: string
    generatorType?: "rain" | "ocean" | "binaural" | "drone" | "bowls"
}

const TRACKS: MeditationTrack[] = [
    {
        id: "guided-meditation",
        title: "Meditación Guiada",
        artist: "MinDeploy",
        duration: "—",
        durationSec: 0,
        category: "guiada",
        color: "#00d9ff",
        url: "/audio/meditacion-guiada.mp3",
    },
    {
        id: "rain-forest",
        title: "Lluvia en el Bosque",
        artist: "Generativo",
        duration: "∞",
        durationSec: 0,
        category: "relajacion",
        color: "#00d9ff",
        generatorType: "rain",
    },
    {
        id: "ocean-waves",
        title: "Olas del Océano",
        artist: "Generativo",
        duration: "∞",
        durationSec: 0,
        category: "relajacion",
        color: "#00d9ff",
        generatorType: "ocean",
    },
    {
        id: "deep-focus",
        title: "Concentración Profunda",
        artist: "Binaural 40Hz",
        duration: "∞",
        durationSec: 0,
        category: "concentracion",
        color: "#7c5cfc",
        generatorType: "binaural",
    },
    {
        id: "calm-drone",
        title: "Drone Meditativo",
        artist: "Generativo",
        duration: "∞",
        durationSec: 0,
        category: "concentracion",
        color: "#7c5cfc",
        generatorType: "drone",
    },
    {
        id: "singing-bowls",
        title: "Cuencos Tibetanos",
        artist: "Generativo",
        duration: "∞",
        durationSec: 0,
        category: "sueno",
        color: "#ff6b9d",
        generatorType: "bowls",
    },
]

const CATEGORIES = [
    { key: "all" as const, label: "Todos", color: "var(--color-mind-cyan)" },
    { key: "guiada" as const, label: "Guiada", color: "#00d9ff" },
    { key: "relajacion" as const, label: "Relajación", color: "#00d9ff" },
    { key: "concentracion" as const, label: "Concentración", color: "#7c5cfc" },
    { key: "sueno" as const, label: "Sueño", color: "#ff6b9d" },
]

// ═══════════════════════════════════════════════════════════
// Audio Generator — ambient sounds via Web Audio API
// ═══════════════════════════════════════════════════════════

class AmbientGenerator {
    private ctx: AudioContext | null = null
    private masterGain: GainNode | null = null
    private nodes: AudioNode[] = []
    private oscillators: OscillatorNode[] = []
    private intervalId: ReturnType<typeof setInterval> | null = null

    async start(type: string, volume: number): Promise<AudioContext> {
        this.ctx = new AudioContext()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = volume
        this.masterGain.connect(this.ctx.destination)
        switch (type) {
            case "rain": this.createRain(); break
            case "ocean": this.createOcean(); break
            case "binaural": this.createBinaural(); break
            case "drone": this.createDrone(); break
            case "bowls": this.createBowls(); break
        }
        return this.ctx
    }

    setVolume(v: number) {
        if (this.masterGain) this.masterGain.gain.value = v
    }

    stop() {
        this.oscillators.forEach(o => { try { o.stop() } catch { /* */ } })
        if (this.intervalId) clearInterval(this.intervalId)
        if (this.ctx && this.ctx.state !== "closed") this.ctx.close()
        this.ctx = null; this.masterGain = null; this.nodes = []; this.oscillators = []
    }

    private createRain() {
        if (!this.ctx || !this.masterGain) return
        const bufferSize = 2 * this.ctx.sampleRate
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        let lastOut = 0
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1
            data[i] = (lastOut + 0.02 * white) / 1.02
            lastOut = data[i]
            data[i] *= 3.5
        }
        const source = this.ctx.createBufferSource()
        source.buffer = buffer; source.loop = true
        const f1 = this.ctx.createBiquadFilter(); f1.type = "highpass"; f1.frequency.value = 400
        const f2 = this.ctx.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = 8000
        source.connect(f1); f1.connect(f2); f2.connect(this.masterGain)
        source.start(); this.nodes.push(source, f1, f2)
    }

    private createOcean() {
        if (!this.ctx || !this.masterGain) return
        const bufferSize = 2 * this.ctx.sampleRate
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
        for (let i = 0; i < bufferSize; i++) {
            const w = Math.random() * 2 - 1
            b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520
            b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
            data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926
        }
        const source = this.ctx.createBufferSource()
        source.buffer = buffer; source.loop = true
        const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.08
        const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.3
        lfo.connect(lfoGain)
        const ampMod = this.ctx.createGain(); ampMod.gain.value = 0.7
        lfoGain.connect(ampMod.gain)
        source.connect(ampMod); ampMod.connect(this.masterGain)
        lfo.start(); source.start()
        this.oscillators.push(lfo); this.nodes.push(source, ampMod)
    }

    private createBinaural() {
        if (!this.ctx || !this.masterGain) return
        const merger = this.ctx.createChannelMerger(2)
        const osc1 = this.ctx.createOscillator(); osc1.frequency.value = 200; osc1.type = "sine"
        const g1 = this.ctx.createGain(); g1.gain.value = 0.3
        osc1.connect(g1); g1.connect(merger, 0, 0)
        const osc2 = this.ctx.createOscillator(); osc2.frequency.value = 240; osc2.type = "sine"
        const g2 = this.ctx.createGain(); g2.gain.value = 0.3
        osc2.connect(g2); g2.connect(merger, 0, 1)
        merger.connect(this.masterGain); osc1.start(); osc2.start()
        this.oscillators.push(osc1, osc2)
    }

    private createDrone() {
        if (!this.ctx || !this.masterGain) return
        const freqs = [55, 82.5, 110, 165]
        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator()
            osc.frequency.value = f; osc.type = i === 0 ? "sawtooth" : "sine"
            const g = this.ctx!.createGain(); g.gain.value = i === 0 ? 0.08 : 0.12 / (i + 1)
            osc.connect(g); g.connect(this.masterGain!); osc.start(); this.oscillators.push(osc)
        })
    }

    private createBowls() {
        if (!this.ctx || !this.masterGain) return
        const playBowl = (freq: number, delay: number) => {
            if (!this.ctx || !this.masterGain) return
            const osc = this.ctx.createOscillator(); osc.frequency.value = freq; osc.type = "sine"
            const g = this.ctx.createGain()
            g.gain.setValueAtTime(0, this.ctx.currentTime + delay)
            g.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + delay + 0.3)
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 6)
            osc.connect(g); g.connect(this.masterGain!)
            osc.start(this.ctx.currentTime + delay); osc.stop(this.ctx.currentTime + delay + 7)
        }
        const bowlFreqs = [261.6, 329.6, 392, 523.2, 440]
        const playSequence = () => bowlFreqs.forEach((f, i) => playBowl(f, i * 3))
        playSequence()
        this.intervalId = setInterval(playSequence, bowlFreqs.length * 3 * 1000)
    }
}

// ═══════════════════════════════════════════════════════════

export default function MeditationPage() {
    const [category, setCategory] = useState<"all" | "guiada" | "relajacion" | "concentracion" | "sueno">("all")
    const [currentTrack, setCurrentTrack] = useState<MeditationTrack | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)          // real duration of MP3 once loaded
    const [isFileTrack, setIsFileTrack] = useState(false) // true when playing a file (not generative)
    const [volume, setVolume] = useState(0.7)
    const [isMuted, setIsMuted] = useState(false)
    const [audioError, setAudioError] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const generatorRef = useRef<AmbientGenerator | null>(null)
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTimeRef = useRef(0)

    const cleanup = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
        if (generatorRef.current) { generatorRef.current.stop(); generatorRef.current = null }
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null }
        setAudioError(null)
    }, [])

    useEffect(() => { return cleanup }, [cleanup])

    const playTrack = async (track: MeditationTrack) => {
        cleanup()
        setAudioError(null)
        setCurrentTrack(track)
        setProgress(0)
        setCurrentTime(0)
        setDuration(0)
        startTimeRef.current = Date.now()

        if (track.generatorType) {
            setIsFileTrack(false)
            const gen = new AmbientGenerator()
            generatorRef.current = gen
            try {
                await gen.start(track.generatorType, isMuted ? 0 : volume)
                setIsPlaying(true)
                progressIntervalRef.current = setInterval(() => {
                    setCurrentTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
                }, 1000)
            } catch {
                setAudioError("Error al iniciar audio generativo")
            }
        } else if (track.url) {
            setIsFileTrack(true)
            const audio = new Audio(track.url)
            audio.volume = isMuted ? 0 : volume
            audioRef.current = audio

            audio.addEventListener("loadedmetadata", () => {
                if (!isNaN(audio.duration)) setDuration(Math.floor(audio.duration))
            })
            audio.addEventListener("canplaythrough", () => {
                audio.play().catch(() => setAudioError("El navegador bloqueó la reproducción automática. Presioná Play."))
                setIsPlaying(true)
            })
            audio.addEventListener("ended", () => {
                setIsPlaying(false)
                setProgress(100)
            })
            audio.addEventListener("error", () => {
                setAudioError("No se encontró el archivo de audio. Verificá que esté en public/audio/meditacion-guiada.mp3")
                setIsPlaying(false)
            })
            audio.load()

            progressIntervalRef.current = setInterval(() => {
                if (audio && !audio.paused && audio.duration) {
                    setProgress((audio.currentTime / audio.duration) * 100)
                    setCurrentTime(Math.floor(audio.currentTime))
                }
            }, 250)
        }
    }

    const togglePlayPause = () => {
        if (generatorRef.current) {
            if (isPlaying) {
                generatorRef.current.setVolume(0)
            } else {
                generatorRef.current.setVolume(isMuted ? 0 : volume)
                startTimeRef.current = Date.now() - currentTime * 1000
            }
            setIsPlaying(!isPlaying)
            return
        }
        if (!audioRef.current) return
        if (isPlaying) { audioRef.current.pause() } else { audioRef.current.play() }
        setIsPlaying(!isPlaying)
    }

    const skipToNext = () => {
        if (!currentTrack) return
        const filtered = category === "all" ? TRACKS : TRACKS.filter(t => t.category === category)
        const idx = filtered.findIndex(t => t.id === currentTrack.id)
        playTrack(filtered[(idx + 1) % filtered.length])
    }

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value)
        setVolume(v)
        if (audioRef.current) audioRef.current.volume = isMuted ? 0 : v
        if (generatorRef.current) generatorRef.current.setVolume(isMuted ? 0 : v)
    }

    const toggleMute = () => {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        if (audioRef.current) audioRef.current.volume = newMuted ? 0 : volume
        if (generatorRef.current) generatorRef.current.setVolume(newMuted ? 0 : volume)
    }

    const filteredTracks = category === "all" ? TRACKS : TRACKS.filter(t => t.category === category)

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, "0")}`
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Headphones className="w-7 h-7 text-purple-400" />
                <div>
                    <h1 className="text-2xl font-bold">Meditación</h1>
                    <p className="text-muted-foreground text-sm">Audio de meditación on demand</p>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat.key
                            ? "text-[var(--color-mind-bg)]"
                            : "bg-card border text-muted-foreground hover:text-foreground"
                            }`}
                        style={category === cat.key ? { backgroundColor: cat.color } : undefined}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Now Playing */}
            {currentTrack && (
                <div className="bg-card rounded-xl border p-5 animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${currentTrack.color}20` }}
                        >
                            {currentTrack.category === "guiada"
                                ? <Mic className="w-7 h-7" style={{ color: currentTrack.color }} />
                                : <Sparkles className="w-7 h-7" style={{ color: currentTrack.color }} />
                            }
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{currentTrack.title}</h3>
                            <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>

                            {/* Progress bar — real for files, ambient pulse for generative */}
                            <div className="mt-2 space-y-1">
                                {isFileTrack ? (
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%`, backgroundColor: currentTrack.color }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full animate-pulse"
                                            style={{ width: isPlaying ? "100%" : "0%", backgroundColor: currentTrack.color, opacity: 0.4 }}
                                        />
                                    </div>
                                )}
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>
                                        {isFileTrack && duration > 0 ? formatTime(duration) : (currentTrack.generatorType ? "∞ generativo" : "—")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {audioError && (
                        <div className="mt-3 text-sm text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-2">
                            {audioError}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={togglePlayPause} className="h-10 w-10 p-0">
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={skipToNext} className="h-10 w-10 p-0">
                                <SkipForward className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                            <input
                                type="range" min="0" max="1" step="0.05" value={volume}
                                onChange={handleVolume}
                                className="w-20 h-1 accent-[var(--color-mind-cyan)]"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Track List */}
            <div className="space-y-2">
                {filteredTracks.map((track) => {
                    const isActive = currentTrack?.id === track.id
                    return (
                        <button
                            key={track.id}
                            onClick={() => playTrack(track)}
                            className={`w-full bg-card rounded-xl border p-4 flex items-center gap-4 text-left transition-all hover:border-[var(--color-mind-cyan)]/20 hover:scale-[1.01] ${isActive ? "border-[var(--color-mind-cyan)]/40 ring-1 ring-[var(--color-mind-cyan)]/10" : ""}`}
                        >
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${track.color}15` }}
                            >
                                {isActive && isPlaying ? (
                                    <div className="flex gap-[2px] items-end h-4">
                                        <div className="w-[3px] bg-current rounded-full animate-pulse" style={{ color: track.color, height: "60%" }} />
                                        <div className="w-[3px] bg-current rounded-full animate-pulse" style={{ color: track.color, height: "100%", animationDelay: "0.15s" }} />
                                        <div className="w-[3px] bg-current rounded-full animate-pulse" style={{ color: track.color, height: "40%", animationDelay: "0.3s" }} />
                                    </div>
                                ) : track.category === "guiada" ? (
                                    <Mic className="w-4 h-4" style={{ color: track.color }} />
                                ) : (
                                    <Sparkles className="w-4 h-4" style={{ color: track.color }} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{track.title}</h4>
                                <p className="text-xs text-muted-foreground">{track.artist}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Clock className="w-3 h-3" />
                                {track.generatorType ? "∞" : track.duration}
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="text-center text-xs text-muted-foreground py-4 space-y-1">
                <p>Audio generado en tiempo real con Web Audio API • Usá auriculares para mejor experiencia</p>
                <p className="text-muted-foreground/50">Para binaural beats, los auriculares son imprescindibles</p>
            </div>
        </div>
    )
}
