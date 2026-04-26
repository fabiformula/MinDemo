"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    Globe,
    HeartPulse,
    Wind,
    Headphones,
    Menu,
    Activity,
    Home,
} from "lucide-react"

interface NavItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    label?: string
}

const navItems: NavItem[] = [
    {
        title: "Inicio",
        href: "/home",
        icon: Home,
    },
    {
        title: "Monitor PPG",
        href: "/ppg",
        icon: HeartPulse,
        label: "Pulso cardíaco",
    },
    {
        title: "Respiración",
        href: "/breathing",
        icon: Wind,
        label: "Meditación y sueños",
    },
    {
        title: "Meditación",
        href: "/meditation",
        icon: Headphones,
        label: "Audio on demand",
    },
    {
        title: "Discovery",
        href: "/discovery",
        icon: Globe,
        label: "¿Quién respira como vos?",
    },
]

export function DashboardSidebar() {
    const pathname = usePathname()

    return (
        <nav className="relative hidden h-screen border-r pt-16 lg:block w-72">
            <div className="flex flex-col h-full">
                <div className="space-y-4 py-4 flex-1">
                    <div className="px-3 py-2">
                        <div className="space-y-1">
                            <div className="mb-6 px-4 flex items-center gap-2">
                                <Activity className="h-6 w-6 text-[var(--color-mind-cyan)]" />
                                <h2 className="text-xl font-semibold tracking-tight">
                                    MinDeploy
                                </h2>
                            </div>
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        variant={pathname === item.href ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                        asChild
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export function MobileNav() {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
                <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={() => setOpen(false)}
                >
                    <Activity className="h-5 w-5 text-[var(--color-mind-cyan)]" />
                    <span className="font-bold">MinDeploy</span>
                </Link>
                <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                    <div className="flex flex-col space-y-3">
                        {navItems.map(
                            (item) =>
                                item.href && (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center text-sm font-medium hover:underline",
                                            pathname === item.href ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.title}
                                    </Link>
                                )
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
