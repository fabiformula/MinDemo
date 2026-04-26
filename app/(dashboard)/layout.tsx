"use client"

import { DashboardSidebar, MobileNav } from "@/components/layouts/main-nav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Mobile Navigation */}
            <div className="flex h-16 items-center border-b px-4 lg:hidden">
                <MobileNav />
                <span className="font-bold text-[var(--color-mind-cyan)]">MinDeploy</span>
            </div>

            {/* Desktop Sidebar */}
            <DashboardSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                {children}
            </main>
        </div>
    )
}
