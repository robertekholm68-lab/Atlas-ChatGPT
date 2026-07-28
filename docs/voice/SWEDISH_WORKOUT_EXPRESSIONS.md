# Svenska uttryck för Workout Voice Log

Det här uttrycksunderlaget analyserades innan parserreglerna definierades. Det är avsiktligt
vardagligt: korta yttranden är vanligast mitt i ett set, medan längre formuleringar förekommer
när användaren korrigerar planen. Listan är ett testunderlag, inte en lista med exakt text som
användaren måste följa.

## Vikt (12)

1. `75 kilo`
2. `75 kg`
3. `sjuttiofem kilo`
4. `sjuttio fem kilo`
5. `80 kilogram`
6. `nästa 80`
7. `nästa set 80`
8. `80 nästa`
9. `80 till nästa`
10. `nästa 82,5 kilo`
11. `hundra kg`
12. `sextio och ett halvt kilo`

En ensam siffra tolkas inte som vikt när en aktuell vikt finns. En vikt kräver därför en
viktenhet eller en tydlig position vid ”nästa”.

## Repetitioner (16)

13. `åtta`
14. `8`
15. `åtta reps`
16. `8 reps`
17. `åtta repetitioner`
18. `det blev åtta`
19. `jag fick sex`
20. `jag fick bara sex`
21. `bara sex`
22. `klarade tio`
23. `jag klarade tio`
24. `där satt tio`
25. `kör tio`
26. `tolv reps`
27. `noll reps`
28. `tjugo repetitioner`

En ensam giltig siffra blir reps med en tvetydighetsvarning. Repsfraser innebär att setet är
utfört och kan markeras klart efter bekräftelse.

## RPE (12)

29. `RPE åtta`
30. `RPE 8`
31. `RPE nio`
32. `nio i RPE`
33. `åtta på RPE`
34. `ansträngning åtta`
35. `ansträngningen nio`
36. `den var nia`
37. `den var åtta`
38. `det var nio`
39. `RPE tio`
40. `tio i RPE`

”Den var …” reserveras för RPE eftersom uttrycket beskriver upplevd ansträngning efter ett set.

## Viktökning för nästa set (12)

41. `öka två och ett halvt`
42. `öka 2,5`
43. `lägg på fem`
44. `plus fem`
45. `två och ett halvt upp`
46. `fem mer`
47. `höj fem`
48. `+2,5`
49. `lägg på 5 kg`
50. `öka tio`
51. `höj två`
52. `tio upp`

En förändring gäller alltid nästa set; den får aldrig skriva över det pågående setets vikt.

## Viktsänkning för nästa set (12)

53. `minus fem`
54. `sänk fem`
55. `fem mindre`
56. `ner två och ett halvt`
57. `två och ett halvt ner`
58. `dra av fem`
59. `sänk 2,5`
60. `-5`
61. `fem ned`
62. `minus tio`
63. `sänk tio kilo`
64. `dra av 2,5 kg`

## Samma vikt (10)

65. `samma vikt`
66. `behåll vikten`
67. `oförändrad vikt`
68. `samma vikt nästa`
69. `samma nästa`
70. `behåll vikten nästa`
71. `samma vikt till nästa`
72. `oförändrad vikt nästa set`
73. `nästa set samma vikt`
74. `kör samma vikt`

Vikten hämtas ur träningskontexten. Saknad kontext ger varning i stället för en gissning.

## Set klart (10)

75. `klart`
76. `set klart`
77. `markera klart`
78. `färdig`
79. `klar`
80. `setet är klart`
81. `det är klart`
82. `75 kilo åtta reps`
83. `åtta reps 75 kilo`
84. `75 kg, det blev åtta`

## Nästa set (10)

85. `nästa`
86. `nästa set`
87. `till nästa`
88. `öka nästa`
89. `samma nästa`
90. `80 nästa`
91. `nästa 80`
92. `nästa set 82,5`
93. `behåll vikten till nästa`
94. `plus fem nästa`

”Nästa” utan data är navigation. Med vikt eller förändring är det en uppdatering av nästa set.

## Avbryt (10)

95. `avbryt`
96. `ångra`
97. `glöm det`
98. `inte den`
99. `strunta i det`
100. `ta bort det`
101. `avbryt nu`
102. `nej avbryt`
103. `ångra det där`
104. `glöm förra`

De sex första är parserkommandon i version 1. De fyra sista dokumenterar naturliga varianter för
kommande utbyggnad och ska tills dess ge `UnknownIntent`, inte en osäker åtgärd.

## Okänt eller tvetydigt (8)

105. `bra jobbat`
106. `nu kör vi`
107. `bänkpress`
108. `ganska tungt`
109. `kanske åtta eller nio`
110. `lägg in det`
111. `vad är nästa övning`
112. `lite mindre tror jag`

Okända fraser får alltid det strukturerade intentet `UnknownIntent`. Parsern returnerar aldrig
ett fritextsvar och försöker inte fylla luckor med sannolika värden.
