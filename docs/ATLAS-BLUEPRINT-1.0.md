# ASKR Blueprint 1.0

Detta dokument är den gemensamma produktplanen för ASKR fram till version 1.0. Status ska baseras på faktisk kod och verifierade flöden, inte enbart på planerade funktioner.

## Statusnyckel

- **Implementerad** – funktion finns i koden.
- **Delvis implementerad** – grundflödet finns, men viktiga delar saknas.
- **Planerad** – specificerad men ännu inte byggd.
- **Infrastruktur senare** – kräver backend, konto, extern tjänst eller enhetsintegration.

## Viktig arkitekturregel

ASKR ska vara en sammanhängande produkt. Nya moduler får inte ersätta tidigare moduler i `main.jsx`. Den gemensamma produktskalet ska ge åtkomst till både träningssystemet och Intelligence-systemet. Senare läggs Recovery, Goals, Nutrition, Health och övriga moduler in i samma skal.

---

## 1. Dashboard

**Status: Delvis implementerad**

Implementerat:
- Dagens Intelligence Brief
- Readiness, sömn, energi, belastning och målföljsamhet
- Rekommenderat pass och beslutsunderlag

Återstår:
- Samlad översikt från träning, kost, hälsa och mål
- Anpassningsbara widgets
- Händelser, påminnelser och kommande pass

## 2. Workout

**Status: Implementerad lokalt, fortsatt utveckling krävs**

Implementerat:
- Programbibliotek
- Egna program och programredigering
- Aktivt pass
- Set, reps, vikt och RPE
- Tidigare prestation
- Progressionsrekommendation
- Muskelvolym
- Historik

Återstår:
- Superset, dropset och rest-pause
- Vila-/settimer
- Tydligare PR-händelser
- Koppling av avslutat pass till Intelligence Engine via gemensam datamodell

## 3. Exercise Library

**Status: Delvis implementerad**

Implementerat:
- Sökning och filter
- Muskel, utrustning, nivå och gymkedja
- Utförande och vanliga fel
- Exercise Score

Återstår:
- Full övningsbank
- Fler maskinmärken och gymkedjor
- Favoriter
- Kvalitetssäkrade bilder och filmer
- Adminflöde för övningar

## 4. AI Coach

**Status: Delvis implementerad**

Implementerat:
- Lokal kunskapsmotor
- Daily Brief
- Readinessbaserade träningsbeslut
- Coachlägen: flexibel, balanserad och strikt
- Frågor om träning, trötthet, smärta, progression och mål
- Beslutsunderlag och beslutshistorik
- Förberedd separation mellan motor och gränssnitt

Återstår:
- Gemensam data från riktiga träningspass, mål, kost och hälsologg
- Fler dialogtillstånd och följdfrågor
- Trendanalys över tid
- Programanpassning som användaren kan godkänna
- Adapter mot Claude eller ChatGPT via backend

## 5. Recovery

**Status: Delvis implementerad**

Implementerat:
- Daglig check-in
- Sömn, energi, stress, ömhet, motivation och smärta
- Readinessberäkning
- Muskelgruppers återhämtning
- Anpassning av dagens träning

Återstår:
- Belastning från verkligt loggade pass
- Historiska trender
- Vilopuls och HRV
- Sömnkvalitet och sömntid som separata signaler
- Individuell kalibrering
- Förklarad datakvalitet och säkerhetsnivå

## 6. Nutrition

**Status: Planerad**

Byggordning:
1. Kostprofil, energi- och makromål
2. Livsmedelsmodell och basbank
3. Quick Log och Exact Mode
4. Receptmotor
5. Måltidsplanerare och substitutionsmotor
6. Inköpslista
7. Koppling till coach och mål

Infrastruktur senare:
- Streckkodskatalog och produktsökning
- Molnsynk
- Externa livsmedelsdatabaser om licens och API krävs

## 7. Goals

**Status: Delvis implementerad**

Implementerat:
- Målnamn, målbeskrivning och tid kvar
- Automatisk plan med bas-, bygg- och toppningsfas
- Veckomål

