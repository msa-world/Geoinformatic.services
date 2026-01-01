import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Transfer {
    id: string
    type: 'upload' | 'download' | 'delete'
    name: string
    progress: number
    status: 'running' | 'done' | 'error'
}

interface TransferStatusProps {
    transfers: Record<string, Transfer>
}

export function TransferStatus({ transfers }: TransferStatusProps) {
    const transferProgressRefs = useRef<Record<string, HTMLDivElement | null>>({})

    useEffect(() => {
        Object.values(transfers).forEach((t) => {
            const el = transferProgressRefs.current[t.id]
            if (el) el.style.width = `${t.progress}%`
        })
    }, [transfers])

    if (Object.keys(transfers).length === 0) return null

    return (
        <div className="fixed left-4 right-4 bottom-4 md:right-4 md:left-auto md:top-20 md:bottom-auto z-50 flex flex-col gap-2 md:w-80">
            {Object.values(transfers).map((t) => (
                <div key={t.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 md:slide-in-from-right-5 backdrop-blur-sm">
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium truncate pr-2">
                                {t.type === 'upload' ? '⬆️ Uploading' : t.type === 'download' ? '⬇️ Downloading' : '🗑️ Deleting'} {t.name}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{t.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                ref={(el) => { transferProgressRefs.current[t.id] = el }}
                                className={`h-full rounded-full transition-all duration-300 ${t.status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    }`}
                            />
                        </div>
                        {t.status === 'done' && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Complete</p>
                        )}
                        {t.status === 'error' && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">✗ Failed</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
