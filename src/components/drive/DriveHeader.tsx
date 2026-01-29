import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Link, Loader2, LogOut, Menu } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DriveHeaderProps {
  connectedAt: string | null
  loading: boolean
  onConnect: () => void
  onRefresh: () => void
  onDisconnect: () => void
}

export function DriveHeader({ connectedAt, loading, onConnect, onRefresh, onDisconnect }: DriveHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2 px-4 md:px-6 border-b">
      <CardTitle className="text-lg md:text-2xl font-bold flex items-center gap-2">
        <Link className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
        <span className="truncate">Google Drive</span>
      </CardTitle>

      {/* Desktop Actions */}
      <div className="hidden md:flex gap-3">
        <Button
          onClick={onConnect}
          disabled={!!connectedAt}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          Connect Drive
        </Button>
        <Button
          onClick={onRefresh}
          variant="outline"
          disabled={!connectedAt || loading}
          className="flex items-center gap-1"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Refresh
        </Button>
        <Button
          onClick={onDisconnect}
          variant="destructive"
          disabled={!connectedAt}
          className="flex items-center gap-1"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </div>

      {/* Mobile Actions Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onConnect} disabled={!!connectedAt} className="py-2.5">
              <Link className="w-4 h-4 mr-2" />
              Connect Drive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRefresh} disabled={!connectedAt || loading} className="py-2.5">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!loading && <span className="w-4 h-4 mr-2" />}
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDisconnect} disabled={!connectedAt} className="text-red-600 py-2.5">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
  )
}
