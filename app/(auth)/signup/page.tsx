"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function SignUpPage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                    // Redirigir de vuelta a la app tras confirmar email
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (signupError) {
                setError(signupError.message)
            } else {
                setSuccess(true)
                // Dependiendo de si la confirmación de email está activa:
                if (data.session) {
                    router.push("/home")
                }
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <Brain className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">¡Revisa tu correo!</h2>
                    <p className="text-muted-foreground">
                        Hemos enviado un enlace de confirmación a tu email. Por favor, confírmalo para poder ingresar.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full mt-4">Volver al Login</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 lg:p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Crea una cuenta</h1>
                    <p className="text-sm text-muted-foreground">
                        Únete a Neural Wellness y empieza a monitorear tu bienestar
                    </p>
                </div>

                <div className="grid gap-6">
                    <form onSubmit={handleSignup}>
                        <div className="grid gap-4">
                            {error && (
                                <div className="p-3 text-sm text-white bg-destructive rounded-md text-center">
                                    {error}
                                </div>
                            )}
                            <div className="grid gap-1">
                                <Label className="sr-only" htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Tu nombre"
                                    type="text"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label className="sr-only" htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    placeholder="nombre@ejemplo.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label className="sr-only" htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    placeholder="******"
                                    type="password"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button disabled={isLoading}>
                                {isLoading && (
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                                Crear cuenta
                            </Button>
                        </div>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
