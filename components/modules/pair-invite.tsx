"use client"

import { useState } from "react"
import { Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PairInviteProps {
    sessionCode: string
    onCancel?: () => void
}

export function PairInvite({ sessionCode, onCancel }: PairInviteProps) {
    const [copied, setCopied] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)

    const fullLink = typeof window !== "undefined"
        ? `${window.location.origin}/sync/${sessionCode}`
        : `/sync/${sessionCode}`

    const copyCode = async () => {
        await navigator.clipboard.writeText(sessionCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const copyLink = async () => {
        await navigator.clipboard.writeText(fullLink)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
    }

    return (
        <div className="flex flex-col items-center gap-6 animate-fade-in-up py-8">
            {/* Waiting animation */}
            <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-[var(--color-mind-cyan)]/30 flex items-center justify-center animate-breath-pulse">
                    <Loader2 className="w-8 h-8 text-[var(--color-mind-cyan)] animate-spin" />
                </div>
                <div className="absolute -inset-3 rounded-full border border-[var(--color-mind-coral)]/20 animate-breath" />
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Esperando a tu pareja</h3>
                <p className="text-sm text-muted-foreground">Compartí este código para que se una a la sesión</p>
            </div>

            {/* Code display */}
            <div className="flex items-center gap-3">
                <div className="text-4xl font-mono font-bold tracking-[0.3em] text-[var(--color-mind-cyan)] bg-card px-6 py-3 rounded-xl border border-[var(--color-mind-cyan)]/20">
                    {sessionCode}
                </div>
                <Button variant="outline" size="icon" onClick={copyCode} className="shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            {/* Copy link */}
            <Button variant="ghost" size="sm" onClick={copyLink} className="text-muted-foreground">
                {copiedLink ? (
                    <><Check className="w-3 h-3 mr-1 text-emerald-400" /> Link copiado</>
                ) : (
                    <><Copy className="w-3 h-3 mr-1" /> Copiar link completo</>
                )}
            </Button>

            {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                    Cancelar
                </Button>
            )}
        </div>
    )
}
