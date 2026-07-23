export const ErrorKind = Object.freeze({ OFFLINE:'offline', AUTH:'auth', VALIDATION:'validation', NETWORK:'network', SERVER:'server', STORAGE:'storage' })

export class AtlasError extends Error {
  constructor(kind, message, options = {}) {
    super(message)
    this.name = 'AtlasError'
    this.kind = kind
    this.retryable = Boolean(options.retryable)
    this.fieldErrors = options.fieldErrors || {}
    this.cause = options.cause
  }
}

export function friendlyError(error) {
  const kind = error?.kind || ErrorKind.SERVER
  const messages = {
    [ErrorKind.OFFLINE]: 'Du är offline. Ändringen köas och synkas när anslutningen är tillbaka.',
    [ErrorKind.AUTH]: 'Vi kunde inte verifiera din session. Logga in igen.',
    [ErrorKind.VALIDATION]: 'Kontrollera markerade fält och försök igen.',
    [ErrorKind.NETWORK]: 'Nätverket svarar inte just nu. Försök igen om en stund.',
    [ErrorKind.SERVER]: 'ATLAS kunde inte slutföra åtgärden just nu.',
    [ErrorKind.STORAGE]: 'Filen kunde inte laddas upp. Kontrollera format och anslutning.'
  }
  return messages[kind] || messages[ErrorKind.SERVER]
}

export function validateEmail(email) {
  if (!/^\S+@\S+\.\S+$/.test(String(email || '').trim())) {
    throw new AtlasError(ErrorKind.VALIDATION, 'Invalid email', { fieldErrors: { email: 'Ange en giltig e-postadress.' } })
  }
}

export function validatePassword(password) {
  if (String(password || '').length < 8) {
    throw new AtlasError(ErrorKind.VALIDATION, 'Invalid password', { fieldErrors: { password: 'Använd minst 8 tecken.' } })
  }
}
