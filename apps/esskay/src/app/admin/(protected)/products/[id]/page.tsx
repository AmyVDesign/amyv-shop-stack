export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="px-6 py-8">
      <p className="text-xs font-mono text-site-muted mb-2">{id}</p>
      <p className="text-site-muted text-sm">Coming in a later phase.</p>
    </div>
  )
}
