import { validateEmail, validatePassword } from './errors.js'
import { createSupabaseClient } from './supabaseClient.js'
import { enqueueOfflineChange } from './syncEngine.js'

let clientPromise
function client() { clientPromise ||= createSupabaseClient(); return clientPromise }

async function table(name) {
  const supabase = await client()
  return supabase?.from(name)
}

export const authService = {
  async signUp({ email, password, profile }) { validateEmail(email); validatePassword(password); const supabase = await client(); return supabase?.auth.signUp({ email, password, options: { data: profile } }) },
  async signIn({ email, password }) { validateEmail(email); validatePassword(password); const supabase = await client(); return supabase?.auth.signInWithPassword({ email, password }) },
  async forgotPassword(email) { validateEmail(email); const supabase = await client(); return supabase?.auth.resetPasswordForEmail(email) },
  async resetPassword(password) { validatePassword(password); const supabase = await client(); return supabase?.auth.updateUser({ password }) },
  async signOut() { const supabase = await client(); return supabase?.auth.signOut() },
  async session() { const supabase = await client(); return supabase?.auth.getSession() }
}

function crudService(tableName) {
  return {
    async upsert(record) { if (!navigator.onLine) return enqueueOfflineChange(tableName, 'upsert', record); return (await table(tableName))?.upsert(record).select().single() },
    async remove(id) { if (!navigator.onLine) return enqueueOfflineChange(tableName, 'delete', { id }); return (await table(tableName))?.delete().eq('id', id) },
    async list(userId) { return (await table(tableName))?.select('*').eq('user_id', userId).order('updated_at', { ascending: false }) },
    async applyQueuedChange(item) { return item.operation === 'delete' ? this.remove(item.payload.id) : this.upsert(item.payload) }
  }
}

export const profileService = crudService('profiles')
export const workoutService = crudService('workout_sessions')
export const nutritionService = crudService('meals')
export const recoveryService = crudService('recovery_entries')
export const coachService = crudService('coach_memory')
export const goalsService = crudService('goals')
export const notificationService = crudService('notifications')

export const storageService = {
  async upload(bucket, path, file, onProgress) { onProgress?.(0); const supabase = await client(); const result = await supabase?.storage.from(bucket).upload(path, file, { upsert: true }); onProgress?.(100); return result },
  async publicUrl(bucket, path) { const supabase = await client(); return supabase?.storage.from(bucket).getPublicUrl(path) }
}

export const atlasServices = { profiles: profileService, workout_sessions: workoutService, meals: nutritionService, recovery_entries: recoveryService, coach_memory: coachService, goals: goalsService, notifications: notificationService }
