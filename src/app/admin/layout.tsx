import { AdminHeader } from "@/components/admin/admin-header"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
            <AdminHeader />
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {children}
            </main>
        </div>
    )
}
