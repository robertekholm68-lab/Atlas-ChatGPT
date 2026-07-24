# Fas 4 – Intelligent träningssystem

Fas 4 bygger vidare på passloggningen och gör ASKR till ett komplett lokalt träningssystem för program, övningar, progression, kalender och analys.

## Levererat

### Programbibliotek

- Färdiga upplägg för Upper/Lower, Push Pull Legs och helkropp
- Favoriter och arkivering
- Skapa egna program
- Byta namn på program
- Lägga till och ta bort övningar
- Flytta övningar upp och ner i programmet
- Starta pass direkt från programmet

### Övningsbank

- Sökning på namn, muskel och maskin
- Filter för muskel och utrustning
- Information om primär och sekundär muskel
- Utrustning, nivå, gymkedja och standardupplägg
- Exercise Score
- Utförande och vanliga fel

### Aktivt pass

- En sammanhållen passvy
- Navigering mellan övningar utan att lämna passet
- Loggning av vikt, repetitioner och RPE
- Markering av genomförda set
- Tidigare prestation per övning
- Automatisk progressionsrekommendation
- Liveberäkning av muskelvolym
- Direkt återkoppling om att belastning förs till återhämtningssystemet
- Avslut och sparning till historiken

### Progression och statistik

- Förslag på höjd vikt eller fler repetitioner
- Personbästa och progression
- Volymutveckling över åtta veckor
- Muskelbalans och veckovolym
- Rekommenderade höjningar som kan accepteras

### Kalender och historik

- Månadskalender med markerade träningsdagar
- Kontinuitet och följsamhet
- Historik med datum, program, gym, set, volym och tid
- Sökning och filtrering i historiken

### Data, export och delning

- Lokal lagring under `atlas-phase4`
- Export av program och historik som JSON
- Import från en tidigare ASKR-export
- Delningsdialog med programkod och QR-liknande visning
- Responsiv layout för mobil, surfplatta och desktop

## Lokal lagring

Följande sparas i den aktuella webbläsaren:

- aktiv sida
- programbibliotek
- egna program och programändringar
- favoriter och arkivstatus
- aktivt träningspass
- genomförda set och inmatade värden
- träningshistorik

## Avgränsningar

Fas 4 är en lokal, fullt interaktiv produktversion. Följande kräver senare infrastruktur eller externa integrationer:

- verklig synkronisering mellan enheter
- användarkonton och molndatabas
- riktig QR-kodsgenerering och mottagning via server
- direkta importer från Strong och Hevy
- systemwidgets för iOS och Android
- automatisk offlinekö mot molnet
- PDF- och Excel-export med servergenererade rapporter
- videos och färdiga produktbilder för hela övningsbanken

Dessa funktioner är förberedda på gränssnitts- och datamodellsnivå men kopplas till backend, PWA och native-funktioner i senare faser.
