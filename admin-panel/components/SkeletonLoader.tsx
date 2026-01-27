'use client';

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="p-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-50 border rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/2" />
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
        </div>
      ))}
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/3" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
