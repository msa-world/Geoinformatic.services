"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DriveFileList, DriveFile } from "@/components/drive/DriveFileList"
import { Breadcrumbs } from "@/components/drive/Breadcrumbs"
import { Loader2, ArrowLeft, Download, Eye, HardDrive } from "lucide-react"
import { toast } from "sonner"

export default function AdminUserDrivePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [files, setFiles] = useState<DriveFile[]>([])
  const [folders, setFolders] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>("User")
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'geo-informatic' },
  ])
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' }>({
    key: 'name',
    direction: 'ascending',
  })

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        router.push("/auth/admin-login")
        return
      }
      fetchUserName()
      fetchDriveData(null)
    }
    checkAdmin()
  }, [userId])

  const fetchUserName = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken")
      const res = await fetch("/api/admin/get-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success && data.user) {
        setUserName(data.user.full_name || data.user.email)
      }
    } catch (err) {
      console.error("Error fetching user name:", err)
    }
  }

  const fetchDriveData = async (parentId: string | null) => {
    try {
      setLoading(true)
      const adminToken = localStorage.getItem("adminToken")
      const url = new URL(`/api/google/list`, location.origin)
      url.searchParams.set('userId', userId)
      if (parentId) url.searchParams.set('parentId', parentId)

      const res = await fetch(url.toString(), {
        headers: {
          "x-admin-token": adminToken || "",
        },
      })
      const data = await res.json()

      if (data.success) {
        const rawFiles = data.files?.files ?? data.files ?? []
        const normalizedFiles: DriveFile[] = rawFiles.map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          modifiedTime: f.modifiedTime || null,
          webViewLink: f.webViewLink || null,
          owner: (f.owners && f.owners[0] && f.owners[0].displayName) ? f.owners[0].displayName : 'User',
        }))
        setFiles(normalizedFiles)
        setFolders(normalizedFiles.filter((x) => x.mimeType === 'application/vnd.google-apps.folder'))
      } else {
        toast.error(data.message || "Failed to fetch files")
      }
    } catch (err) {
      console.error("Error fetching drive data:", err)
      toast.error("Failed to fetch drive data")
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (folder: DriveFile) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
    setCurrentFolderId(folder.id)
    fetchDriveData(folder.id)
  }

  const handleBreadcrumbClick = (index: number) => {
    const newCrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newCrumbs)
    const targetId = breadcrumbs[index].id
    setCurrentFolderId(targetId)
    fetchDriveData(targetId)
  }

  const handlePreview = async (file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank', 'noopener')
    } else {
      // Fallback to download/preview API if needed
      // For now, webViewLink is the standard way
      toast("No preview link available")
    }
  }

  const handleDownload = async (fileId: string, name?: string) => {
    // We can implement download via the existing download API if we pass the admin token
    // But the existing download API might check for user session.
    // Let's just open the webViewLink which usually allows download, or use the download API if modified.
    // For now, let's try to use the download API with admin token if we modify it, 
    // or just rely on webViewLink.
    // The user asked to "PREVIEW", so webViewLink is best.
    // If we want direct download, we might need to update api/google/download to accept admin token too.

    // Let's assume webViewLink is sufficient for "Preview/Access" for now.
    // If we really need direct download, we'd need to update the download route.
    const adminToken = localStorage.getItem("adminToken")
    window.open(`/api/google/download?userId=${userId}&fileId=${fileId}&adminToken=${adminToken}`, '_blank')
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

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-blue-600" />
            {userName}'s Drive
          </h1>
        </div>

        <Card className="shadow-lg border-t-4 border-blue-600">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <Breadcrumbs items={breadcrumbs} onNavigate={handleBreadcrumbClick} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DriveFileList
              files={sortedFiles}
              loading={loading}
              listAnimating={false}
              sortConfig={sortConfig}
              onSort={requestSort}
              onDoubleClick={(file) => {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                  handleNavigate(file)
                } else {
                  handlePreview(file)
                }
              }}
              onUploadTo={() => toast("Upload not available in admin view")}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onDelete={() => toast("Delete not available in admin view")}
              currentFolderId={currentFolderId}
              connectedAt={new Date().toISOString()} // Dummy date to enable actions
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
