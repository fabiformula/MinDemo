"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { createClient } from "@/utils/supabase/client"
import type { BreathPattern, ActivePattern } from "@/lib/types/breath-pattern"
import { motion } from "framer-motion"
import { Users, Wind, Activity } from "lucide-react"

// Fix for Leaflet icons
import L from "leaflet"
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface DiscoveryMapProps {
    userPattern: BreathPattern
}

interface MapLocation {
    lat: number
    lng: number
    city?: string
}

export default function DiscoveryMap({ userPattern }: DiscoveryMapProps) {
    const [patterns, setPatterns] = useState<ActivePattern[]>([])
    const [userLocation, setUserLocation] = useState<MapLocation | null>(null)
    const supabase = createClient()

    // Get user location & publish pattern
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        city: "Unknown" // Could do reverse geocoding here if needed
                    }
                    setUserLocation(loc)
                    await publishPattern(loc)
                },
                (error) => {
                    console.warn("Location access denied, defaulting to center", error)
                    // Default: Null Island or random
                    const fallback = { lat: -34.6037, lng: -58.3816 } // Buenos Aires as default
                    setUserLocation(fallback)
                    publishPattern(fallback)
                }
            )
        }
    }, [])

    // Poll for other patterns
    useEffect(() => {
        fetchPatterns()
        const interval = setInterval(fetchPatterns, 10000)
        return () => clearInterval(interval)
    }, [])

    const publishPattern = async (location: MapLocation) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase.from("active_patterns").upsert({
                user_id: user.id,
                heart_rate: userPattern.heartRate,
                breath_rate: userPattern.breathRate,
                variability: userPattern.variability,
                location: location,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
            })
        } catch (error) {
            console.error("Error publishing pattern:", error)
        }
    }

    const fetchPatterns = async () => {
        try {
            const { data, error } = await supabase
                .from("active_patterns")
                .select("*")
                .gt("expires_at", new Date().toISOString())

            if (error) throw error

            // Transform raw data if needed, assuming direct mapping for now or use helper
            // data is raw JSON, ensure it maps to ActivePattern
            if (data) {
                // Simple mapping
                const mapped: ActivePattern[] = data.map((d: any) => ({
                    id: d.id,
                    userId: d.user_id,
                    heartRate: d.heart_rate,
                    breathRate: d.breath_rate,
                    variability: d.variability,
                    location: d.location,
                    createdAt: d.created_at,
                    expiresAt: d.expires_at
                }))
                setPatterns(mapped)
            }
        } catch (error) {
            console.error("Error fetching patterns:", error)
        }
    }

    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#0a0e27] overflow-hidden">
            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 z-[1000] space-y-2 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background/80 backdrop-blur-md border border-primary/20 p-4 rounded-xl shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">Tu Estado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div>
                            <div className="text-2xl font-bold font-mono">{userPattern.heartRate}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Activity className="w-3 h-3" /> BPM
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono">{userPattern.breathRate}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Wind className="w-3 h-3" /> RESP
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background/80 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                >
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-bold">{patterns.length}</span>
                    <span className="text-xs text-muted-foreground uppercase">Conectados</span>
                </motion.div>
            </div>

            <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [-34.6, -58.4]}
                zoom={13}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Recenter map when location is found */}
                {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />}

                {patterns.map((p) => {
                    const isMe = p.heartRate === userPattern.heartRate && p.breathRate === userPattern.breathRate // simple check, ideally check user ID
                    return (
                        <CircleMarker
                            key={p.id}
                            center={[p.location.lat, p.location.lng]}
                            radius={10} // Base radius
                            pathOptions={{
                                color: isMe ? "#00d9ff" : "#ff6b9d",
                                fillColor: isMe ? "#00d9ff" : "#ff6b9d",
                                fillOpacity: 0.6,
                                weight: 0
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[120px]">
                                    <h3 className="font-bold text-sm mb-1">{isMe ? "Vos" : "Usuario"}</h3>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>❤️ {p.heartRate}</div>
                                        <div>🌬️ {p.breathRate}</div>
                                    </div>
                                    {!isMe && (
                                        <button className="mt-2 w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs py-1 rounded transition-colors">
                                            Sincronizar
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    )
                })}
            </MapContainer>

            {/* Breath Animation Overlay for Map Points would require custom markers or CSS injection, keeping simple for now */}
        </div>
    )
}

function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap()
    useEffect(() => {
        map.flyTo([lat, lng], 13, { duration: 2 })
    }, [lat, lng, map])
    return null
}
