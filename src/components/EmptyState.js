export default function EmptyState({ message = "No data yet", action }) {
  return (
    <div className="text-center py-12 px-4 text-gray-500 border rounded-lg bg-gray-50">
      <div className="text-3xl mb-2">??</div>
      <p className="text-base font-medium text-gray-700">{message}</p>
      {action && <p className="text-xs text-gray-500 mt-1">{action}</p>}
    </div>
  )
}
