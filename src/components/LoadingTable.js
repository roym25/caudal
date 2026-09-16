export default function LoadingTable({ columns = 4, rows = 5 }) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="border p-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} className="border p-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
