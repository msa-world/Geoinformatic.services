"use client"

import { Button } from "@/components/ui/button"

export default function ReloadButton() {
    return (
        <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => window.location.reload()}
        >
            Check Database Status
        </Button>
    )
}
