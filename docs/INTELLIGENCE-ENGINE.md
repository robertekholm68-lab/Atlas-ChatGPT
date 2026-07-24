# ASKR Intelligence Engine

ASKR använder tills vidare en lokal kunskaps- och beslutsmotor. Ingen extern språkmodell eller API-nyckel krävs.

## Levererat

- Daily Brief med readiness och dagens rekommendation
- Lokal Recovery Engine
- Daglig check-in för sömn, energi, stress, ömhet, motivation och smärta
- Goal Intelligence med automatiska träningsfaser
- Adaptiv rekommendation för pass, volym, intensitet och RIR
- Lokal samtalscoach med följdfrågor
- Coachlägen: Flexibel, Balanserad och Strikt
- Varför-funktion med synligt beslutsunderlag
- Decision History med accepterade rekommendationer
- Säkerhetsregler för smärta och medicinska gränser
- Lokal lagring under `atlas-intelligence-v1`
- Separat kunskapsmotor i `src/atlasCoachEngine.js`

## Arkitektur

`AppIntelligence.jsx` ansvarar för gränssnitt, check-in, mål, coachdialog och beslutshistorik.

`atlasCoachEngine.js` innehåller:

- kunskapsbank
- readinessberäkning
- beslutsregler
- målplanering
- lokala coachssvar

Det innebär att en extern språkmodell senare kan kopplas in bakom samma gränssnitt. Claude eller ChatGPT ska då användas för språk, djupare resonemang och sammanfattningar, medan träningsdata, säkerhetsregler och beslutskontrakt fortsätter vara strukturerade.

## Rekommenderat framtida adapterkontrakt

```js
async function askExternalCoach({ message, profile, decision, history }) {
  return {
    reply: '...',
    proposedActions: [],
    evidence: [],
    safetyFlags: []
  }
}
```

API-nycklar ska aldrig lagras i frontend eller `localStorage`. Anrop ska senare gå via en säker backend eller serverless-funktion.

## Avgränsning

Den lokala coachen är regelbaserad och arbetar med demonstrationsdata och användarens lokala check-in. Den lär sig ännu inte statistiskt från stora mängder passdata och kan inte göra fria språkmodellresonemang. Den är avsedd som fungerande produktprototyp och som stabil grund för senare Claude- eller ChatGPT-integration.
