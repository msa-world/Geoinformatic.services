"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserOnce } from "@/lib/supabase/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { HardDrive, Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import { DriveHeader } from "@/components/drive/DriveHeader"
import { Breadcrumbs } from "@/components/drive/Breadcrumbs"
import type { DriveFile } from "@/components/drive/DriveFileList"

// Dynamically load large UI pieces to reduce initial bundle size on mobile
const DriveFileList = dynamic(
  () => import('@/components/drive/DriveFileList').then((mod) => mod.DriveFileList || mod.default),
  { ssr: false, loading: () => <div className="p-4 text-center text-sm text-gray-500">Loading files…</div> }
)
const TransferStatus = dynamic(
  () => import('@/components/drive/TransferStatus').then((mod) => mod.TransferStatus || mod.default),
  { ssr: false, loading: () => null }
)

// Helper function to format file size in a human-readable way
function formatBytes(bytes: number | string, decimals = 2) {
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (num === 0 || isNaN(num)) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function ProfileDrivePage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [connectedAt, setConnectedAt] = useState<string | null>(null)
  const [scope, setScope] = useState<string | null>(null)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [folders, setFolders] = useState<DriveFile[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'My Drive' },
  ])
  const [loading, setLoading] = useState(false)
  // NEW STATE: To store Drive storage usage information
  const [storageInfo, setStorageInfo] = useState<{ used: string | null, total: string | null }>({ used: null, total: null })
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' }>({
    key: 'name',
    direction: 'ascending',
  });

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [listAnimating, setListAnimating] = useState<boolean>(false)
  // Track quick retry attempts per folder to handle Drive eventual consistency
  const listRetryRef = useRef<Record<string, number>>({})

  // ref for storage progress bar to set width at runtime (avoids inline width in JSX)
  const storageProgressRef = useRef<HTMLDivElement | null>(null)

  // Transfer tracking state for uploads/downloads
  const [transfers, setTransfers] = useState<Record<string, { id: string; type: 'upload' | 'download' | 'delete'; name: string; progress: number; status: 'running' | 'done' | 'error' }>>({})

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
      const next = { ...prev, [id]: updated }
      return next
    })
    if (patch.status === 'done' || patch.status === 'error') {
      // auto-remove after a short delay
      setTimeout(() => {
        setTransfers((prev) => {
          const copy = { ...prev }
          delete copy[id]
          return copy
        })
      }, 3000)
    }
  }

  // Function to fetch files and optionally storage information.
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

      // 1. Fetch Files (server-side search and parent filtering)
      const url = new URL(`/api/google/list`, location.origin)
      url.searchParams.set('userId', id)
      if (parentId) url.searchParams.set('parentId', parentId)
      if (search && search.trim().length > 0) url.searchParams.set('search', search.trim())
      const fileRes = await fetch(url.toString())
      const fileBody = await fileRes.json()

      if (!fileBody.success) {
        toast(fileBody.message || "Failed to list Drive files")
        setFiles([])
      } else {
        const rawFiles = fileBody.files?.files ?? fileBody.files ?? []
        // Normalize Drive API response into our local shape
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
        // extract folders for the folder picker/navigation
        const folderList = normalizedFiles.filter((x) => x.mimeType === 'application/vnd.google-apps.folder')
        setFolders(folderList)
        // If Drive returned zero items, do one quick retry for this folder
        // to handle eventual consistency after uploads/creates. Limit retries
        // to one per parent per session to avoid loops.
        try {
          const parentKey = parentId ?? 'root'
          const tries = listRetryRef.current[parentKey] ?? 0
          if (normalizedFiles.length === 0 && !suppressLoading && tries < 1) {
            listRetryRef.current[parentKey] = tries + 1
            await new Promise((r) => setTimeout(r, 500))
            const retryUrl = new URL(`/api/google/list`, location.origin)
            retryUrl.searchParams.set('userId', id)
            if (parentId) retryUrl.searchParams.set('parentId', parentId)
            const retryRes = await fetch(retryUrl.toString())
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
        } catch (e) {
          /* ignore retry errors */
        }
      }

      // 2. Optionally fetch Storage Info. Do this only on initial load or explicit refresh to avoid slow round-trips.
      if (updateStorage) {
        const storageRes = await fetch(`/api/google/storage?userId=${encodeURIComponent(id)}`)
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

  // Debounce searchQuery and call fetchDriveData when it changes
  useEffect(() => {
    if (!userId) return
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        // For searches we want snappy UI updates; suppress the heavy loading indicator and skip storage refresh
        await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: true, updateStorage: false })
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery, currentFolderId, userId])

  useEffect(() => {
    const init = async () => {
    try {
      const u = await getUserOnce()
      if (!u) return
      setUserId(u.id)

        const { data: profile } = await supabase
          .from("profiles")
          .select("google_connected_at,google_scope,google_app_folder_id")
          .eq("id", u.id)
          .single()
        if (profile) {
          setConnectedAt(profile.google_connected_at ?? null)
          setScope(profile.google_scope ?? null)
          const appFolderId = profile.google_app_folder_id ?? null
          if (profile.google_connected_at) {
            // If we have an app folder id, make it the starting folder so we only show app data
            if (appFolderId) {
              setBreadcrumbs([{ id: appFolderId, name: 'GEOINFORMATIC' }])
              setCurrentFolderId(appFolderId)
              await fetchDriveData(u.id, appFolderId, searchQuery || null, { suppressLoading: false, updateStorage: true })
            } else {
              // Initial load without explicit app folder: fetch files at default (server will attempt to create/find app folder)
              await fetchDriveData(u.id, null, searchQuery || null, { suppressLoading: false, updateStorage: true })
            }
          }
        }
      } catch (err) {
        console.error("[MSA] drive init error", err)
      }
    }

    init()
  }, [])

  async function startConnect() {
    if (!userId) return toast("Please login first")
    try {
      const res = await fetch("/api/google/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const body = await res.json()
      if (!body.success) throw new Error(body.message || "Failed to start OAuth")
      window.location.href = body.url
    } catch (err) {
      console.error(err)
      toast("Failed to start Google Connect")
    }
  }

  async function refresh() {
    if (!userId) return
    await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: false, updateStorage: true })
    toast("Refreshed")
  }

  async function disconnect() {
    if (!userId) return
    try {
      const res = await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const body = await res.json()
      if (!body.success) {
        console.error('disconnect failed', body)
        toast('Disconnect failed')
        return
      }
      setConnectedAt(null)
      setScope(null)
      setFiles([])
      setStorageInfo({ used: null, total: null }) // Clear storage info
      toast('Disconnected from Google Drive')
    } catch (err) {
      console.error('[MSA] disconnect error', err)
      toast('Failed to disconnect')
    }
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
      const res = await fetch(`/api/google/download?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(fileId)}`)
      if (!res.ok) {
        let payload: any = null
        try { payload = await res.json() } catch (e) { /* ignore */ }
        console.error('download failed', payload)
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

                    const returnedParents: string[] = Array.isArray(body.file.parents) ? body.file.parents : []
                    const viewingFolder = currentFolderId
                    const appFolderId = breadcrumbs && breadcrumbs[0] ? breadcrumbs[0].id : null

                    const parentIncludesCurrent = viewingFolder ? returnedParents.includes(viewingFolder) : (appFolderId ? returnedParents.includes(appFolderId) : true)

                    if (parentIncludesCurrent) {
                      if (userId) await fetchDriveData(userId, currentFolderId, searchQuery || null, { suppressLoading: true, updateStorage: false })
                    } else {
                      const parentStr = returnedParents.length > 0 ? returnedParents[0] : 'unknown'
                      toast.success('Upload succeeded — showing new item (parent: ' + parentStr + '). Refresh to sync.')
                    }
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
      reader.onerror = (e) => {
        console.error('file read error', e)
        toast.error('Upload failed')
        reject(e)
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

      const res = await fetch(`/api/google/download?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(file.id)}`)
      if (!res.ok) {
        let payload: any = null
        try { payload = await res.json() } catch (e) { /* ignore */ }
        console.error('preview fetch failed', payload)
        toast(payload?.message || 'Failed to preview file')
        return
      }

      const contentType = res.headers.get('content-type') || ''
      const blob = await res.blob()

      if (contentType.startsWith('image/') || contentType === 'application/pdf' || contentType.startsWith('text/') || contentType.startsWith('audio/') || contentType.startsWith('video/')) {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name || 'file'
      document.body.appendChild(a)
      a.click()
      a.remove()
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
    if (!confirm('Delete this file from your Google Drive?')) return
    const fileName = files.find((x) => x.id === fileId)?.name || 'Deleting file'
    const transferId = addTransfer('delete', fileName)
    try {
      const res = await fetch('/api/google/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fileId }),
      })
      const body = await res.json()
      if (!body.success) {
        console.error('delete failed', body)
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

    if (key === 'name') {
      return a.name.localeCompare(b.name) * (isAscending ? 1 : -1);
    }
    if (key === 'modifiedTime') {
      const dateA = new Date(a.modifiedTime).getTime();
      const dateB = new Date(b.modifiedTime).getTime();
      return (dateA - dateB) * (isAscending ? 1 : -1);
    }
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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <TransferStatus transfers={transfers} />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <Card className="shadow-2xl border-t-4 border-blue-600 dark:border-blue-400 overflow-hidden">
          <DriveHeader
            connectedAt={connectedAt}
            loading={loading}
            onConnect={startConnect}
            onRefresh={refresh}
            onDisconnect={disconnect}
          />

          <CardContent className="p-3 md:p-6">
            <div className="mb-4 bg-blue-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Status:</span>
                <span className={`font-semibold ml-2 ${connectedAt ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {connectedAt ? `✓ Connected` : "✗ Not connected"}
                </span>
                {connectedAt && (
                  <span className="block md:inline text-xs mt-1 md:mt-0 md:ml-2 text-gray-600 dark:text-gray-400">
                    {new Date(connectedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>

            {/* Storage Usage Section */}
            <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4">
              <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Storage</span>
                </div>
                <div className="whitespace-nowrap text-right">
                  {storageInfo.used && storageInfo.total ? (
                    <span className="text-gray-800 dark:text-gray-200">
                      {formatBytes(usedStorage)} <span className="hidden sm:inline">of</span><span className="sm:hidden">/</span> {formatBytes(totalStorage)}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
              </div>
              {storageInfo.used && storageInfo.total && (
                <div className="w-full">
                  <div className="w-full h-2.5 md:h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden shadow-inner">
                    <div
                      ref={storageProgressRef}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    />
                  </div>
                  <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1.5">{storagePercentage}% used</p>
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col gap-2">
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
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                  onClick={async () => {
                    const name = prompt('New folder name')
                    if (!name || !userId) return
                    try {
                      const res = await fetch('/api/google/create-folder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, folderName: name, parentId: currentFolderId || undefined }),
                      })
                      const body = await res.json()
                      if (!body.success) {
                        console.error('create folder failed', body)
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
                  📁 New folder
                </Button>

                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searching ? 'Searching...' : 'Search files...'}
                    className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow"
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
