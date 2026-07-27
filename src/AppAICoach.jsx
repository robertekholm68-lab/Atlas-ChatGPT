import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bell, Bot, Brain, CalendarDays, CheckCircle2, ChevronRight, Droplets, Dumbbell, Flame, Goal, HeartPulse, MessageCircle, Moon, Pin, Send, Sparkles, Target, TrendingUp, Zap } from 'lucide-react'
import { getAtlasState } from './core/atlasStore'
import { buildCoachPlatformViewModel, coachPersonalities, goalTypes } from './core/aiCoachPlatform'
import { CoachConversationEngine } from './engines/coach/CoachConversationEngine.js'
import './aiCoachPlatform.css'

const tabs = ['Dashboard', 'Daily Brief', 'Chat', 'Timeline', 'Recommendations', 'Weekly Review', 'Monthly Review']

export default function AppAICoach() {
  const [tab, setTab] = useState('Dashboard')
  const [messages, setMessages] = useState([{ role: 'coach', text: 'I am ready to coach from your structured ASKR context. Connect an LLM provider when the backend contract is approved.' }])
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
function Chat({ vm, messages, setMessages }) { const [text,setText]=useState(''); const [loading,setLoading]=useState(false); const [actions,setActions]=useState([]); const prompts=['Explain today’s recommendation','Suggest a workout','Review my recovery','Plan my week']; async function send(v=text){ if(!v.trim()||loading)return; const value=v.trim(); setText(''); setLoading(true); setMessages(m=>[...m,{role:'user',text:value}]); const result=await new CoachConversationEngine().respond({message:value,applicationState:getAtlasState(),decisions:getAtlasState().decisions?.current?[getAtlasState().decisions.current]:[]}); setMessages(m=>[...m,{role:'coach',text:result.text,meta:`${result.classification.intent.replaceAll('_',' ').toLowerCase()} · ${Math.round(result.classification.confidence*100)}% confidence · ${result.provider}`}]); setActions(result.proposedActions); setLoading(false) } return <div className="chat-layout"><section className="context-strip"><Card title="Minimal context" icon={Brain}><p>Only summaries required for your current request are used.</p></Card><Card title="ASKR decides" icon={Pin}><p>Coach language explains structured decisions; it never changes them.</p></Card><Card title="Offline ready" icon={Sparkles}><p>Deterministic coaching remains available without remote AI.</p></Card></section><section className="chat-panel" aria-label="Coach conversation" aria-busy={loading}><div>{messages.map((m,i)=><article key={i} className={m.role}><span>{m.role}</span><p>{m.text}</p>{m.meta&&<small>{m.meta}</small>}</article>)}{loading&&<article className="coach typing"><span>coach</span><p>Reviewing the relevant ASKR decisions…</p></article>}{actions.map(action=><article className="action-card" key={action.id}><span>Proposed change</span><p>{action.type.replaceAll('_',' ').toLowerCase()}</p><small>Review and confirm before ASKR changes any data.</small><button type="button">Review action</button></article>)}</div><div className="prompt-row">{prompts.map(p=><button key={p} onClick={()=>send(p)}>{p}</button>)}</div><label className="depth-control">Explanation depth <select defaultValue="concise"><option value="concise">Concise</option><option value="standard">Standard</option><option value="detailed">Detailed</option></select></label><form onSubmit={e=>{e.preventDefault();send()}}><input value={text} onChange={e=>setText(e.target.value)} aria-label="Message ASKR Coach" placeholder="Ask ASKR Coach…"/><button disabled={loading} aria-label="Send message"><Send size={18}/></button></form></section></div> }
function Timeline({ vm }) { return <div className="timeline">{vm.timeline.map(([title,detail,type],i)=><article key={title}><span>{i+1}</span><div><b>{title}</b><p>{detail}</p><small>{type}</small></div></article>)}</div> }
function Recommendations({ vm }) { return <div className="ai-grid">{vm.recommendations.map(x=><Card key={x} title={x} icon={Sparkles}><p>Reusable recommendation card prepared for future engine ranking, confidence and action routing.</p></Card>)}<Card title="Goal intelligence models" icon={Goal}>{goalTypes.map(g=><Chip key={g}>{g.replaceAll('_',' ')}</Chip>)}</Card><Card title="Progress analysis cards" icon={TrendingUp}>{vm.analyses.map(x=><p key={x}>• {x}</p>)}</Card><Card title="AI notifications" icon={Bell}>{vm.notifications.map(x=><Chip key={x}>{x}</Chip>)}</Card></div> }
function Review({ title, items }) { return <div className="review-page"><h2>{title}</h2><div className="ai-grid">{items.map(x=><Card key={x} title={x} icon={CalendarDays}><p>Premium AI placeholder ready for generated summary, trend explanation and suggested focus.</p></Card>)}</div></div> }
function Card({ title, icon: Icon=Sparkles, children }) { return <section className="ai-card"><h3><Icon size={18}/>{title}</h3>{children}</section> }
function Metric({ icon: Icon, label, value }) { return <article className="ai-metric"><Icon size={20}/><span>{label}</span><strong>{value}</strong></article> }
function Chip({ children }) { return <span className="ai-chip">{children}</span> }
