import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'
import { Card } from './Card'

export function Section({ title, children }: PropsWithChildren<{ title: string }>) { return <section className="section"><h2>{title}</h2>{children}</section> }
export function List({ children }: PropsWithChildren) { return <div className="list">{children}</div> }
export function ProgressBar({ value, label }: { value: number; label: string }) { const safeValue = Math.max(0, Math.min(100, value)); return <div className="progress"><span>{label}</span><div role="progressbar" aria-label={label} aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${safeValue}%` }}/></div></div> }
export function ProgressRing({ value, label }: { value: number; label: string }) { const safeValue = Math.max(0, Math.min(100, value)); return <div className="progress-ring" style={{ '--progress': `${safeValue * 3.6}deg` } as CSSProperties}><strong>{safeValue}</strong><span>{label}</span></div> }
export function MetricCard({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) { return <Card className="metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</Card> }
export const StatCard = MetricCard
export const WeatherCard = MetricCard
export const GoalCard = MetricCard
export const TripCard = MetricCard
export const AICard = MetricCard

export function Modal({ title, children, onClose }: PropsWithChildren<{ title: string; onClose: () => void }>) { return <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={onClose} aria-label="Stäng">×</button></header>{children}</section></div> }
export function BottomSheet(props: PropsWithChildren<{ title: string; onClose: () => void }>) { return <Modal {...props}/>} 