Återstår:
- Flera samtidiga mål
- Mätbara start- och målvärden
- Delmål och milstolpar
- Prognos från faktisk utveckling
- Framför/bakom plan
- Händelsebaserade målresor
- Koppling till träning, kost, hälsa och kalender

## 8. Health

**Status: Planerad**

Återstår:
- Vikt, midja, kroppsfett och kroppsmått
- Vilopuls, HRV och blodtryck
- Progressbilder
- Trendlinjer och mätpåminnelser
- Datakällor och manuell registrering

Infrastruktur senare:
- Apple Health, Health Connect, Garmin och wearables

## 9. Progress

**Status: Delvis implementerad**

Implementerat:
- Historik
- Personbästa och progression i träningssystemet
- Volymutveckling och muskelbalans

Återstår:
- Samlad utveckling för styrka, kropp, kondition och följsamhet
- Jämförelse mellan perioder
- Coachens hypoteser tydligt separerade från observerade data
- Rapporter per vecka och månad

## 10. Calendar

**Status: Delvis implementerad**

Implementerat:
- Lokal månadskalender med träningsdagar
- Träningshistorik

Återstår:
- Framtida träningsplan
- Vilodagar, målcheck-ins, kroppsmätningar och måltidsplan
- Flytta och ersätta pass
- Coachens planförslag

## 11. Settings

**Status: Delvis implementerad**

Implementerat:
- Coachpersonlighet
- Lokal lagring
- Träningsdata export/import i tidigare träningsmodul

Återstår:
- Enheter
- Tema
- Språk
- Notiser
- Samlad export och återställning för alla moduler
- Sekretess och datahantering

## 12. Admin

**Status: Planerad**

Återstår:
- Hantera övningar
- Hantera programmallar
- Hantera livsmedel och recept
- Hantera maskiner och gymkedjor
- Hantera coachregler och kunskapsartiklar
- Import, validering och publiceringsstatus

## 13. Knowledge Center

**Status: Planerad**

Återstår:
- Strukturerade artiklar om träning, kost, återhämtning och teknik
- Källor, granskningsdatum och målgrupp
- Sökning och ämnestaggar
- Koppling till coachens svar
- Tydlig skillnad mellan kunskapsregel, coachbedömning och medicinsk information

---

# Prioriterad utvecklingsordning

## Leverans A – Produktintegration och stabilitet

- Gemensamt produktskal för Träning och Coach
- Behåll tidigare funktioner åtkomliga
- Dokumentera gemensamma datamodeller
- Lägg till automatisk byggkontroll

## Leverans B – AI Coach + Recovery + Goals

- Koppla träningshistorik till coachmotorn
- Låt avslutade pass påverka belastning och muskelåterhämtning
- Utöka mål med mätbara värden och milstolpar
- Skapa beslut som kan accepteras eller avvisas
- Lägg till trendmedveten Daily Brief

## Leverans C – Nutrition Core 1–2

- Kostprofil
- Kalori- och makromål
- Dagsöversikt
- Livsmedelsmodell
- Quick Log och Exact Mode

## Leverans D – Nutrition Core 3–5

- Receptmotor och första kvalitetssäkrade recepten
- Måltidsplanering
- Substitutioner och inköpslista
- Koppling till coach och Goal Intelligence

## Leverans E – Health, Progress och Calendar

- Hälsologg
- Samlad trendanalys
- Full planeringskalender

## Leverans F – Knowledge Center och Admin

- Kunskapsinnehåll
- Administrationsverktyg
- Publicerings- och kvalitetssäkringsflöde

## Leverans G – Cloud och integrationer

- Konto och databas
- Synk mellan enheter
- Backup
- Claude/ChatGPT-adapter
- Wearables och hälsoplattformar

---

# Definition of Done för varje modul

En modul får markeras som färdig först när:

1. Huvudflödet fungerar på mobil och desktop.
2. Data sparas och återställs korrekt.
3. Tomma lägen, felaktiga värden och avbrutna flöden hanteras.
4. Modulen använder gemensamma data istället för duplicerade demonstrationsvärden.
5. Minst ett verkligt användarscenario kan genomföras från början till slut.
6. Produktionsbygget går igenom utan fel.
7. Modulen är dokumenterad i denna blueprint.
