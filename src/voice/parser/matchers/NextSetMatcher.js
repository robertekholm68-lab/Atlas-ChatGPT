export const NextSetMatcher = Object.freeze({
  name: 'NextSetMatcher',
  match: ({ text }) => /^(?:nästa|nästa set|till nästa|öka nästa|samma nästa|.+\s+(?:till )?nästa(?: set)?|nästa(?: set)?\s+.+)$/.test(text) ? { targetsNext: true } : null
})
