import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bell, Bot, Brain, CalendarDays, CheckCircle2, ChevronRight, Droplets, Dumbbell, Flame, Goal, HeartPulse, MessageCircle, Moon, Pin, Send, Sparkles, Target, TrendingUp, Zap } from 'lucide-react'
import { getAtlasState } from './core/atlasStore'
import { buildCoachPlatformViewModel, coachPersonalities, goalTypes } from './core/aiCoachPlatform'
import './aiCoachPlatform.css'

const tabs = ['Dashboard', 'Daily Brief', 'Chat', 'Timeline', 'Recommendations', 'Weekly Review', 'Monthly Review']

export default function AppAICoach() {
  const [tab, setTab] = useState('Dashboard')
  const [messages, setMessages] = useState([{ role: 'coach', text: 'I am ready to coach from your structured ATLAS context. Connect an LLM provider when the backend contract is approved.' }])
  const vm = useMemo(() => buildCoachPlatformViewModel(getAtlasState(), { name: 'Robert' }), [])
  return <div className="ai-coach-shell">
    <aside className="ai-coach-rail" aria-label="ASKR Coach navigation">
      <div className="ai-brand"><img src="/assets/branding/logos/askr-wordmark-horizontal.png" alt="ASKR"/></div>
      <nav>{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <div className="ai-personality"><span>Personality architecture</span>{Object.values(coachPersonalities).map(p => <b key={p.id}>{p.label}</b>)}</div>
    </aside>
    <main className="ai-coach-main">
      <header className="ai-top"><div><span>AI operating system</span><h1>{tab}</h1><p>Proactive coaching layer for training, nutrition, recovery, goals, habits and progress.</p></div><button aria-label="AI notifications"><Bell size={20}/></button></header>
      {tab === 'Dashboard' && <Dashboard vm={vm} setTab={setTab}/>} {tab === 'Daily Brief' && <DailyBrief vm={vm}/>} {tab === 'Chat' && <Chat vm={vm} messages={messages} setMessages={setMessages}/>} {tab === 'Timeline' && <Timeline vm={vm}/>} {tab === 'Recommendations' && <Recommendations vm={vm}/>} {tab === 'Weekly Review' && <Review title="Weekly Review" items={vm.weeklyReview}/>} {tab === 'Monthly Review' && <Review title="Monthly Review" items={vm.monthlyReview}/>} 
    </main>
  </div>
}

function Dashboard({ vm, setTab }) { const d = vm.dashboard; return <div className="ai-grid">
  <section className="ai-hero span-8"><span><Sparkles size={16}/> Today's Recommendation</span><h2>{d.recommendation}</h2><p>{d.readinessSummary}. The coach guides, explains, motivates, educates, adapts and predicts instead of only answering questions.</p><div><button onClick={() => setTab('Daily Brief')}><CalendarDays size={18}/> Open daily brief</button><button onClick={() => setTab('Chat')}><MessageCircle size={18}/> Quick chat</button></div></section>
  <Metric icon={HeartPulse} label="Readiness" value={d.readinessSummary}/><Metric icon={Dumbbell} label="Training" value={d.training}/><Metric icon={Flame} label="Nutrition" value={d.nutrition}/><Metric icon={Moon} label="Recovery" value={d.recovery}/>
  <Card title="Goal Progress" icon={Goal}><div className="ai-progress"><span style={{width:`${d.goalProgress}%`}}/></div><b>{d.goalProgress}% toward current goal</b></Card>
  <Card title="Today's Priorities" icon={Target}>{d.priorities.map(x => <Chip key={x}>{x}</Chip>)}</Card>
  <Card title="Consistency Score" icon={CheckCircle2}><strong className="big-score">{d.consistency}</strong><p>Habit momentum with room for hydration and sleep consistency.</p></Card>
  <Card title="AI Insights" icon={Brain}>{d.insights.map(x => <p key={x}>• {x}</p>)}</Card>
  <Card title="Suggested Actions" icon={Zap}>{d.actions.map(x => <button className="ghost" key={x}>{x}<ChevronRight size={16}/></button>)}</Card>
  <Card title="Decision Engine" icon={Activity}><p>{vm.decisionModel.status}</p><small>{vm.decisionModel.inputs.join(' · ')}</small></Card>
</div> }
function DailyBrief({ vm }) { return <div className="ai-grid">{vm.dailyBrief.map((item, i) => <Card key={item} title={item} icon={[Dumbbell,HeartPulse,Flame,Droplets,Sparkles,Target,AlertTriangle,Brain][i]}><p>Placeholder slot for future AI-generated coaching text sourced from structured context, not hardcoded provider responses.</p></Card>)}</div> }
function Chat({ vm, messages, setMessages }) { const [text,setText]=useState(''); const prompts=['Coach my day','Explain today’s tradeoff','What should I focus on?','Prepare weekly review']; function send(v=text){ if(!v.trim())return; setMessages(m=>[...m,{role:'user',text:v},{role:'coach',text:'Streaming-ready placeholder: a provider adapter will generate coaching from context, memory and sources.'}]); setText('') } return <div className="chat-layout"><section className="context-strip"><Card title="Context cards" icon={Brain}><p>Workout, nutrition, recovery, progress, profile, goals and preferences are centralized.</p></Card><Card title="Pinned advice" icon={Pin}><p>Keep the main thing visible: execute, recover, repeat.</p></Card><Card title="Source references" icon={Sparkles}><p>Workout Platform · Nutrition Platform · Recovery Platform · Progress Platform</p></Card></section><section className="chat-panel" aria-label="Coach conversation"><div>{messages.map((m,i)=><article key={i} className={m.role}><span>{m.role}</span><p>{m.text}</p></article>)}<article className="coach typing"><span>coach</span><p>Typing indicator ready for streamed deltas…</p></article></div><div className="prompt-row">{prompts.map(p=><button key={p} onClick={()=>send(p)}>{p}</button>)}</div><form onSubmit={e=>{e.preventDefault();send()}}><input value={text} onChange={e=>setText(e.target.value)} aria-label="Message ASKR Coach" placeholder="Ask for coaching, not just an answer…"/><button><Send size={18}/></button></form></section></div> }
function Timeline({ vm }) { return <div className="timeline">{vm.timeline.map(([title,detail,type],i)=><article key={title}><span>{i+1}</span><div><b>{title}</b><p>{detail}</p><small>{type}</small></div></article>)}</div> }
function Recommendations({ vm }) { return <div className="ai-grid">{vm.recommendations.map(x=><Card key={x} title={x} icon={Sparkles}><p>Reusable recommendation card prepared for future engine ranking, confidence and action routing.</p></Card>)}<Card title="Goal intelligence models" icon={Goal}>{goalTypes.map(g=><Chip key={g}>{g.replaceAll('_',' ')}</Chip>)}</Card><Card title="Progress analysis cards" icon={TrendingUp}>{vm.analyses.map(x=><p key={x}>• {x}</p>)}</Card><Card title="AI notifications" icon={Bell}>{vm.notifications.map(x=><Chip key={x}>{x}</Chip>)}</Card></div> }
function Review({ title, items }) { return <div className="review-page"><h2>{title}</h2><div className="ai-grid">{items.map(x=><Card key={x} title={x} icon={CalendarDays}><p>Premium AI placeholder ready for generated summary, trend explanation and suggested focus.</p></Card>)}</div></div> }
function Card({ title, icon: Icon=Sparkles, children }) { return <section className="ai-card"><h3><Icon size={18}/>{title}</h3>{children}</section> }
function Metric({ icon: Icon, label, value }) { return <article className="ai-metric"><Icon size={20}/><span>{label}</span><strong>{value}</strong></article> }
function Chip({ children }) { return <span className="ai-chip">{children}</span> }
