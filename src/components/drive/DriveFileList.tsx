import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDown, ArrowUp, Copy, Download, Eye, FileIcon, FolderIcon, Link, MoreHorizontal, Trash2, Upload } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { toast } from "sonner"

// Helper function to format file size
function formatBytes(bytes: number | string, decimals = 2) {
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (num === 0 || isNaN(num)) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const FileTypeIcon = ({ name, mimeType }: { name: string, mimeType: string }) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
        return <FolderIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
    }
    if (name.toLowerCase().endsWith('.rar') || name.toLowerCase().endsWith('.zip')) {
        return <FileIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />;
}

export type DriveFile = {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    modifiedTime: string;
    webViewLink?: string;
    owner?: string;
}

interface DriveFileListProps {
    files: DriveFile[]
    loading: boolean
    listAnimating: boolean
    sortConfig: { key: string, direction: 'ascending' | 'descending' }
    onSort: (key: string) => void
    onDoubleClick: (file: DriveFile) => void
    onUploadTo: (parentId: string | null) => void
    onPreview: (file: DriveFile) => void
    onDownload: (fileId: string, name?: string) => void
    onDelete: (fileId: string) => void
    currentFolderId: string | null
    connectedAt: string | null
}

export function DriveFileList({
    files,
    loading,
    listAnimating,
    sortConfig,
    onSort,
    onDoubleClick,
    onUploadTo,
    onPreview,
    onDownload,
    onDelete,
    currentFolderId,
    connectedAt
}: DriveFileListProps) {

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
    };

    const getHeaderClass = (key: string) => {
        const base = "cursor-pointer select-none py-2 px-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";
        const isActive = sortConfig.key === key;
        return `${base} ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`;
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <div className={`${listAnimating ? 'opacity-80' : 'opacity-100'} transition-opacity duration-200`}>
                {/* Header */}
                <div className="grid grid-cols-12 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850 border-b font-semibold text-xs md:text-sm">
                    <div className="col-span-7 md:col-span-5">
                        <div className={getHeaderClass('name')} onClick={() => onSort('name')}>
                            Name {getSortIcon('name')}
                        </div>
                    </div>
                    <div className="hidden md:block md:col-span-2">
                        <div className={getHeaderClass('owner')} onClick={() => onSort('owner')}>
                            Owner {getSortIcon('owner')}
                        </div>
                    </div>
                    <div className="hidden md:block md:col-span-2">
                        <div className={getHeaderClass('modifiedTime')} onClick={() => onSort('modifiedTime')}>
                            Date {getSortIcon('modifiedTime')}
                        </div>
                    </div>
                    <div className="hidden md:block md:col-span-1">
                        <div className={getHeaderClass('size')} onClick={() => onSort('size')}>
                            Size {getSortIcon('size')}
                        </div>
                    </div>
                    <div className="col-span-5 md:col-span-2 text-center py-2 px-2">
                        <span className="hidden md:inline">Actions</span>
                        <span className="md:hidden">···</span>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading files...
                    </div>
                )}

                {/* Empty State */}
                {!loading && files.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {currentFolderId ? "This folder is empty." : "No files to show."}
                        </p>
                        {currentFolderId && (
                            <Button
                                onClick={() => onUploadTo(currentFolderId)}
                                disabled={!connectedAt}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload data
                            </Button>
                        )}
                    </div>
                )}

                {/* File Rows */}
                {!loading && files.map((f, index) => (
                    <div
                        key={f.id}
                        onDoubleClick={() => onDoubleClick(f)}
                        className={`grid grid-cols-12 items-center hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b last:border-0 cursor-pointer ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-850'
                            }`}
                    >
                        {/* Name */}
                        <div className="col-span-7 md:col-span-5 flex items-center gap-2 md:gap-3 py-3 md:py-3 px-3 md:px-4 overflow-hidden min-h-[60px] md:min-h-[52px]">
                            <FileTypeIcon name={f.name} mimeType={f.mimeType} />
                            <div className="flex flex-col min-w-0 flex-1">
                                <p className="font-medium text-sm md:text-base truncate">{f.name}</p>
                                {/* Mobile-only metadata */}
                                <p className="md:hidden text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {f.size ? formatBytes(f.size) : "—"} • {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : ""}
                                </p>
                            </div>
                        </div>

                        {/* Desktop Columns */}
                        <div className="hidden md:block md:col-span-2 py-2 px-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {f.owner || "—"}
                        </div>
                        <div className="hidden md:block md:col-span-2 py-2 px-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : "—"}
                        </div>
                        <div className="hidden md:block md:col-span-1 py-2 px-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {f.size ? formatBytes(f.size) : "—"}
                        </div>

                        {/* Actions */}
                        <div className="col-span-5 md:col-span-2 py-2 px-2 md:px-4 flex justify-center items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 md:h-8 md:w-8 hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4 text-gray-600 dark:text-gray-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => onUploadTo(f.mimeType === 'application/vnd.google-apps.folder' ? f.id : currentFolderId)} className="cursor-pointer py-2.5">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload here
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onPreview(f)} className="cursor-pointer py-2.5">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDownload(f.id, f.name)} className="cursor-pointer py-2.5">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a href={f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`} target="_blank" rel="noreferrer" className="cursor-pointer py-2.5">
                                            <Link className="w-4 h-4 mr-2" />
                                            Open in Drive
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        const link = f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`
                                        navigator.clipboard.writeText(link)
                                        toast.success("Link copied to clipboard")
                                    }} className="cursor-pointer py-2.5">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(f.id)} className="text-red-600 cursor-pointer py-2.5">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
