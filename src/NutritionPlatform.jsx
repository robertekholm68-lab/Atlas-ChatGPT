import { useMemo, useState } from 'react'
import {
  Apple, Bot, Camera, Check, ChevronDown, Clock, Copy, Droplets, Flame,
  HeartPulse, Info, Plus, QrCode, Search, Sparkles, Trash2, Utensils, Wand2,
  Wheat
} from 'lucide-react'
import './nutritionPlatform.css'

export const foodCatalog = [
  { id: 'chicken-rice', name: 'Kyckling med jasminris', brand: 'ASKR demo', serving: '1 portion', calories: 620, protein: 48, carbs: 72, fat: 14, fiber: 6, sugar: 5, saturatedFat: 3, sodium: 760, favorite: true, recent: true, barcode: null, provider: 'local' },
  { id: 'greek-yogurt', name: 'Grekisk yoghurt 2%', brand: 'Egen favorit', serving: '250 g', calories: 210, protein: 24, carbs: 12, fat: 6, fiber: 0, sugar: 10, saturatedFat: 3.5, sodium: 90, favorite: true, recent: true, barcode: null, provider: 'local' },
  { id: 'banana', name: 'Banan', brand: 'Råvara', serving: '1 st', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14, saturatedFat: 0, sodium: 1, favorite: false, recent: true, barcode: null, provider: 'local' },
  { id: 'coke', name: 'Coca-Cola', brand: 'Barcode-ready', serving: '330 ml', calories: 139, protein: 0, carbs: 35, fat: 0, fiber: 0, sugar: 35, saturatedFat: 0, sodium: 15, favorite: false, recent: false, barcode: 'placeholder', provider: 'local' },
  { id: 'clear-whey', name: 'Clear whey', brand: 'Sport', serving: '1 scoop', calories: 86, protein: 21, carbs: 1, fat: 0, fiber: 0, sugar: 0, saturatedFat: 0, sodium: 120, favorite: true, recent: true, barcode: null, provider: 'local' }
]

export const recipeCatalog = [
  { id: 'recovery-bowl', name: 'Recovery bowl', servingSize: '2 portioner', calories: 690, protein: 52, carbs: 82, fat: 18, favorite: true, custom: true, image: null, instructions: 'Instruktioner kopplas in i receptbyggaren.', ingredients: ['Kyckling', 'Jasminris', 'Avokado', 'Salsa', 'Lime'] },
  { id: 'protein-oats', name: 'Protein oats', servingSize: '1 skål', calories: 510, protein: 38, carbs: 58, fat: 13, favorite: false, custom: true, image: null, instructions: 'Steg-för-steg och batchläge är förberett.', ingredients: ['Havregryn', 'Mjölk', 'Whey', 'Blåbär'] }
]

const meals = [
  { id: 'breakfast', type: 'Frukost', time: '07:20', title: 'Yoghurt, granola och bär', calories: 410, protein: 34, carbs: 46, fat: 10, fiber: 8, sugar: 16, saturatedFat: 3, sodium: 210, notes: 'Snabb vardagsfrukost', photo: null },
  { id: 'lunch', type: 'Lunch', time: '12:05', title: 'Kyckling, ris och grönsaker', calories: 620, protein: 48, carbs: 72, fat: 14, fiber: 6, sugar: 5, saturatedFat: 3, sodium: 760, notes: 'Bra återhämtningsmål', photo: null },
  { id: 'snack', type: 'Mellanmål', time: '15:40', title: 'Clear whey och banan', calories: 191, protein: 22, carbs: 28, fat: 0, fiber: 3, sugar: 14, saturatedFat: 0, sodium: 121, notes: 'Före pass', photo: null },
  { id: 'drink', type: 'Dryck', time: '16:10', title: 'Vatten', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, saturatedFat: 0, sodium: 0, notes: '500 ml', photo: null }
]

const targets = { calories: 2050, protein: 170, carbs: 210, fat: 68, fiber: 30, water: 2800 }
const totals = { calories: 1420, protein: 132, carbs: 146, fat: 48, fiber: 17, water: 2100 }

