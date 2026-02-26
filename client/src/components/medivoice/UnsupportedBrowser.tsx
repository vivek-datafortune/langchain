import { AlertCircle } from 'lucide-react'

export interface UnsupportedBrowserProps {
  error?: string | null
}

export function UnsupportedBrowser({ error }: UnsupportedBrowserProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-xl">
        <AlertCircle size={40} className="text-red-400" />
        <h2 className="text-lg font-semibold text-red-300">Browser Not Supported</h2>
        <p className="text-sm text-red-300/60">
          {error ||
            'Web Speech API is not available in this browser. Please use Chrome or Edge.'}
        </p>
      </div>
    </div>
  )
}
