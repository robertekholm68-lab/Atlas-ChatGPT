export const CompletionMatcher = Object.freeze({
  name: 'CompletionMatcher',
  match: ({ text }) => /^(?:klart|set klart|markera klart|färdig|klar|setet är klart|det är klart)$/.test(text) ? { completed: true } : null
})