export default function NutritionPlatform({ notify = () => {} }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState('lunch')
  const filteredFoods = useMemo(() => foodCatalog.filter(food => `${food.name} ${food.brand}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5), [query])
  const score = Math.round((pct(totals.protein, targets.protein) + pct(totals.fiber, targets.fiber) + pct(totals.water, targets.water) + 82) / 4)

  return <div className="nutrition-shell">
    <section className="nutrition-hero-card span8">
      <div>
        <span className="nutrition-pill"><Apple size={15}/> Nutrition Platform 1.0</span>
        <h2>{totals.calories.toLocaleString('sv-SE')} / {targets.calories.toLocaleString('sv-SE')} kcal</h2>
        <p>Logga på under 10 sekunder med quick add, eller öppna detaljer när du vill följa varje mikromål och trend.</p>
        <div className="nutrition-actions">
          <button className="nutrition-primary" onClick={() => notify('Quick Add öppnad')}><Plus size={18}/> Quick Add</button>
          <button className="nutrition-secondary" onClick={() => notify('Naturlig logg förberedd')}><Wand2 size={18}/> “Chicken salad…”</button>
        </div>
      </div>
      <MacroRings />
    </section>

    <Stat icon={Flame} label="Kvar idag" value={`${targets.calories - totals.calories} kcal`} note="Kalorier" />
    <Stat icon={Utensils} label="Protein" value={`${totals.protein}/${targets.protein} g`} note="78%" />
    <Stat icon={Wheat} label="Fiber" value={`${totals.fiber}/${targets.fiber} g`} note="Målspår" />
    <Stat icon={Droplets} label="Vatten" value={`${(totals.water/1000).toFixed(1)} / 2.8 L`} note="700 ml kvar" />

    <section className="nutrition-panel span7 quick-log-panel">
      <Section eyebrow="Meal logging" title="Snabb loggning" />
      <div className="natural-log"><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Sök eller skriv: kycklingsallad med ris och en Coke" aria-label="Sök mat eller logga med naturligt språk"/><button onClick={() => notify('Måltid tolkad från text')}>Logga</button></div>
      <div className="quick-chip-grid">{['Barcode', 'Favoritmat', 'Sparad måltid', 'Senaste', 'Kopiera igår', 'Snack', 'Dryck', '+ kcal'].map((label, index) => <button key={label} onClick={() => notify(`${label} vald`)}>{index === 0 ? <QrCode size={17}/> : <Plus size={17}/>}<span>{label}</span></button>)}</div>
      <div className="food-results">{filteredFoods.map(food => <button key={food.id} onClick={() => notify(`${food.name} tillagd`)}><span><strong>{food.name}</strong><small>{food.brand} · {food.serving}</small></span><b>{food.calories} kcal</b></button>)}</div>
    </section>

    <section className="nutrition-panel span5 insights-panel">
      <Section eyebrow="AI-ready insights" title="Dagens rekommendationer" />
      <Insight icon={Bot} title="Nutrition score" value={`${score}/100`} text="Placeholder för framtida AI-bedömning baserad på mål, träning och historik." />
      <Insight icon={HeartPulse} title="Recovery nutrition" value="+22 g protein" text="Workout day: prioritera protein och kolhydrater post-workout." />
      <Insight icon={Clock} title="Meal timing" value="Stabilt" text="Lunch och mellanmål ligger bra inför träningsfönstret." />
    </section>

    <section className="nutrition-panel span7 timeline-panel">
      <Section eyebrow="Daily timeline" title="Måltider idag" />
      <div className="meal-timeline">{meals.map(meal => <MealCard key={meal.id} meal={meal} expanded={expanded === meal.id} onToggle={() => setExpanded(expanded === meal.id ? '' : meal.id)} notify={notify}/>)}</div>
    </section>

    <section className="nutrition-panel span5">
      <Section eyebrow="Progress integration" title="Nutrition trends" />
      <div className="trend-grid"><Trend label="Dagliga kalorier" value="1 945"/><Trend label="Veckosnitt" value="2 012"/><Trend label="Protein snitt" value="151 g"/><Trend label="Adherence" value="86%"/><Trend label="Consistency" value="91"/><Trend label="Weight trend" value="Redo"/></div>
      <div className="mini-bars" aria-label="Makrotrender">{[64, 78, 72, 88, 69, 83, 76].map((height, i) => <span key={i} style={{ height: `${height}%` }}/>)}</div>
    </section>

    <section className="nutrition-panel span6">
      <Section eyebrow="Recipes" title="Recept och ingredienser" />
      <div className="recipe-list">{recipeCatalog.map(recipe => <article key={recipe.id}><div className="asset-placeholder"><Camera size={18}/> Receptbild redo</div><strong>{recipe.name}</strong><small>{recipe.servingSize} · {recipe.ingredients.join(', ')}</small><div><span>{recipe.calories} kcal</span><span>P {recipe.protein} · C {recipe.carbs} · F {recipe.fat}</span></div><button onClick={() => notify(`${recipe.name} duplicerat`)}><Copy size={16}/> Duplicera</button></article>)}</div>
    </section>

    <section className="nutrition-panel span6">
      <Section eyebrow="Workout + AI Coach" title="Träningsdagens kost" />
      <div className="coach-prep-grid">{['Calories burned placeholder', 'Recommended protein', 'Pre-workout suggestions', 'Post-workout suggestions', 'Hydration reminder', 'Calorie adjustment'].map(item => <div key={item}><Sparkles size={17}/><span>{item}</span><small>Arkitektur redo · ingen extern API/AI ännu</small></div>)}</div>
    </section>

    <button className="sticky-quick-add" onClick={() => notify('Quick Add öppnad')} aria-label="Öppna snabb loggning"><Plus size={22}/>Quick Add</button>
  </div>
}

function pct(value, target){ return Math.min(100, Math.round(value / target * 100)) }
function Section({eyebrow, title}){ return <div className="nutrition-section"><span>{eyebrow}</span><h3>{title}</h3></div> }
function Stat({icon: Icon, label, value, note}){ return <article className="nutrition-stat"><Icon size={20}/><span>{label}</span><strong>{value}</strong><small>{note}</small></article> }
function MacroRings(){ return <div className="macro-ring-stack" aria-label="Macro rings"><div style={{'--p':'78%'}}><strong>Protein</strong><span>132g</span></div><div style={{'--p':'70%'}}><strong>Carbs</strong><span>146g</span></div><div style={{'--p':'71%'}}><strong>Fat</strong><span>48g</span></div></div> }
function Insight({icon: Icon, title, value, text}){ return <div className="insight-row"><Icon size={18}/><span><strong>{title}</strong><small>{text}</small></span><b>{value}</b></div> }
function Trend({label, value}){ return <div><span>{label}</span><strong>{value}</strong></div> }
function MealCard({meal, expanded, onToggle, notify}){ return <article className={`meal-card ${expanded ? 'expanded' : ''}`}><button className="meal-summary" onClick={onToggle} aria-expanded={expanded}><span className="meal-dot"/><span><small>{meal.time} · {meal.type}</small><strong>{meal.title}</strong></span><b>{meal.calories} kcal</b><ChevronDown size={18}/></button>{expanded && <div className="meal-detail"><div className="asset-placeholder"><Camera size={18}/> Måltidsfoto redo</div><div className="nutrient-grid">{[['Protein', meal.protein], ['Carbs', meal.carbs], ['Fat', meal.fat], ['Fiber', meal.fiber], ['Sugar', meal.sugar], ['Sat fat', meal.saturatedFat], ['Sodium', `${meal.sodium} mg`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{typeof value === 'number' ? `${value} g` : value}</strong></div>)}</div><p><Info size={15}/>{meal.notes} · Tid äten {meal.time}</p><div className="meal-tools"><button onClick={() => notify('Redigera måltid')}><Check size={16}/> Edit</button><button onClick={() => notify('Måltid duplicerad')}><Copy size={16}/> Duplicate</button><button onClick={() => notify('Måltid raderad')}><Trash2 size={16}/> Delete</button></div></div>}</article> }
