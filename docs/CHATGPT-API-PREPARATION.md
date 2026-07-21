# ChatGPT API – förberedd men avstängd

ATLAS fortsätter använda den lokala kunskaps- och beslutsmotorn. Den här förberedelsen lägger endast till en säker integrationsgräns för en framtida ChatGPT-anslutning.

## Nuvarande status

- Ingen OpenAI API-nyckel finns i frontend.
- Inga externa API-anrop görs när standardinställningarna används.
- `VITE_ATLAS_CHATGPT_ENABLED=false` håller klientadaptern avstängd.
- `ATLAS_OPENAI_ENABLED=false` håller serverproxyn avstängd.
- Den lokala ATLAS-coachen är fortsatt ordinarie coach.

## Arkitektur

```text
ATLAS React-app
  -> lokal coach som standard
  -> src/ai/chatGptAdapter.js (avstängd)
  -> /api/coach
  -> server/openaiCoach.mjs (avstängd)
  -> OpenAI Responses API (endast efter framtida aktivering)
```

API-nyckeln ska endast finnas på servern. Den får aldrig läggas i en variabel med prefixet `VITE_`, eftersom sådana värden kan exponeras i den byggda webbläsarkoden.

## Förberedda filer

- `src/ai/chatGptAdapter.js`: frontendadapter som endast talar med ATLAS egen `/api/coach`.
- `server/openaiCoach.mjs`: liten serverproxy för OpenAI Responses API.
- `.env.example`: avstängda standardvärden och tomma serverhemligheter.
- `vite.config.js`: lokal proxy från `/api` till port 8787.
- `package.json`: kommandot `npm run api:dev`.

## Framtida aktivering

Aktivera inte detta förrän ATLAS har en riktig servermiljö och användaren uttryckligen beslutar att externa anrop ska tillåtas.

När det blir aktuellt:

1. Kopiera `.env.example` till `.env.local`.
2. Ange en serverlagrad `OPENAI_API_KEY`.
3. Ange en aktuell och godkänd modell i `OPENAI_MODEL`.
4. Sätt `ATLAS_OPENAI_ENABLED=true`.
5. Starta servern med `npm run api:dev`.
6. Sätt `VITE_ATLAS_CHATGPT_ENABLED=true` först när frontend ska börja använda adaptern.
7. Lägg in autentisering, rate limiting, kostnadsgränser, loggpolicy och användarsamtycke före produktion.

## Säkerhetskrav före produktion

- API-nyckeln får aldrig skickas till webbläsaren.
- Anrop ska gå genom en server eller serverless-funktion.
- Användare ska förstå när data skickas externt.
- Person- och hälsodata ska minimeras innan anrop.
- Servern ska validera inkommande data och begränsa requeststorlek.
- Kostnadstak och rate limiting ska införas.
- Fel ska falla tillbaka till den lokala coachen.
- Modellnamn ska konfigureras på servern och inte hårdkodas i klienten.

## Avsiktlig avgränsning

Adaptern är ännu inte kopplad till coachens chattgränssnitt. Det förhindrar att ett felaktigt miljövärde oavsiktligt byter bort den lokala coachen. Den faktiska växlingen byggs först när extern AI ska testas medvetet.
