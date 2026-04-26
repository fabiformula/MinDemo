"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Chrome, Github } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (loginError) {
                setError(loginError.message)
            } else {
                router.push("/dashboard/home")
                router.refresh()
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 lg:p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
                    <p className="text-sm text-muted-foreground">
                        Ingresa tu email para acceder a tu espacio
                    </p>
                </div>

                <div className="grid gap-6">
                    <form onSubmit={handleLogin}>
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
                            <div className="grid gap-1">
                                <div className="flex items-center justify-between">
                                    <Label className="sr-only" htmlFor="password">Contraseña</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    placeholder="******"
                                    type="password"
                                    disabled={isLoading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button disabled={isLoading}>
                                {isLoading && (
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                                Ingresar con Email
                            </Button>
                        </div>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                O continuar con
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" disabled={isLoading} onClick={() => setError("OAuth no configurado aún")}>
                            <Chrome className="mr-2 h-4 w-4" /> Google
                        </Button>
                        <Button variant="outline" disabled={isLoading} onClick={() => setError("OAuth no configurado aún")}>
                            <Github className="mr-2 h-4 w-4" /> Apple
                        </Button>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        ¿No tienes cuenta?{" "}
                        <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
