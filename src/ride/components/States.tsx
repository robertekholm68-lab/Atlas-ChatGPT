import { Card } from './Card'

export function EmptyState({ title = 'Inget här ännu' }: { title?: string }) { return <Card className="state"><strong>{title}</strong><span>Innehåll läggs till i en kommande fas.</span></Card> }
export function LoadingState() { return <Card className="state" role="status"><span className="loader"/><strong>Laddar</strong></Card> }
export function Skeleton() { return <span className="skeleton" aria-hidden="true"/> }
