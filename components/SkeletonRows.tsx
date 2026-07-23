export default function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 rounded bg-gray-200 animate-pulse"
                style={{ width: j === 0 ? "60%" : j === cols - 1 ? "40%" : "80%", opacity: 1 - i * 0.15 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
