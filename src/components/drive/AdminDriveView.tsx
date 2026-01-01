"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { HardDrive, Search, FolderPlus } from 'lucide-react'
import { Breadcrumbs } from "@/components/drive/Breadcrumbs"
import { DriveFileList, DriveFile } from "@/components/drive/DriveFileList"
import { TransferStatus } from "@/components/drive/TransferStatus"
import { createClient } from "@/lib/supabase/client"

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

interface AdminDriveViewProps {
    userId: string
}

export function AdminDriveView({ userId }: AdminDriveViewProps) {
    const supabase = createClient()
    const [connectedAt, setConnectedAt] = useState<string | null>(null)
    const [files, setFiles] = useState<DriveFile[]>([])
    const [folders, setFolders] = useState<DriveFile[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
        { id: null, name: 'My Drive' },
    ])
    const [loading, setLoading] = useState(false)
    const [storageInfo, setStorageInfo] = useState<{ used: string | null, total: string | null }>({ used: null, total: null })
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' }>({
        key: 'name',
        direction: 'ascending',
    });

    const [searchQuery, setSearchQuery] = useState<string>('')
    const [searching, setSearching] = useState<boolean>(false)
    const [listAnimating, setListAnimating] = useState<boolean>(false)
    const listRetryRef = useRef<Record<string, number>>({})
    const storageProgressRef = useRef<HTMLDivElement | null>(null)

    const [transfers, setTransfers] = useState<Record<string, { id: string; type: 'upload' | 'download' | 'delete'; name: string; progress: number; status: 'running' | 'done' | 'error' }>>({})

    function getAdminToken() {
        return localStorage.getItem("adminToken") || ""
    }

    function addTransfer(type: 'upload' | 'download' | 'delete', name: string) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        setTransfers((prev) => ({ ...prev, [id]: { id, type, name, progress: 0, status: 'running' } }))
        return id
    }

    function updateTransfer(id: string, patch: Partial<{ progress: number; status: 'running' | 'done' | 'error' }>) {
        setTransfers((prev) => {
            const existing = prev[id]
            if (!existing) return prev
            const updated = { ...existing, ...patch }
            return { ...prev, [id]: updated }
        })
        if (patch.status === 'done' || patch.status === 'error') {
            setTimeout(() => {
                setTransfers((prev) => {
                    const copy = { ...prev }
                    delete copy[id]
                    return copy
                })
            }, 3000)
        }
    }

    async function fetchDriveData(
        id: string,
        parentId: string | null = null,
        search: string | null = null,
        options?: { suppressLoading?: boolean; updateStorage?: boolean },
    ) {
        const suppressLoading = options?.suppressLoading ?? false
        const updateStorage = options?.updateStorage ?? false
        try {
            if (suppressLoading) setListAnimating(true)
            if (!suppressLoading) setLoading(true)

            const url = new URL(`/api/google/list`, location.origin)
            url.searchParams.set('userId', id)
            if (parentId) url.searchParams.set('parentId', parentId)
            if (search && search.trim().length > 0) url.searchParams.set('search', search.trim())

            const fileRes = await fetch(url.toString(), {
                headers: { 'x-admin-token': getAdminToken() }
            })

            if (!fileRes.ok) {
                console.error('[AdminDrive] List API failed:', fileRes.status, fileRes.statusText)
                toast.error(`Failed to fetch files: ${fileRes.statusText}`)
                setFiles([])
                if (!suppressLoading) setLoading(false)
                if (suppressLoading) setListAnimating(false)
                return
            }

            const fileBody = await fileRes.json()
            console.log('[AdminDrive] List API response:', fileBody)

            if (!fileBody.success) {
                console.error('[AdminDrive] List API error:', fileBody.message)
                toast.error(fileBody.message || "Failed to list Drive files")
                setFiles([])
            } else {
                const rawFiles = fileBody.files?.files ?? fileBody.files ?? []
                const normalizedFiles: DriveFile[] = rawFiles.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    mimeType: f.mimeType,
                    size: f.size,
                    modifiedTime: f.modifiedTime || null,
                    webViewLink: f.webViewLink || null,
                    owner: (f.owners && f.owners[0] && f.owners[0].displayName) ? f.owners[0].displayName : 'You',
                }))
                setFiles(normalizedFiles)
                const folderList = normalizedFiles.filter((x) => x.mimeType === 'application/vnd.google-apps.folder')
                setFolders(folderList)

                // Retry logic for consistency
                try {
                    const parentKey = parentId ?? 'root'
                    const tries = listRetryRef.current[parentKey] ?? 0
                    if (normalizedFiles.length === 0 && !suppressLoading && tries < 1) {
                        listRetryRef.current[parentKey] = tries + 1
                        await new Promise((r) => setTimeout(r, 500))
                        const retryUrl = new URL(`/api/google/list`, location.origin)
                        retryUrl.searchParams.set('userId', id)
                        if (parentId) retryUrl.searchParams.set('parentId', parentId)
                        const retryRes = await fetch(retryUrl.toString(), {
                            headers: { 'x-admin-token': getAdminToken() }
                        })
                        const retryBody = await retryRes.json()
                        if (retryBody.success) {
                            const retryRaw = retryBody.files?.files ?? retryBody.files ?? []
                            const retryNormalized: DriveFile[] = retryRaw.map((f: any) => ({
                                id: f.id,
                                name: f.name,
                                mimeType: f.mimeType,
                                size: f.size,
                                modifiedTime: f.modifiedTime || null,
                                webViewLink: f.webViewLink || null,
                                owner: (f.owners && f.owners[0] && f.owners[0].displayName) ? f.owners[0].displayName : 'You',
                            }))
                            if (retryNormalized.length > 0) {
                                setFiles(retryNormalized)
                                setFolders(retryNormalized.filter((x) => x.mimeType === 'application/vnd.google-apps.folder'))
                            }
                        }
                    }
                } catch (e) { /* ignore */ }
            }

            if (updateStorage) {
                const storageRes = await fetch(`/api/google/storage?userId=${encodeURIComponent(id)}`, {
                    headers: { 'x-admin-token': getAdminToken() }
                })
                const storageBody = await storageRes.json()
                if (storageBody.success && storageBody.storageQuota) {
                    setStorageInfo({
                        used: storageBody.storageQuota.usage,
                        total: storageBody.storageQuota.limit,
                    })
                }
            }
        } catch (err) {
            console.error("[MSA] drive data fetch error", err)
            toast("Failed to fetch Drive data")
        } finally {
            if (!suppressLoading) setLoading(false)
            if (suppressLoading) setListAnimating(false)
        }
    }

    useEffect(() => {
        if (!userId) return
        setSearching(true)
        const t = setTimeout(async () => {
            try {
                await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: true, updateStorage: false })
            } finally {
                setSearching(false)
            }
        }, 400)
        return () => clearTimeout(t)
    }, [searchQuery, currentFolderId, userId])

    const checkStatus = async () => {
        if (!userId) return
        try {
            const res = await fetch("/api/admin/get-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": getAdminToken()
                },
                body: JSON.stringify({ userId }),
            })

            if (!res.ok) return

            const body = await res.json()

            if (body.success && body.user) {
                const profile = body.user
                const newConnectedAt = profile.google_connected_at ?? null

                // Detect change in connection status
                if (newConnectedAt !== connectedAt) {
                    setConnectedAt(newConnectedAt)
                    const appFolderId = profile.google_app_folder_id ?? null

                    if (newConnectedAt) {
                        // User just connected or re-connected
                        if (appFolderId) {
                            setBreadcrumbs([{ id: appFolderId, name: 'GEOINFORMATIC' }])
                            setCurrentFolderId(appFolderId)
                            await fetchDriveData(userId, appFolderId, searchQuery || null, { suppressLoading: false, updateStorage: true })
                        } else {
                            await fetchDriveData(userId, null, searchQuery || null, { suppressLoading: false, updateStorage: true })
                        }
                        toast.success("User connected to Google Drive")
                    } else {
                        // User disconnected
                        setFiles([])
                        setFolders([])
                        setStorageInfo({ used: null, total: null })
                        toast.info("User disconnected from Google Drive")
                    }
                }
            }
        } catch (err) {
            console.error("[AdminDrive] Status check error", err)
        }
    }

    useEffect(() => {
        // Initial check
        checkStatus()

        // Poll every 5 seconds
        const interval = setInterval(checkStatus, 5000)
        return () => clearInterval(interval)
    }, [userId, connectedAt]) // Add connectedAt dependency to correctly detect changes

    async function refresh() {
        if (!userId) return
        await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: false, updateStorage: true })
        toast("Refreshed")
    }

    async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !userId) return
        try {
            await uploadFileTo(file, currentFolderId)
        } catch (err) {
            console.error('upload err', err)
        }
    }

    async function downloadFile(fileId: string, name?: string) {
        if (!userId) return
        const transferId = addTransfer('download', name || 'file')
        try {
            const res = await fetch(`/api/google/download?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(fileId)}`, {
                headers: { 'x-admin-token': getAdminToken() }
            })
            if (!res.ok) {
                updateTransfer(transferId, { status: 'error' })
                toast('Download failed')
                return
            }

            const contentLength = res.headers.get('content-length')
            if (res.body && contentLength) {
                const total = parseInt(contentLength, 10)
                const reader = res.body.getReader()
                const chunks: Uint8Array[] = []
                let received = 0
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    if (value) {
                        chunks.push(value)
                        received += value.byteLength
                        const p = Math.round((received / total) * 100)
                        updateTransfer(transferId, { progress: p })
                    }
                }
                const combined = new Uint8Array(received)
                let offset = 0
                for (const chunk of chunks) {
                    combined.set(chunk, offset)
                    offset += chunk.byteLength
                }
                const blob = new Blob([combined.buffer], { type: res.headers.get('content-type') || 'application/octet-stream' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = name || 'file'
                document.body.appendChild(a)
                a.click()
                a.remove()
                setTimeout(() => URL.revokeObjectURL(url), 60000)
                updateTransfer(transferId, { progress: 100, status: 'done' })
                toast.success('Download complete')
                return
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = name || 'file'
            document.body.appendChild(a)
            a.click()
            a.remove()
            setTimeout(() => URL.revokeObjectURL(url), 60000)
            updateTransfer(transferId, { progress: 100, status: 'done' })
            toast.success('Download complete')
        } catch (err) {
            console.error('download err', err)
            updateTransfer(transferId, { status: 'error' })
            toast.error('Download failed')
        }
    }

    async function uploadFileTo(file: File, parentId?: string | null) {
        if (!file || !userId) return

        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                try {
                    const result = reader.result as string
                    const base64 = result.split(',')[1]
                    const payloadObj: any = { userId, name: file.name, mimeType: file.type, data: base64 }
                    if (parentId) payloadObj.parentId = parentId
                    const payload = JSON.stringify(payloadObj)

                    const transferId = addTransfer('upload', file.name)
                    const xhr = new XMLHttpRequest()
                    xhr.open('POST', '/api/google/upload')
                    xhr.setRequestHeader('Content-Type', 'application/json')
                    xhr.setRequestHeader('x-admin-token', getAdminToken()) // Admin Token
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const p = Math.round((e.loaded / e.total) * 100)
                            updateTransfer(transferId, { progress: p })
                        }
                    }
                    xhr.onload = async () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const body = JSON.parse(xhr.responseText)
                                if (body.success) {
                                    updateTransfer(transferId, { progress: 100, status: 'done' })
                                    toast.success('Upload succeeded')
                                    if (body.file) {
                                        const nf: DriveFile = {
                                            id: body.file.id,
                                            name: body.file.name || file.name,
                                            mimeType: body.file.mimeType || file.type || 'application/octet-stream',
                                            modifiedTime: body.file.modifiedTime || new Date().toISOString(),
                                            webViewLink: body.file.webViewLink || null,
                                            owner: 'You',
                                        }

                                        setFiles((prev) => [nf, ...prev])
                                        if (nf.mimeType === 'application/vnd.google-apps.folder') setFolders((prev) => [nf, ...prev])

                                        // Refresh logic
                                        if (userId) await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: true, updateStorage: false })
                                    }
                                    resolve()
                                } else {
                                    updateTransfer(transferId, { status: 'error' })
                                    toast.error('Upload failed')
                                    reject(body)
                                }
                            } catch (err) {
                                updateTransfer(transferId, { status: 'error' })
                                toast.error('Upload failed')
                                reject(err)
                            }
                        } else {
                            updateTransfer(transferId, { status: 'error' })
                            toast.error('Upload failed')
                            reject(new Error('Upload failed'))
                        }
                    }
                    xhr.onerror = () => {
                        updateTransfer(transferId, { status: 'error' })
                        toast.error('Upload failed')
                        reject(new Error('Network error'))
                    }
                    xhr.send(payload)
                } catch (err) {
                    console.error('reader.onload err', err)
                    toast.error('Upload failed')
                    reject(err)
                }
            }
            reader.readAsDataURL(file)
        })
    }

    function openFilePickerTo(parentId?: string | null) {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement
            const file = target.files?.[0]
            if (file) uploadFileTo(file, parentId)
        }
        input.click()
    }

    async function previewFile(file: DriveFile) {
        if (!userId) return
        try {
            if (file.webViewLink) {
                window.open(file.webViewLink, '_blank', 'noopener')
                return
            }
            // Fallback preview via download
            const res = await fetch(`/api/google/download?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(file.id)}`, {
                headers: { 'x-admin-token': getAdminToken() }
            })
            if (!res.ok) {
                toast('Failed to preview file')
                return
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank', 'noopener')
            setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch (err) {
            console.error('preview err', err)
            toast('Failed to preview file')
        }
    }

    const handleDoubleClick = async (file: DriveFile) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            await navigateIntoFolder(file)
        } else {
            await previewFile(file)
        }
    }

    const navigateIntoFolder = async (folder: DriveFile) => {
        setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
        setCurrentFolderId(folder.id)
        if (!userId) return
        setFiles([])
        setFolders([])
        await fetchDriveData(userId, folder.id, searchQuery || null, { suppressLoading: true, updateStorage: false })
    }

    async function deleteFile(fileId: string) {
        if (!userId) return
        if (!confirm('Delete this file from the user\'s Google Drive?')) return
        const fileName = files.find((x) => x.id === fileId)?.name || 'Deleting file'
        const transferId = addTransfer('delete', fileName)
        try {
            const res = await fetch('/api/google/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': getAdminToken()
                },
                body: JSON.stringify({ userId, fileId }),
            })
            const body = await res.json()
            if (!body.success) {
                updateTransfer(transferId, { status: 'error' })
                toast.error('Delete failed')
            } else {
                updateTransfer(transferId, { progress: 100, status: 'done' })
                toast.success('Deleted')
                setFiles((prev) => prev.filter((f) => f.id !== fileId))
                setFolders((prev) => prev.filter((f) => f.id !== fileId))
                if (userId) fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: true, updateStorage: false }).catch(() => { })
            }
        } catch (err) {
            console.error('delete err', err)
            updateTransfer(transferId, { status: 'error' })
            toast.error('Delete failed')
        }
    }

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedFiles = [...files].sort((a: any, b: any) => {
        const isAscending = sortConfig.direction === 'ascending';
        const key = sortConfig.key;
        if (key === 'name') return a.name.localeCompare(b.name) * (isAscending ? 1 : -1);
        if (key === 'modifiedTime') return (new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime()) * (isAscending ? 1 : -1);
        if (key === 'size') {
            const sizeA = a.size ? parseInt(a.size) : isAscending ? -Infinity : Infinity;
            const sizeB = b.size ? parseInt(b.size) : isAscending ? -Infinity : Infinity;
            return (sizeA - sizeB) * (isAscending ? 1 : -1);
        }
        return 0;
    });

    const usedStorage = storageInfo.used ? parseInt(storageInfo.used) : 0;
    const totalStorage = storageInfo.total ? parseInt(storageInfo.total) : 1;
    const storagePercentage = totalStorage > 0 ? ((usedStorage / totalStorage) * 100).toFixed(2) : '0';

    useEffect(() => {
        if (storageProgressRef.current) {
            storageProgressRef.current.style.width = `${storagePercentage}%`
        }
    }, [storagePercentage])

    return (
        <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-[600px] rounded-xl">
            <TransferStatus transfers={transfers} />

            <div className="p-4 md:p-6">
                <Card className="shadow-xl border-t-4 border-blue-600 dark:border-blue-400 overflow-hidden">
                    {/* Simplified Header for Admin */}
                    <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Drive Access</h2>
                                <p className="text-sm text-gray-500">Manage user files and folders</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`/api/debug/drive-status?userId=${userId}`, {
                                            headers: { 'x-admin-token': getAdminToken() }
                                        })
                                        const data = await res.json()
                                        alert(JSON.stringify(data, null, 2))
                                    } catch (e) {
                                        alert('Debug failed: ' + e)
                                    }
                                }}
                            >
                                Debug Connection
                            </Button>
                            <Button variant="outline" size="sm" onClick={refresh}>Refresh</Button>
                        </div>
                    </div>

                    <CardContent className="p-3 md:p-6">
                        {/* Status & Storage */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-blue-100 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Connection Status:</span>
                                    <span className={`font-semibold ml-2 ${connectedAt ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {connectedAt ? `✓ Connected` : "✗ Not connected"}
                                    </span>
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4">
                                <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
                                    <span>Storage Usage</span>
                                    <span>{storageInfo.used ? `${formatBytes(usedStorage)} / ${formatBytes(totalStorage)}` : '—'}</span>
                                </div>
                                {storageInfo.used && (
                                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                                        <div ref={storageProgressRef} className="h-full bg-blue-500 rounded-full transition-all duration-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col gap-3 mb-4">
                            <Breadcrumbs
                                items={breadcrumbs}
                                onNavigate={async (idx) => {
                                    const newCrumbs = breadcrumbs.slice(0, idx + 1)
                                    setBreadcrumbs(newCrumbs)
                                    const targetId = breadcrumbs[idx].id ?? null
                                    setCurrentFolderId(targetId)
                                    if (userId) await fetchDriveData(userId, targetId, searchQuery || null, { suppressLoading: true, updateStorage: false })
                                }}
                            />

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={async () => {
                                        const name = prompt('New folder name')
                                        if (!name || !userId) return
                                        try {
                                            const res = await fetch('/api/google/create-folder', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-admin-token': getAdminToken()
                                                },
                                                body: JSON.stringify({ userId, folderName: name, parentId: currentFolderId || undefined }),
                                            })
                                            const body = await res.json()
                                            if (!body.success) {
                                                toast('Failed to create folder')
                                                return
                                            }
                                            toast('Folder created')
                                            if (body.folder) {
                                                const nf: DriveFile = {
                                                    id: body.folder.id,
                                                    name: body.folder.name || name,
                                                    mimeType: body.folder.mimeType || 'application/vnd.google-apps.folder',
                                                    modifiedTime: body.folder.modifiedTime || new Date().toISOString(),
                                                    webViewLink: body.folder.webViewLink || null,
                                                    owner: 'You',
                                                }
                                                setFiles((prev) => [nf, ...prev])
                                                setFolders((prev) => [nf, ...prev])
                                            }
                                            if (userId) await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: true, updateStorage: false })
                                        } catch (err) {
                                            console.error('create folder err', err)
                                            toast('Failed to create folder')
                                        }
                                    }}
                                >
                                    <FolderPlus className="w-4 h-4" /> New folder
                                </Button>

                                <div className="relative w-full sm:flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searching ? 'Searching...' : 'Search files...'}
                                        className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <DriveFileList
                            files={sortedFiles}
                            loading={loading}
                            listAnimating={listAnimating}
                            sortConfig={sortConfig}
                            onSort={requestSort}
                            onDoubleClick={handleDoubleClick}
                            onUploadTo={openFilePickerTo}
                            onPreview={previewFile}
                            onDownload={downloadFile}
                            onDelete={deleteFile}
                            currentFolderId={currentFolderId}
                            connectedAt={connectedAt}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
