# Fas 2 – Levande kroppskarta och återhämtning

Fas 2 gör kroppen till ATLAS primära gränssnitt för träningsbelastning och återhämtning.

## Levererat

- Interaktiv SVG-baserad kroppskarta
- Separat fram- och bakvy
- 18 klickbara muskelområden
- Tre statusnivåer: redo, belastad och uppmärksamhet
- Filter för varje statusnivå
- Markerad och animerad vald muskel
- Detaljpanel med återhämtningspoäng
- Lokal belastning per muskel
- Tid sedan senaste träning
- Prognos för full återhämtning
- Relaterade övningar per muskelområde
- Knapp för att anpassa nästa träningspass
- Sammanräkning av redo, belastade och vilande områden
- Lista över alla muskelområden i aktuell vy
- Simulerad återhämtningsprognos över 48 timmar
- Responsiv layout för mobil, surfplatta och desktop
- Tangentbordsstöd för muskelval i SVG-kartan

## Muskelområden

### Framsida

Bröst, främre axlar, biceps, underarmar, mage, sneda bukmuskler, adduktorer, framsida lår och vader.

### Baksida

Trapezius, bakre axlar, övre rygg, lats, triceps, ländrygg, säte, baksida lår och vader.

## Datamodell i prototypen

Varje muskelområde innehåller:

- id och namn
- anatomisk vy
- återhämtningspoäng
- lokal belastning
- status
- senaste träning
- återhämtningsprognos
- relaterade övningar

## Avgränsning

Återhämtningsvärdena är demonstrationsdata. I en senare fas ska de beräknas från faktisk träningshistorik, set, repetitioner, intensitet, upplevd ansträngning, sömn och användarens egen återkoppling.
