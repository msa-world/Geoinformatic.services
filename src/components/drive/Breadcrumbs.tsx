import { Button } from "@/components/ui/button"
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
    id: string | null
    name: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    onNavigate: (index: number) => void
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center text-sm overflow-x-auto whitespace-nowrap pb-2 md:pb-0 scrollbar-hide -mx-2">
            {items.map((item, idx) => (
                <div key={(item.id ?? 'root') + idx} className="flex items-center">
                    {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />}
                    <button
                        className={`flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded transition-colors min-h-[40px] md:min-h-0 md:px-2 md:py-1
              ${idx === items.length - 1
                                ? 'font-semibold text-gray-900 dark:text-gray-100 pointer-events-none'
                                : 'text-blue-600 dark:text-blue-400 active:bg-gray-200 dark:active:bg-gray-700'
                            }`}
                        onClick={() => onNavigate(idx)}
                    >
                        {idx === 0 && <Home className="w-4 h-4 flex-shrink-0" />}
                        <span className="truncate max-w-[120px] md:max-w-none">{item.name}</span>
                    </button>
                </div>
            ))}
        </nav>
    )
}
