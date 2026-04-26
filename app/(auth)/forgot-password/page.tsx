"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, ArrowLeft } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ForgotPasswordPage() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings/password`,
            })

            if (resetError) {
                setError(resetError.message)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
                    <p className="text-sm text-muted-foreground">
                        Ingresa tu email y te enviaremos un enlace para restablecer tu clave
                    </p>
                </div>

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                            Si el correo existe, hemos enviado las instrucciones.
                        </div>
                        <Link href="/login">
                            <Button variant="outline" className="w-full">Volver al Login</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <form onSubmit={handleReset}>
                            <div className="grid gap-4">
                                {error && (
                                    <div className="p-3 text-sm text-white bg-destructive rounded-md text-center">
                                        {error}
                                    </div>
                                )}
                                <div className="grid gap-1">
                                    <Label className="sr-only" htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        placeholder="nombre@ejemplo.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        disabled={isLoading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button disabled={isLoading}>
                                    {isLoading && (
                                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    Enviar enlace
                                </Button>
                            </div>
                        </form>
                        <Link
                            href="/login"
                            className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
