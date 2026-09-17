import { FolderIcon } from "@/components/icons"

export default function EmptyState({ message = "No data yet", action }) {
  return (
    <div className="text-center py-12 px-4 text-gray-500 border border-gray-200 rounded-lg bg-gray-50/50">
      <div className="flex justify-center mb-2 text-gray-400">
        <FolderIcon className="w-10 h-10" />
      </div>
      <p className="text-base font-medium text-gray-700">{message}</p>
      {action && <p className="text-xs text-gray-500 mt-1">{action}</p>}
    </div>
  )
}
