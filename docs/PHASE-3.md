# Fas 3 – Träningsmotor och passloggning

Fas 3 gör träningssidan till en fungerande träningsmotor som kan användas under ett riktigt gympass.

## Levererat

- Programöversikt med flera träningspass
- Programdetaljer med övningar, målset och senaste prestation
- Start av aktivt träningspass
- Automatisk passklocka med paus och fortsätt
- Setloggning för vikt, repetitioner och RPE
- Plus- och minusreglage för snabb mobil inmatning
- Markering av genomförda set
- Automatisk vilotimer per övning
- Möjlighet att hoppa över vilan
- Löpande beräkning av total träningsvolym
- Progressindikator för genomförda set
- Avslutningsdialog med passöversikt och upplevd kvalitet
- Sparning av avslutade pass i träningshistoriken
- Historik med tid, antal set och total volym
- Progressionsvy för styrkeutveckling
- Personbästa och beräknat 1RM
- Enkel progressionsrekommendation baserad på genomförda pass
- Lokal beständig lagring via `localStorage`
- Pågående pass återställs efter omladdning av sidan
- Responsiv layout för mobil, surfplatta och desktop
- GitHub Actions-validering med produktionsbygge

## Flöde

1. Öppna **Träning**.
2. Välj ett program.
3. Starta passet.
4. Justera vikt, repetitioner och RPE för varje set.
5. Markera setet som klart.
6. Vilotimern startar automatiskt.
7. Avsluta och spara passet.
8. Resultatet visas i Historik och används i Progression.

## Lokal datalagring

Fas 3 sparar följande under nyckeln `atlas-phase3`:

- aktiv sida
- pågående träningspass
- setvärden och genomförandestatus
- passerad träningstid
- sparad träningshistorik

Det gör att användaren kan ladda om webbläsaren eller stänga appen under ett pass utan att omedelbart förlora loggen.

## Avgränsning

Lagringen är lokal i den aktuella webbläsaren. Synkronisering mellan mobil och webb, användarkonton, molndatabas och koppling till den fullständiga återhämtningsmotorn läggs till i senare faser.
