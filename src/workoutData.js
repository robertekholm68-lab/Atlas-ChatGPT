export const muscles = {
  chest: { id: 'chest', name: 'Chest', view: 'front' },
  frontDelts: { id: 'front-delts', name: 'Front delts', view: 'front' },
  triceps: { id: 'triceps', name: 'Triceps', view: 'back' },
  lats: { id: 'lats', name: 'Lats', view: 'back' },
  upperBack: { id: 'upper-back', name: 'Upper back', view: 'back' },
  biceps: { id: 'biceps', name: 'Biceps', view: 'front' },
  quads: { id: 'quads', name: 'Quads', view: 'front' },
  glutes: { id: 'glutes', name: 'Glutes', view: 'back' },
  hamstrings: { id: 'hamstrings', name: 'Hamstrings', view: 'back' },
  calves: { id: 'calves-back', name: 'Calves', view: 'back' }
}

export const exerciseLibrary = [
  { id:'bench-press', name:'Bench Press', equipment:'Barbell', difficulty:'Intermediate', machine:false, type:'Compound', pattern:'Horizontal push', primary:['chest'], secondary:['front-delts','triceps'], favorite:true, recent:true, custom:false, hero:'BP', thumbnail:'BP', start:'Set shoulders and touch lower chest.', end:'Press up and slightly back.', tips:['Pack shoulders before unracking.','Keep feet planted and bar path consistent.','Stop each set with one clean rep in reserve.'], mistakes:['Flaring elbows too early.','Bouncing the bar.','Losing upper-back tightness.'], records:{weight:'100 kg', reps:'8 reps', volume:'3 680 kg'}, history:[62,74,70,82,88,92], notes:'Use paused first rep on top set.' },
  { id:'seated-row', name:'Seated Row', equipment:'Cable', difficulty:'Beginner', machine:true, type:'Compound', pattern:'Horizontal pull', primary:['upper-back','lats'], secondary:['biceps'], favorite:true, recent:true, custom:false, hero:'SR', thumbnail:'SR', start:'Reach long with neutral spine.', end:'Pull elbows back and squeeze.', tips:['Lead with elbows.','Pause without leaning back.','Control the stretch.'], mistakes:['Shrugging every rep.','Using momentum.'], records:{weight:'82 kg', reps:'12 reps', volume:'3 120 kg'}, history:[48,55,61,58,66,72], notes:'Seat pin 4.' },
  { id:'shoulder-press', name:'Shoulder Press', equipment:'Dumbbell', difficulty:'Intermediate', machine:false, type:'Compound', pattern:'Vertical push', primary:['front-delts'], secondary:['triceps'], favorite:false, recent:true, custom:false, hero:'SP', thumbnail:'SP', start:'Dumbbells beside ears.', end:'Finish stacked over shoulders.', tips:['Ribs down.','Press in a slight arc.'], mistakes:['Overarching low back.'], records:{weight:'30 kg', reps:'9 reps', volume:'1 620 kg'}, history:[30,36,42,45,46,48], notes:'Prefer seated when fatigued.' },
  { id:'lat-pulldown', name:'Lat Pulldown', equipment:'Cable', difficulty:'Beginner', machine:true, type:'Compound', pattern:'Vertical pull', primary:['lats'], secondary:['biceps','upper-back'], favorite:false, recent:false, custom:false, hero:'LP', thumbnail:'LP', start:'Arms long, chest tall.', end:'Bar to upper chest.', tips:['Drive elbows to ribs.','Avoid leaning too far back.'], mistakes:['Pulling behind neck.','Half reps.'], records:{weight:'76 kg', reps:'11 reps', volume:'2 420 kg'}, history:[50,56,59,65,68,70], notes:'Medium neutral grip.' },
  { id:'leg-press', name:'Leg Press', equipment:'Machine', difficulty:'Beginner', machine:true, type:'Compound', pattern:'Squat', primary:['quads','glutes'], secondary:['hamstrings'], favorite:false, recent:false, custom:false, hero:'LG', thumbnail:'LG', start:'Knees tracking over toes.', end:'Press without locking hard.', tips:['Use full comfortable depth.','Keep hips down.'], mistakes:['Short range of motion.'], records:{weight:'220 kg', reps:'12 reps', volume:'6 600 kg'}, history:[80,94,100,112,118,125], notes:'Sled 2, stance medium.' },
  { id:'incline-curl', name:'Incline Curl', equipment:'Dumbbell', difficulty:'Beginner', machine:false, type:'Isolation', pattern:'Elbow flexion', primary:['biceps'], secondary:[], favorite:false, recent:false, custom:true, hero:'IC', thumbnail:'IC', start:'Arms behind torso.', end:'Curl without shoulder swing.', tips:['Keep elbows quiet.','Own the lowering.'], mistakes:['Swinging reps.'], records:{weight:'16 kg', reps:'12 reps', volume:'760 kg'}, history:[18,21,22,24,25,27], notes:'Custom: low incline bench.' }
]

export const activeWorkout = {
  name: 'Upper Body A', duration: '52 min target', exercises: [
    { exerciseId:'bench-press', sets:[{weight:90,reps:6,rpe:8},{weight:90,reps:6,rpe:8}], targetSets:4, rest:150, tempo:'3-1-1' },
    { exerciseId:'seated-row', sets:[{weight:72,reps:8,rpe:7}], targetSets:4, rest:120, tempo:'2-1-2' },
    { exerciseId:'shoulder-press', sets:[], targetSets:3, rest:120, tempo:'2-0-1' },
    { exerciseId:'lat-pulldown', sets:[], targetSets:3, rest:90, tempo:'2-1-2' }
  ]
}
