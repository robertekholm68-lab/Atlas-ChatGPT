export const CancelMatcher = Object.freeze({
  name: 'CancelMatcher',
  match: ({ text }) => /^(?:avbryt|glöm det|inte den|strunta i det|ta bort det)$/.test(text) ? { cancel: true } : null
})
