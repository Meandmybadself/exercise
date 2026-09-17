export function NotFound({ what }: { what: string }) {
  return (
    <div className="screen">
      <div className="empty">{what} not found.</div>
    </div>
  )
}
