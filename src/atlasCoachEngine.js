export const COACH_MODES = {
  flexible: { label: 'Flexibel', prefix: 'Vi anpassar planen utan att tappa riktningen.' },
  balanced: { label: 'Balanserad', prefix: 'Vi skyddar kontinuiteten och justerar bara det som behövs.' },
  strict: { label: 'Strikt', prefix: 'Målet kräver konsekvens. Vi korrigerar planen direkt.' }
}

export const KNOWLEDGE_BASE = {
  readiness: {
    low: 'Välj vila, promenad, rörlighet eller ett kort teknikpass när total återhämtning är under 45.',
    medium: 'Minska volymen 20–30 procent och håll 2–3 repetitioner i reserv när återhämtningen är 45–69.',
    high: 'Genomför planerat pass när återhämtningen är 70 eller högre, förutsatt att smärta saknas.'
  },
  pain: 'Skarp, ökande eller lednära smärta ska inte tränas igenom. Byt övning, minska belastning och sök vård vid kvarstående eller allvarliga symtom.',
  progression: 'Höj belastningen när målreps klaras med god teknik och RPE 8 eller lägre två pass i följd. Annars öka repetitioner eller behåll vikten.',
  volume: 'Prioritera jämn veckovolym. Stora plötsliga ökningar ger ofta sämre återhämtning än gradvisa ökningar.',
  sleep: 'Kort eller avbruten sömn motiverar lägre intensitet, färre set eller teknikfokus samma dag.',
  adherence: 'Ett genomförbart program är bättre än ett perfekt program som inte följs.'
}

export const defaultProfile = {
  name: 'Robert',
  mode: 'balanced',
  goal: { title: 'Thailand', type: 'event', target: 'Bättre form och träningskapacitet', weeks: 10, progress: 42 },
  checkIn: { sleep: 7.2, energy: 7, stress: 4, soreness: 5, pain: 'none', motivation: 8 },
  recovery: { total: 78, chest: 92, back: 71, legs: 54, shoulders: 64, arms: 83, core: 76 },
  adherence: 82,
  missedSessions: 1,
  recentLoad: 68
}

export function calculateReadiness(profile) {
  const c = profile.checkIn
  const sleepScore = Math.min(100, Math.max(0, (c.sleep / 8) * 100))
  const subjective = (c.energy * 12 + c.motivation * 8 + (10 - c.stress) * 8 + (10 - c.soreness) * 5) / 3.3
  const painPenalty = c.pain === 'none' ? 0 : c.pain === 'mild' ? 12 : 32
  return Math.round(Math.max(20, Math.min(98, sleepScore * 0.35 + subjective * 0.35 + profile.recovery.total * 0.3 - painPenalty)))
}

export function buildDailyDecision(profile) {
  const readiness = calculateReadiness(profile)
  const mode = COACH_MODES[profile.mode]
  let title = 'Genomför planerat pass'
  let action = 'upper'
  let volumeChange = 0
  let reason = 'Återhämtningen och den subjektiva dagsformen stödjer normal träning.'

  if (profile.checkIn.pain === 'moderate') {
    title = 'Byt till smärtfritt alternativ'
    action = 'modify'
    volumeChange = -35
    reason = 'Du har rapporterat tydlig smärta. ATLAS prioriterar smärtfria rörelser och lägre belastning.'
  } else if (readiness < 45) {
    title = 'Återhämtningsdag'
    action = 'recovery'
    volumeChange = -100
    reason = 'Den samlade återhämtningen är för låg för ett kvalitativt styrkepass.'
  } else if (readiness < 70 || profile.recovery.legs < 55) {
    title = profile.recovery.legs < 55 ? 'Flytta benpasset' : 'Kortare kvalitetspass'
    action = 'upper-light'
    volumeChange = -25
    reason = profile.recovery.legs < 55 ? 'Benen är den tydligaste begränsningen idag. Överkropp ger bättre träningskvalitet.' : 'Dagsformen är tillräcklig för träning, men inte för full volym.'
  }

  return {
    id: `decision-${Date.now()}`,
    createdAt: new Date().toISOString(),
    category: 'Dagens plan',
    title,
    action,
    readiness,
    volumeChange,
    reason,
    message: `${mode.prefix} ${title}.`,
    evidence: [
      `Sömn ${profile.checkIn.sleep} h`,
      `Energi ${profile.checkIn.energy}/10`,
      `Total återhämtning ${profile.recovery.total}%`,
      `Ben ${profile.recovery.legs}%`
    ]
  }
}

export function buildGoalPlan(goal) {
  const weeks = Math.max(1, Number(goal.weeks) || 8)
  const phases = [
    { name: 'Bas', weeks: Math.max(1, Math.round(weeks * 0.3)), focus: 'Kontinuitet, teknik och hållbar träningsvolym' },
    { name: 'Bygg', weeks: Math.max(1, Math.round(weeks * 0.45)), focus: 'Progressiv belastning och specifik kapacitet' },
    { name: 'Toppning', weeks: Math.max(1, weeks - Math.round(weeks * 0.75)), focus: 'Målspecifik kvalitet och minskad trötthet' }
  ]
  return {
    target: goal.target,
    weeks,
    weeklyTargets: ['3–4 styrkepass', '2 konditionspass', 'Minst 80 % följsamhet', 'Veckovis check-in'],
    phases
  }
}

export function answerCoachQuestion(text, profile) {
  const q = text.toLowerCase()
  const decision = buildDailyDecision(profile)
  if (q.includes('trött')) return { reply: 'Är du främst mentalt trött, muskulärt trött eller sömnig?', followUps: ['Mentalt', 'Muskulärt', 'Sömnig'] }
  if (q.includes('ont') || q.includes('smärta')) return { reply: 'Var sitter besväret, hur starkt är det och känns det skarpt, molande eller instabilt?', followUps: ['Axel', 'Rygg', 'Knä', 'Annat'] }
  if (q.includes('idag') || q.includes('träna')) return { reply: `${decision.title}. ${decision.reason}`, followUps: ['Varför?', 'Anpassa passet', 'Jag vill ändå köra ben'] }
  if (q.includes('varför')) return { reply: `${decision.reason} Underlaget är: ${decision.evidence.join(', ')}.`, followUps: ['Visa alternativ', 'Acceptera rekommendationen'] }
  if (q.includes('progress') || q.includes('öka')) return { reply: KNOWLEDGE_BASE.progression, followUps: ['Visa nästa vikt', 'Behåll nuvarande belastning'] }
  if (q.includes('mål')) return { reply: `Ditt mål är ${profile.goal.target}. Med ${profile.goal.weeks} veckor kvar bör fokus vara följsamhet, gradvis progression och veckovis utvärdering.`, followUps: ['Visa målplan', 'Ändra mål'] }
  return { reply: 'Jag kan hjälpa dig med dagens träning, återhämtning, progression, smärta, mål och programanpassning. Beskriv läget med en mening.', followUps: ['Hur bör jag träna idag?', 'Varför är benen trötta?', 'Hur ligger jag till mot målet?'] }
}
