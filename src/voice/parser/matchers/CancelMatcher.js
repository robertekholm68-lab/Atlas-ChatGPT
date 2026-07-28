export const CancelMatcher = Object.freeze({
  name: 'CancelMatcher',
  match: ({ text }) => /^(?:avbryt|ångra|glöm det|inte den|strunta i det|ta bort det)$/.test(text) ? { cancel: true } : null
})
