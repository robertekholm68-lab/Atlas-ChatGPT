export const exerciseBank = [
  {id:'bench',name:'Bänkpress',muscle:'Bröst',secondary:'Triceps · främre axlar',equipment:'Skivstång',level:'Medel',gym:'Alla gym',score:96,sets:'4 × 6–8'},
  {id:'row',name:'Sittande rodd',muscle:'Rygg',secondary:'Biceps · bakre axlar',equipment:'Kabel',level:'Nybörjare',gym:'Nordic Wellness',score:94,sets:'4 × 8–10'},
  {id:'squat',name:'Knäböj',muscle:'Framsida lår',secondary:'Säte · bål',equipment:'Skivstång',level:'Avancerad',gym:'Alla gym',score:98,sets:'4 × 5–8'},
  {id:'pulldown',name:'Latsdrag',muscle:'Lats',secondary:'Biceps · övre rygg',equipment:'Kabel',level:'Nybörjare',gym:'Fitness24Seven',score:95,sets:'3 × 8–12'},
  {id:'ohp',name:'Axelpress',muscle:'Axlar',secondary:'Triceps',equipment:'Hantlar',level:'Medel',gym:'Alla gym',score:91,sets:'3 × 8–10'},
  {id:'legpress',name:'Benpress',muscle:'Framsida lår',secondary:'Säte',equipment:'Maskin',level:'Nybörjare',gym:'Nordic Wellness',score:93,sets:'4 × 10'},
  {id:'rdl',name:'Raka marklyft',muscle:'Baksida lår',secondary:'Säte · ländrygg',equipment:'Skivstång',level:'Medel',gym:'Alla gym',score:95,sets:'3 × 8'},
  {id:'curl',name:'Bicepscurl',muscle:'Biceps',secondary:'Underarmar',equipment:'Hantlar',level:'Nybörjare',gym:'Alla gym',score:87,sets:'3 × 10–12'},
  {id:'pushdown',name:'Triceps pushdown',muscle:'Triceps',secondary:'—',equipment:'Kabel',level:'Nybörjare',gym:'Alla gym',score:90,sets:'3 × 10–12'},
  {id:'hipthrust',name:'Hip thrust',muscle:'Säte',secondary:'Baksida lår',equipment:'Skivstång',level:'Medel',gym:'Fitness24Seven',score:96,sets:'4 × 8'},
  {id:'calf',name:'Vadpress',muscle:'Vader',secondary:'—',equipment:'Maskin',level:'Nybörjare',gym:'Nordic Wellness',score:86,sets:'4 × 12–15'},
  {id:'plank',name:'Planka',muscle:'Bål',secondary:'Axlar',equipment:'Kroppsvikt',level:'Nybörjare',gym:'Alla gym',score:88,sets:'3 × 45 s'}
]

export const defaultPrograms = [
  {id:'upper-a',name:'Överkropp A',type:'Upper/Lower',days:4,favorite:true,archived:false,cover:'/assets/program-covers/upper-a.svg',muscleFigure:'/assets/muscle-figures/back.svg',muscleFigureAlt:'Bakre muskelkarta med rygg, axlar och armar markerade',exercises:['bench','row','ohp','pulldown','pushdown','curl']},
  {id:'lower-a',name:'Underkropp A',type:'Upper/Lower',days:4,favorite:true,archived:false,cover:'/assets/program-covers/lower-a.svg',muscleFigure:'/assets/muscle-figures/front.svg',muscleFigureAlt:'Främre muskelkarta med lår och bål markerade',exercises:['squat','rdl','legpress','calf','plank']},
  {id:'fullbody',name:'Helkropp 50+',type:'Helkropp',days:2,favorite:false,archived:false,exercises:['legpress','bench','row','rdl','ohp','plank']},
  {id:'push',name:'Push',type:'PPL',days:6,favorite:false,archived:false,exercises:['bench','ohp','pushdown']},
  {id:'pull',name:'Pull',type:'PPL',days:6,favorite:false,archived:false,exercises:['pulldown','row','curl','rdl']},
  {id:'legs',name:'Legs',type:'PPL',days:6,favorite:false,archived:false,exercises:['squat','legpress','rdl','calf']}
]
