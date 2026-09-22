# Plastic Brains — App Store Listing Spec

App Store Optimization research and copy-paste metadata. **8 shipping localizations** across 7 storefronts, plus research on 2 deferred markets.

All figures measured in Astro 2026.12.0. Popularity is Apple's 5–100 index where **5 is the floor and means no measurable search**. Difficulty is 0–100.

> Re-pull before any release. Difficulty moves as competitors update their listings.

**App UI languages:** `en`, `fr`, `de`, `es`. Spanish was added for this plan; Dutch and Swedish were evaluated and rejected (see Deferred markets).

---
## How Apple reads your metadata

You type every field yourself. Apple translates nothing. Most storefronts index **two** of your localizations.

| Storefront | Primary localization | Also indexed |
|---|---|---|
| United Kingdom | English (U.K.) | — |
| United States | English (U.S.) | Spanish (Mexico) |
| Canada | English (Canada) | French (Canada) |
| Australia | English (Australia) | — |
| Germany | German | **English (U.K.)** |
| France | French | **English (U.K.)** |

Two consequences: your **English (U.K.) field is read in three storefronts**, and **Spanish (Mexico) is 100 free characters in the US**.

Observed by practitioners rather than published by Apple. Verify against your own ranking data after launch.

---
## The eight rules these fields follow

1. **Weight goes to terms you can win** — Ranking pull runs `name > subtitle > keyword field`. Name and subtitle take high-volume **low-competition** terms; unwinnable head terms go in the keyword field, where combination still works.
2. **Unqualified volume is worse than no volume** — Someone searching `note taker` wants stationery, does not install, and Apple reads that as poor conversion on the term. Generic note-taking and meditation words are stripped throughout.
3. **Where the only live term is generic, qualify it in the subtitle** — `therapie`, `terapi` and `emocional` score 5 and win no search. They sit in subtitles so a human self-selects before installing.
4. **Apple combines words across all three fields** — `Therapy` in the name plus `notes` anywhere else ranks you for "therapy notes". Never spend characters on a phrase you can assemble.
5. **Never repeat a word** — Not across name, subtitle and keyword field, and not across the two localizations a storefront reads.
6. **German compounds cannot be assembled** — Apple joins with a space, never by concatenation. `dankbarkeitstagebuch` must appear whole, which is why that field looks expensive.
7. **The description does not rank you on iOS** — Apple indexes name, subtitle, keyword field, developer name and in-app purchase names. **Not the description** — that rule belongs to Google Play. Conversion still feeds ranking indirectly.
8. **No spaces after commas** — A space costs a character and buys nothing. Single words, comma separated, no category or developer name.

---
## Part 1 — Fields to enter

Limits: name 30, subtitle 30, keyword field 100. All counts verified.

### English (U.K.)

*Serves: United Kingdom, plus indexed in Germany and France*

| Field | Chars | Value |
|---|---|---|
| Name | 29/30 | `Plastic Brains: Therapy Notes` |
| Subtitle | 30/30 | `CBT, mood, burnout, depression` |
| Keywords | 90/100 | `journal,diary,tracker,mental,health,self,care,stress,talk,online,trauma,therapist,emotions` |

**Description** (1463 chars — first 170 are the above-fold preview)

```
Therapy works best between the sessions. Plastic Brains helps you capture what comes up during the week, so you arrive at your next appointment knowing what to talk about.

Most of what matters happens when you are not in the room. A thought at 2am. A difficult conversation on Tuesday. Something you meant to raise, gone by Thursday. This gives it somewhere to land.

WHAT IT DOES
• Session notes — capture what came up, before and after each appointment
• Reminders that fit the gap — the evening after a session, the morning after, and one before the next
• Mood tracker — log how you are doing without turning it into homework
• Private by default — entries stay on your device

BUILT FOR THE WORK
Whether you are in CBT, talk therapy or counselling, seeing a therapist in person or online, the pattern is the same: something important surfaces, and then it is gone. This is a journal for the bits in between.

Useful for tracking mood, stress, burnout and low periods, and for the things that are harder to say out loud — depression, anxiety, trauma, emotions you have not found words for yet.

A note on what this is not. It is not therapy, and it is not a substitute for it. It is a diary that makes your mental health care easier to carry between appointments.

SELF CARE WITHOUT THE GUILT
No streaks. No badges. No notification telling you that you have broken a chain. Write when you have something to write.

Download free. Set up takes under a minute.
```

### English (U.S.)

*Serves: United States*

| Field | Chars | Value |
|---|---|---|
| Name | 29/30 | `Plastic Brains: Therapy Notes` |
| Subtitle | 30/30 | `CBT, mood, feelings & emotions` |
| Keywords | 98/100 | `journal,diary,tracker,trauma,reflection,therapist,counseling,private,daily,gratitude,mental,health` |

**Description** (1462 chars — first 170 are the above-fold preview)

```
Therapy works best between the sessions. Plastic Brains helps you capture what comes up during the week, so you arrive at your next appointment knowing what to talk about.

Most of what matters happens when you are not in the room. A thought at 2am. A difficult conversation on Tuesday. Something you meant to raise, gone by Thursday. This gives it somewhere to land.

WHAT IT DOES
• Session notes — capture what came up, before and after each appointment
• Reminders that fit the gap — the evening after a session, the morning after, and one before the next
• Mood tracker — log how you are doing without turning it into homework
• Private by default — entries stay on your device

BUILT FOR THE WORK
Whether you are in CBT, talk therapy or counseling, seeing a therapist in person or online, the pattern is the same: something important surfaces, and then it is gone. This is a journal for the bits in between.

Useful for tracking mood, stress, burnout and low periods, and for the things that are harder to say out loud — depression, anxiety, trauma, emotions you have not found words for yet.

A note on what this is not. It is not therapy, and it is not a substitute for it. It is a diary that makes your mental health care easier to carry between appointments.

SELF CARE WITHOUT THE GUILT
No streaks. No badges. No notification telling you that you have broken a chain. Write when you have something to write.

Download free. Set up takes under a minute.
```

### Spanish (Mexico)

*Serves: Second slot in the United States storefront*

| Field | Chars | Value |
|---|---|---|
| Name | 25/30 | `Plastic Brains: Psicólogo` |
| Subtitle | 27/30 | `Diario emocional y ansiedad` |
| Keywords | 100/100 | `psicologia,personal,mi,estres,bienestar,journal,terapeuta,psicoterapia,autoestima,animo,pensamientos` |

**Description** (1059 chars — first 170 are the above-fold preview)

```
La terapia avanza sobre todo entre sesiones. Plastic Brains guarda lo que aparece durante la semana, para que llegues con tu psicólogo sabiendo de qué hablar.

Lo importante pasa cuando no estás en consulta. Un pensamiento a las dos de la madrugada. Una conversación difícil el martes. Algo que querías contar y el jueves ya no recuerdas.

QUÉ HACE
• Notas de sesión — antes y después de cada cita
• Recordatorios ajustados al intervalo — la tarde después de la sesión, la mañana siguiente y uno antes de la próxima
• Diario emocional — sin que se convierta en una tarea
• Privado — tus entradas se quedan en tu dispositivo

PENSADO PARA ESTE TRABAJO
El patrón siempre es el mismo: aparece algo importante y luego se va. Este diario personal lo recoge.

Útil para el ánimo, el estrés, la ansiedad, la autoestima y el bienestar emocional, y para lo que todavía no sabes cómo decir.

Una aclaración: esta aplicación no es terapia ni la sustituye. Es una libreta que hace más llevadero el tiempo entre citas.

Descarga gratis. Se configura en menos de un minuto.
```

### English (Canada)

*Serves: Canada*

| Field | Chars | Value |
|---|---|---|
| Name | 29/30 | `Plastic Brains: Therapy Notes` |
| Subtitle | 26/30 | `Mood, wellbeing & emotions` |
| Keywords | 97/100 | `reflection,burnout,depression,tracker,self,care,mental,health,diary,journal,stress,relief,anxiety` |

**Description** (1463 chars — first 170 are the above-fold preview)

```
Therapy works best between the sessions. Plastic Brains helps you capture what comes up during the week, so you arrive at your next appointment knowing what to talk about.

Most of what matters happens when you are not in the room. A thought at 2am. A difficult conversation on Tuesday. Something you meant to raise, gone by Thursday. This gives it somewhere to land.

WHAT IT DOES
• Session notes — capture what came up, before and after each appointment
• Reminders that fit the gap — the evening after a session, the morning after, and one before the next
• Mood tracker — log how you are doing without turning it into homework
• Private by default — entries stay on your device

BUILT FOR THE WORK
Whether you are in CBT, talk therapy or counselling, seeing a therapist in person or online, the pattern is the same: something important surfaces, and then it is gone. This is a journal for the bits in between.

Useful for tracking mood, stress, burnout and low periods, and for the things that are harder to say out loud — depression, anxiety, trauma, emotions you have not found words for yet.

A note on what this is not. It is not therapy, and it is not a substitute for it. It is a diary that makes your mental health care easier to carry between appointments.

SELF CARE WITHOUT THE GUILT
No streaks. No badges. No notification telling you that you have broken a chain. Write when you have something to write.

Download free. Set up takes under a minute.
```

### French (Canada)

*Serves: Second slot in the Canada storefront — built on France data, not measured*

| Field | Chars | Value |
|---|---|---|
| Name | 23/30 | `Plastic Brains: Journal` |
| Subtitle | 27/30 | `Psy, psychologue & thérapie` |
| Keywords | 88/100 | `therapie,intime,carnet,secret,tcc,confiance,sante,mentale,suivi,pensees,humeur,gratitude` |

**Description** (1172 chars — first 170 are the above-fold preview)

```
La thérapie avance surtout entre les séances. Plastic Brains note ce qui remonte pendant la semaine, pour arriver chez votre psy en sachant de quoi parler.

L'essentiel se passe quand vous n'êtes pas dans le cabinet. Une pensée à deux heures du matin. Une conversation difficile le mardi. Quelque chose que vous vouliez dire, oublié le jeudi.

CE QUE FAIT L'APPLICATION
• Notes de séance — avant et après chaque rendez-vous
• Rappels adaptés à l'intervalle — le soir après la séance, le lendemain matin, puis avant la suivante
• Suivi de l'humeur — sans que cela devienne un devoir
• Carnet privé — vos entrées restent sur votre appareil

PENSÉE POUR CE TRAVAIL
Que vous soyez en TCC, en psychothérapie ou en suivi avec un psychologue, le schéma est le même : quelque chose d'important surgit, puis disparaît. Ce journal intime le retient.

Utile pour le stress, la confiance en soi, la pleine conscience et les émotions que vous n'arrivez pas encore à nommer.

Une précision : cette application n'est pas une thérapie et ne la remplace pas. C'est un carnet qui rend le suivi plus simple entre deux rendez-vous.

Téléchargement gratuit. Installation en moins d'une minute.
```

### English (Australia)

*Serves: Australia*

| Field | Chars | Value |
|---|---|---|
| Name | 29/30 | `Plastic Brains: Therapy Notes` |
| Subtitle | 21/30 | `CBT, mood & wellbeing` |
| Keywords | 95/100 | `emotions,reflection,talk,online,therapist,trauma,burnout,diary,tracker,gratitude,journal,stress` |

**Description** (1463 chars — first 170 are the above-fold preview)

```
Therapy works best between the sessions. Plastic Brains helps you capture what comes up during the week, so you arrive at your next appointment knowing what to talk about.

Most of what matters happens when you are not in the room. A thought at 2am. A difficult conversation on Tuesday. Something you meant to raise, gone by Thursday. This gives it somewhere to land.

WHAT IT DOES
• Session notes — capture what came up, before and after each appointment
• Reminders that fit the gap — the evening after a session, the morning after, and one before the next
• Mood tracker — log how you are doing without turning it into homework
• Private by default — entries stay on your device

BUILT FOR THE WORK
Whether you are in CBT, talk therapy or counselling, seeing a therapist in person or online, the pattern is the same: something important surfaces, and then it is gone. This is a journal for the bits in between.

Useful for tracking mood, stress, burnout and low periods, and for the things that are harder to say out loud — depression, anxiety, trauma, emotions you have not found words for yet.

A note on what this is not. It is not therapy, and it is not a substitute for it. It is a diary that makes your mental health care easier to carry between appointments.

SELF CARE WITHOUT THE GUILT
No streaks. No badges. No notification telling you that you have broken a chain. Write when you have something to write.

Download free. Set up takes under a minute.
```

### German

*Serves: Germany, alongside English (U.K.)*

| Field | Chars | Value |
|---|---|---|
| Name | 24/30 | `Plastic Brains: Tagebuch` |
| Subtitle | 28/30 | `Psychotherapie, Panikattacke` |
| Keywords | 95/100 | `stimmungstagebuch,dankbarkeitstagebuch,reflexion,achtsamkeit,mein,gefühle,therapie,angststörung` |

**Description** (1182 chars — first 170 are the above-fold preview)

```
Therapie wirkt am besten zwischen den Sitzungen. Plastic Brains hält fest, was in der Woche auftaucht, damit du beim nächsten Termin weißt, worüber du sprechen willst.

Das Wichtigste passiert, wenn du nicht im Raum bist. Ein Gedanke um zwei Uhr nachts. Ein schwieriges Gespräch am Dienstag. Etwas, das du ansprechen wolltest und bis Donnerstag vergessen hast.

WAS DIE APP MACHT
• Sitzungsnotizen — vor und nach jedem Termin
• Erinnerungen, die zur Lücke passen — abends nach der Sitzung, am Morgen danach und einmal vor dem nächsten Termin
• Stimmungstagebuch — ohne dass es sich wie eine Hausaufgabe anfühlt
• Privat — deine Einträge bleiben auf deinem Gerät

FÜR DIE ARBEIT GEMACHT
Ob Verhaltenstherapie, Psychotherapie oder Gesprächstherapie: Das Muster ist immer gleich. Etwas Wichtiges taucht auf, und dann ist es weg. Dieses Tagebuch fängt es auf.

Hilfreich bei Stress, Burnout, Reflexion, Angststörung und Panikattacke, und für Gefühle, für die du noch keine Worte gefunden hast.

Ein Hinweis: Diese App ist keine Therapie und ersetzt keine. Sie ist ein Notizbuch, das die Zeit zwischen den Terminen leichter macht.

Kostenlos laden. Einrichtung dauert unter einer Minute.
```

### French

*Serves: France, alongside English (U.K.)*

| Field | Chars | Value |
|---|---|---|
| Name | 23/30 | `Plastic Brains: Journal` |
| Subtitle | 27/30 | `Psy, psychologue & thérapie` |
| Keywords | 88/100 | `therapie,intime,carnet,secret,tcc,confiance,sante,mentale,pleine,conscience,humeur,suivi` |

**Description** (1172 chars — first 170 are the above-fold preview)

```
La thérapie avance surtout entre les séances. Plastic Brains note ce qui remonte pendant la semaine, pour arriver chez votre psy en sachant de quoi parler.

L'essentiel se passe quand vous n'êtes pas dans le cabinet. Une pensée à deux heures du matin. Une conversation difficile le mardi. Quelque chose que vous vouliez dire, oublié le jeudi.

CE QUE FAIT L'APPLICATION
• Notes de séance — avant et après chaque rendez-vous
• Rappels adaptés à l'intervalle — le soir après la séance, le lendemain matin, puis avant la suivante
• Suivi de l'humeur — sans que cela devienne un devoir
• Carnet privé — vos entrées restent sur votre appareil

PENSÉE POUR CE TRAVAIL
Que vous soyez en TCC, en psychothérapie ou en suivi avec un psychologue, le schéma est le même : quelque chose d'important surgit, puis disparaît. Ce journal intime le retient.

Utile pour le stress, la confiance en soi, la pleine conscience et les émotions que vous n'arrivez pas encore à nommer.

Une précision : cette application n'est pas une thérapie et ne la remplace pas. C'est un carnet qui rend le suivi plus simple entre deux rendez-vous.

Téléchargement gratuit. Installation en moins d'une minute.
```

---
## Part 2 — Measured keyword data by storefront

Volume bands: High ≥40 · Medium 20–39 · Low 6–19. Competition: High ≥60 · Medium 40–59 · Low <40.

### United Kingdom (`gb`) — 36 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notes` | 72 | 64 | High vol / High comp |
| `journal` | 65 | 59 | High vol / Medium comp |
| `diary` | 59 | 53 | High vol / Medium comp |
| `meditation` | 56 | 65 | High vol / High comp |
| `mental health` | 54 | 57 | High vol / Medium comp |
| `mindfulness` | 53 | 59 | High vol / Medium comp |
| `betterhelp` | 51 | 46 | High vol / Medium comp |
| `mood tracker` | 50 | 50 | High vol / Medium comp |
| `notebook` | 50 | 58 | High vol / Medium comp |
| `notepad` | 49 | 54 | High vol / Medium comp |
| `talkspace` | 42 | 19 | High vol / Low comp |
| `mood` | 38 | 23 | Medium vol / Low comp |
| `therapy` | 38 | 49 | Medium vol / Medium comp |
| `cbt` | 37 | 23 | Medium vol / Low comp |
| `self care` | 36 | 58 | Medium vol / Medium comp |
| `therapy notes` | 35 | 15 | Medium vol / Low comp |
| `gratitude journal` | 32 | 42 | Medium vol / Medium comp |
| `burnout` | 28 | 13 | Medium vol / Low comp |
| `depression` | 27 | 39 | Medium vol / Low comp |
| `mental health app` | 13 | 47 | Low vol / Medium comp |
| `talk therapy` | 13 | 13 | Low vol / Low comp |
| `anxiety` | 9 | 55 | Low vol / Medium comp |
| `emotions` | 9 | 40 | Low vol / Medium comp |
| `journaling` | 9 | 53 | Low vol / Medium comp |
| `notes app` | 9 | 56 | Low vol / Medium comp |
| `online therapy` | 8 | 15 | Low vol / Low comp |
| `journal app` | 7 | 53 | Low vol / Medium comp |
| `note taker` | 7 | 55 | Low vol / Medium comp |
| `daily journal` | 6 | 51 | Low vol / Medium comp |
| `reflection` | 6 | 23 | Low vol / Low comp |
| `self help` | 6 | 56 | Low vol / Medium comp |
| `stress relief` | 6 | 49 | Low vol / Medium comp |
| `therapist` | 6 | 19 | Low vol / Low comp |
| `therapy app` | 6 | 40 | Low vol / Medium comp |
| `trauma` | 6 | 13 | Low vol / Low comp |
| `wellbeing` | 6 | 55 | Low vol / Medium comp |

### United States (`us`) — 45 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notes` | 74 | 73 | High vol / High comp |
| `journal` | 67 | 75 | High vol / High comp |
| `betterhelp` | 60 | 66 | High vol / High comp |
| `notebook` | 60 | 74 | High vol / High comp |
| `meditation` | 58 | 80 | High vol / High comp |
| `mental health` | 55 | 74 | High vol / High comp |
| `notepad` | 54 | 69 | High vol / High comp |
| `therapy` | 54 | 70 | High vol / High comp |
| `mood tracker` | 53 | 60 | High vol / High comp |
| `diary` | 50 | 67 | High vol / High comp |
| `cbt` | 48 | 51 | High vol / Medium comp |
| `mood` | 48 | 43 | High vol / Medium comp |
| `mindfulness` | 44 | 75 | High vol / High comp |
| `talkspace` | 41 | 44 | High vol / Medium comp |
| `gratitude journal` | 33 | 60 | Medium vol / High comp |
| `therapy notes` | 33 | 19 | Medium vol / Low comp |
| `journal app` | 26 | 75 | Medium vol / High comp |
| `therapist` | 24 | 47 | Medium vol / Medium comp |
| `feelings` | 21 | 19 | Medium vol / Low comp |
| `private journal` | 21 | 49 | Medium vol / Medium comp |
| `therapynotes` | 21 | 13 | Medium vol / Low comp |
| `emotions` | 17 | 23 | Low vol / Low comp |
| `counseling` | 15 | 42 | Low vol / Medium comp |
| `therapy journal` | 14 | 58 | Low vol / Medium comp |
| `mental health app` | 13 | 66 | Low vol / High comp |
| `talk therapy` | 13 | 46 | Low vol / Medium comp |
| `daily journal` | 9 | 62 | Low vol / High comp |
| `mental health journal` | 9 | 68 | Low vol / High comp |
| `mood journal` | 9 | 51 | Low vol / Medium comp |
| `notes app` | 9 | 70 | Low vol / High comp |
| `self help` | 9 | 71 | Low vol / High comp |
| `trauma` | 9 | 19 | Low vol / Low comp |
| `wellbeing` | 9 | 42 | Low vol / Medium comp |
| `journaling` | 8 | 71 | Low vol / High comp |
| `note taker` | 8 | 65 | Low vol / High comp |
| `online therapy` | 8 | 53 | Low vol / Medium comp |
| `stress relief` | 8 | 65 | Low vol / High comp |
| `anxiety` | 7 | 66 | Low vol / High comp |
| `depression` | 7 | 56 | Low vol / Medium comp |
| `self care` | 7 | 64 | Low vol / High comp |
| `burnout` | 6 | 45 | Low vol / Medium comp |
| `mental health tracker` | 6 | 62 | Low vol / High comp |
| `mood diary` | 6 | 60 | Low vol / High comp |
| `reflection` | 6 | 23 | Low vol / Low comp |
| `therapy app` | 6 | 66 | Low vol / High comp |

### Canada (`ca`) — 30 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notes` | 71 | 58 | High vol / Medium comp |
| `journal` | 64 | 55 | High vol / Medium comp |
| `meditation` | 56 | 67 | High vol / High comp |
| `notebook` | 54 | 49 | High vol / Medium comp |
| `mental health` | 50 | 54 | High vol / Medium comp |
| `mood tracker` | 48 | 43 | High vol / Medium comp |
| `self care` | 48 | 53 | High vol / Medium comp |
| `notepad` | 44 | 50 | High vol / Medium comp |
| `diary` | 41 | 48 | High vol / Medium comp |
| `talkspace` | 41 | 17 | High vol / Low comp |
| `mood` | 39 | 17 | Medium vol / Low comp |
| `mindfulness` | 38 | 55 | Medium vol / Medium comp |
| `therapy notes` | 34 | 5 | Medium vol / Low comp |
| `note taker` | 33 | 50 | Medium vol / Medium comp |
| `therapy` | 33 | 46 | Medium vol / Medium comp |
| `betterhelp` | 32 | 36 | Medium vol / Low comp |
| `wellbeing` | 30 | 9 | Medium vol / Low comp |
| `stress relief` | 28 | 38 | Medium vol / Low comp |
| `emotions` | 25 | 21 | Medium vol / Low comp |
| `anxiety` | 9 | 54 | Low vol / Medium comp |
| `burnout` | 9 | 15 | Low vol / Low comp |
| `journal app` | 9 | 46 | Low vol / Medium comp |
| `mental health journal` | 9 | 45 | Low vol / Medium comp |
| `self help` | 9 | 55 | Low vol / Medium comp |
| `depression` | 8 | 19 | Low vol / Low comp |
| `journaling` | 8 | 53 | Low vol / Medium comp |
| `daily journal` | 7 | 47 | Low vol / Medium comp |
| `gratitude journal` | 7 | 41 | Low vol / Medium comp |
| `cbt` | 6 | 40 | Low vol / Medium comp |
| `reflection` | 6 | 11 | Low vol / Low comp |

### Australia (`au`) — 36 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notes` | 70 | 52 | High vol / Medium comp |
| `journal` | 63 | 51 | High vol / Medium comp |
| `diary` | 55 | 49 | High vol / Medium comp |
| `meditation` | 54 | 63 | High vol / High comp |
| `mindfulness` | 50 | 59 | High vol / Medium comp |
| `mental health` | 49 | 55 | High vol / Medium comp |
| `wellbeing` | 49 | 44 | High vol / Medium comp |
| `notebook` | 48 | 48 | High vol / Medium comp |
| `mood tracker` | 46 | 41 | High vol / Medium comp |
| `notepad` | 42 | 46 | High vol / Medium comp |
| `talkspace` | 42 | 15 | High vol / Low comp |
| `self care` | 36 | 55 | Medium vol / Medium comp |
| `mood` | 35 | 21 | Medium vol / Low comp |
| `therapy notes` | 35 | 17 | Medium vol / Low comp |
| `betterhelp` | 32 | 36 | Medium vol / Low comp |
| `gratitude journal` | 32 | 43 | Medium vol / Medium comp |
| `cbt` | 31 | 19 | Medium vol / Low comp |
| `therapy` | 30 | 43 | Medium vol / Medium comp |
| `burnout` | 28 | 39 | Medium vol / Low comp |
| `journal app` | 25 | 23 | Medium vol / Low comp |
| `stress relief` | 24 | 40 | Medium vol / Medium comp |
| `emotions` | 17 | 19 | Low vol / Low comp |
| `mental health app` | 13 | 54 | Low vol / Medium comp |
| `talk therapy` | 13 | 13 | Low vol / Low comp |
| `anxiety` | 9 | 42 | Low vol / Medium comp |
| `journaling` | 9 | 51 | Low vol / Medium comp |
| `note taker` | 8 | 56 | Low vol / Medium comp |
| `online therapy` | 8 | 17 | Low vol / Low comp |
| `reflection` | 7 | 13 | Low vol / Low comp |
| `daily journal` | 6 | 47 | Low vol / Medium comp |
| `depression` | 6 | 37 | Low vol / Low comp |
| `mental health journal` | 6 | 48 | Low vol / Medium comp |
| `self help` | 6 | 54 | Low vol / Medium comp |
| `therapist` | 6 | 15 | Low vol / Low comp |
| `therapy app` | 6 | 23 | Low vol / Low comp |
| `trauma` | 6 | 13 | Low vol / Low comp |

### Germany (`de`) — 29 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notes` | 64 | 65 | High vol / High comp |
| `journal` | 63 | 55 | High vol / Medium comp |
| `tagebuch` | 60 | 50 | High vol / Medium comp |
| `meditation` | 57 | 64 | High vol / High comp |
| `notebook` | 57 | 55 | High vol / Medium comp |
| `achtsamkeit` | 51 | 61 | High vol / High comp |
| `notepad` | 42 | 55 | High vol / Medium comp |
| `stress` | 39 | 51 | Medium vol / Medium comp |
| `note taker` | 33 | 56 | Medium vol / Medium comp |
| `burnout` | 29 | 43 | Medium vol / Medium comp |
| `therapie` | 27 | 47 | Medium vol / Medium comp |
| `notizbuch` | 24 | 60 | Medium vol / High comp |
| `reflexion` | 24 | 44 | Medium vol / Medium comp |
| `psychotherapie` | 21 | 38 | Medium vol / Low comp |
| `dankbarkeitstagebuch` | 17 | 23 | Low vol / Low comp |
| `mein tagebuch` | 16 | 48 | Low vol / Medium comp |
| `stimmungstagebuch` | 15 | 39 | Low vol / Low comp |
| `panikattacke` | 14 | 21 | Low vol / Low comp |
| `gefühle` | 13 | 41 | Low vol / Medium comp |
| `angststörung` | 10 | 38 | Low vol / Low comp |
| `mental health journal` | 9 | 54 | Low vol / Medium comp |
| `mood diary` | 9 | 41 | Low vol / Medium comp |
| `dankbarkeit` | 7 | 40 | Low vol / Medium comp |
| `depression` | 7 | 48 | Low vol / Medium comp |
| `journaling` | 7 | 50 | Low vol / Medium comp |
| `mentale gesundheit` | 7 | 42 | Low vol / Medium comp |
| `mood journal` | 7 | 47 | Low vol / Medium comp |
| `notes app` | 7 | 59 | Low vol / Medium comp |
| `tagebuch app` | 6 | 55 | Low vol / Medium comp |

### France (`fr`) — 29 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notes` | 64 | 63 | High vol / High comp |
| `journal` | 61 | 58 | High vol / Medium comp |
| `journal intime` | 57 | 52 | High vol / Medium comp |
| `notebook` | 56 | 56 | High vol / Medium comp |
| `stress` | 41 | 47 | High vol / Medium comp |
| `notepad` | 38 | 53 | Medium vol / Medium comp |
| `therapy notes` | 34 | 9 | Medium vol / Low comp |
| `note taker` | 33 | 48 | Medium vol / Medium comp |
| `carnet` | 27 | 45 | Medium vol / Medium comp |
| `therapie` | 26 | 37 | Medium vol / Low comp |
| `psychologue` | 22 | 23 | Medium vol / Low comp |
| `psy` | 20 | 11 | Medium vol / Low comp |
| `relaxation` | 18 | 61 | Low vol / High comp |
| `carnet secret` | 17 | 45 | Low vol / Medium comp |
| `pleine conscience` | 16 | 52 | Low vol / Medium comp |
| `sante mentale` | 16 | 47 | Low vol / Medium comp |
| `confiance en soi` | 13 | 21 | Low vol / Low comp |
| `mon journal` | 12 | 49 | Low vol / Medium comp |
| `mental health journal` | 11 | 51 | Low vol / Medium comp |
| `mon journal intime` | 11 | 49 | Low vol / Medium comp |
| `burnout` | 9 | 50 | Low vol / Medium comp |
| `journaling` | 9 | 49 | Low vol / Medium comp |
| `méditation` | 9 | 67 | Low vol / High comp |
| `notes app` | 9 | 63 | Low vol / High comp |
| `gratitude` | 8 | 21 | Low vol / Low comp |
| `journal de bord` | 8 | 61 | Low vol / High comp |
| `tcc` | 8 | 19 | Low vol / Low comp |
| `humeur` | 7 | 21 | Low vol / Low comp |
| `anxiété` | 6 | 45 | Low vol / Medium comp |

### Mexico (Spanish) (`mx`) — 17 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `bienestar` | 73 | 58 | High vol / Medium comp |
| `notas` | 70 | 58 | High vol / Medium comp |
| `diario` | 59 | 54 | High vol / Medium comp |
| `notes` | 59 | 67 | High vol / High comp |
| `journal` | 54 | 48 | High vol / Medium comp |
| `diario personal` | 53 | 50 | High vol / Medium comp |
| `habitos` | 53 | 46 | High vol / Medium comp |
| `meditacion` | 47 | 57 | High vol / Medium comp |
| `ansiedad` | 42 | 41 | High vol / Medium comp |
| `apuntes` | 42 | 52 | High vol / Medium comp |
| `mindfulness` | 42 | 47 | High vol / Medium comp |
| `psicologia` | 42 | 15 | High vol / Low comp |
| `psicologo` | 42 | 19 | High vol / Low comp |
| `mi diario` | 25 | 38 | Medium vol / Low comp |
| `cuaderno` | 24 | 49 | Medium vol / Medium comp |
| `libreta` | 23 | 46 | Medium vol / Medium comp |
| `estres` | 16 | 41 | Low vol / Medium comp |

### Netherlands (deferred) (`nl`) — 12 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `notities` | 68 | 42 | High vol / Medium comp |
| `notes` | 65 | 46 | High vol / Medium comp |
| `dagboek` | 61 | 44 | High vol / Medium comp |
| `journal` | 60 | 47 | High vol / Medium comp |
| `mindfulness` | 56 | 55 | High vol / Medium comp |
| `slaap` | 53 | 52 | High vol / Medium comp |
| `meditatie` | 52 | 56 | High vol / Medium comp |
| `rust` | 44 | 23 | High vol / Low comp |
| `diary` | 35 | 41 | Medium vol / Medium comp |
| `mood` | 33 | 23 | Medium vol / Low comp |
| `stress` | 33 | 41 | Medium vol / Medium comp |
| `notitie` | 23 | 41 | Medium vol / Medium comp |

### Sweden (deferred) (`se`) — 10 terms with measurable search

| Keyword | Volume | Competition | Read |
|---|---|---|---|
| `anteckningar` | 68 | 23 | High vol / Low comp |
| `notes` | 63 | 45 | High vol / Medium comp |
| `dagbok` | 61 | 49 | High vol / Medium comp |
| `journal` | 56 | 49 | High vol / Medium comp |
| `meditation` | 56 | 52 | High vol / Medium comp |
| `mindfulness` | 54 | 45 | High vol / Medium comp |
| `sömn` | 54 | 44 | High vol / Medium comp |
| `diary` | 39 | 44 | Medium vol / Medium comp |
| `mood` | 31 | 38 | Medium vol / Low comp |
| `stress` | 31 | 48 | Medium vol / Medium comp |

---
## Part 3 — Terms measured at Apple's floor

Each scored 5, meaning the search does not happen. The words a translator or a reasonable guess would hand you.

**United Kingdom** (32): `cbt notes`, `counseling`, `counselling`, `counselling notes`, `counselor`, `feelings`, `mental wellness`, `panic attack`, `private journal`, `psychologist`, `psychotherapy`, `psychotherapy notes`, `session notes`, `therapy check in`, `therapy companion`, `therapy diary`, `therapy homework`, `therapy journal`, `therapy log`, `therapy note taker`, `therapy notebook`, `therapy planner`, `therapy prep`, `therapy progress`, `therapy reflection`, `therapy reflections`, `therapy reminder`, `therapy reminders`, `therapy session`, `therapy session notes`, `therapy tracker`, `therapy worksheets`

**United States** (61): `after therapy`, `after therapy journal`, `anxiety diary`, `anxiety journal`, `between therapy sessions`, `cbt diary`, `cbt exercises`, `cbt journal`, `cbt notes`, `cbt tracker`, `counselling`, `counselling diary`, `counselling journal`, `counselling notes`, `counselor`, `emotional journal`, `mental health diary`, `mental health notes`, `mental wellness`, `panic attack`, `psychologist`, `psychotherapy`, `psychotherapy journal`, `psychotherapy notes`, `reflection journal`, `self reflection`, `self reflection journal`, `session journal`, `session notes`, `therapy anxiety`, `therapy appointment notes`, `therapy between sessions`, `therapy check in`, `therapy companion`, `therapy diary`, `therapy exercises`, `therapy goals`, `therapy homework`, `therapy insights`, `therapy log`, `therapy note taker`, `therapy notebook`, `therapy notes client`, `therapy notes patient`, `therapy patient`, `therapy planner`, `therapy prep`, `therapy preparation`, `therapy progress`, `therapy progress tracker`, `therapy record`, `therapy records`, `therapy reflection`, `therapy reflections`, `therapy reminder`, `therapy reminders`, `therapy session journal`, `therapy session notes`, `therapy tracker`, `therapy worksheets`, `wellbeing journal`

**Canada** (43): `counseling`, `counselling`, `counselling diary`, `counselling journal`, `counselor`, `feelings`, `guided journal`, `mental health app`, `mental health diary`, `mental wellness`, `online therapy`, `panic attack`, `personal journal`, `private journal`, `psychologist`, `psychotherapy`, `psychotherapy journal`, `psychotherapy notes`, `session journal`, `session notes`, `talk therapy`, `therapist`, `therapy app`, `therapy companion`, `therapy diary`, `therapy exercises`, `therapy homework`, `therapy insights`, `therapy journal`, `therapy log`, `therapy planner`, `therapy prep`, `therapy preparation`, `therapy progress`, `therapy record`, `therapy records`, `therapy reflection`, `therapy reflections`, `therapy reminder`, `therapy reminders`, `therapy session journal`, `therapy tracker`, `trauma`

**Australia** (38): `counseling`, `counselling`, `counselling diary`, `counselling journal`, `counselor`, `feelings`, `guided journal`, `mental health diary`, `mental health notes`, `mental wellness`, `panic attack`, `personal journal`, `private journal`, `psychologist`, `psychotherapy`, `psychotherapy journal`, `psychotherapy notes`, `session journal`, `session notes`, `therapy companion`, `therapy diary`, `therapy exercises`, `therapy homework`, `therapy insights`, `therapy journal`, `therapy log`, `therapy planner`, `therapy prep`, `therapy preparation`, `therapy progress`, `therapy record`, `therapy records`, `therapy reflection`, `therapy reflections`, `therapy reminder`, `therapy reminders`, `therapy session journal`, `therapy tracker`

**Germany** (91): `after therapy`, `after therapy journal`, `angst`, `anxiety diary`, `anxiety journal`, `between therapy sessions`, `cbt diary`, `cbt exercises`, `cbt journal`, `cbt notes`, `cbt tracker`, `counselling diary`, `counselling journal`, `counselling notes`, `emotional journal`, `emotionen`, `gedanken`, `gedanken aufschreiben`, `gedanken tagebuch`, `gedankentagebuch`, `mental health diary`, `mental health notes`, `mentale gesundheit app`, `online therapie`, `persönliches tagebuch`, `privates tagebuch`, `psychische gesundheit`, `psychologe`, `psychotherapie notizen`, `psychotherapie tagebuch`, `psychotherapy journal`, `psychotherapy notes`, `reflection journal`, `reflexion tagebuch`, `seelische gesundheit`, `selbstfürsorge`, `selbsthilfe`, `selbstreflexion`, `self reflection`, `self reflection journal`, `session journal`, `session notes`, `sitzungsnotizen`, `stimmung`, `stimmungstracker`, `tagebuch mit fragen`, `tagebuch privat`, `tagebuch schreiben`, `therapeut`, `therapie app`, `therapie begleiter`, `therapie erinnerung`, `therapie journal`, `therapie kalender`, `therapie notizbuch`, `therapie notizen`, `therapie tagebuch`, `therapie vorbereitung`, `therapie-tagebuch`, `therapie-tagebuch mit erinnerung`, `therapiebegleiter`, `therapienotizbuch`, `therapienotizen`, `therapieprotokoll`, `therapiesitzung`, `therapietagebuch`, `therapy appointment`, `therapy appointment notes`, `therapy between sessions`, `therapy check in`, `therapy companion`, `therapy diary`, `therapy goals`, `therapy homework`, `therapy journal`, `therapy log`, `therapy note taker`, `therapy notebook`, `therapy notes`, `therapy prep`, `therapy progress tracker`, `therapy record`, `therapy records`, `therapy session journal`, `therapy session notes`, `therapy tracker`, `therapy worksheets`, `trauma`, `verhaltenstherapie`, `wellbeing journal`, `wohlbefinden`

**France** (80): `bien être mental`, `bien-être`, `carnet de pensées`, `carnet de suivi`, `carnet de thérapie`, `carnet intime`, `carnet personnel`, `carnet psy`, `carnet thérapie`, `counselling diary`, `counselling journal`, `counselling notes`, `dépression`, `développement personnel`, `introspection`, `journal de gratitude`, `journal de l'humeur`, `journal de pensées`, `journal de thérapie`, `journal de thérapie privé`, `journal des pensées`, `journal guide`, `journal guidé`, `journal humeur`, `journal humeur app`, `journal personnel`, `journal prive`, `journal privé`, `journal santé mentale`, `journal secret`, `journal thérapeutique`, `journal thérapie`, `mental health diary`, `mental health notes`, `notes de thérapie`, `notes personnelles`, `notes psy`, `notes thérapie`, `psychologue en ligne`, `psychotherapy journal`, `psychotherapy notes`, `psychothérapie`, `réflexion personnelle`, `santé mentale`, `santé mentale app`, `session journal`, `session notes`, `suivi humeur`, `suivi thérapie`, `séance de thérapie`, `therapy check in`, `therapy companion`, `therapy diary`, `therapy exercises`, `therapy homework`, `therapy insights`, `therapy journal`, `therapy log`, `therapy note taker`, `therapy notebook`, `therapy planner`, `therapy prep`, `therapy preparation`, `therapy progress`, `therapy record`, `therapy records`, `therapy reflection`, `therapy reflections`, `therapy reminder`, `therapy reminders`, `therapy session journal`, `therapy session notes`, `therapy tracker`, `therapy worksheets`, `thérapeute`, `thérapie`, `thérapie cognitive`, `thérapie en ligne`, `écriture thérapeutique`, `émotions`

**Mexico (Spanish)** (70): `agradecimiento`, `animo`, `ataque de panico`, `atencion plena`, `autoconocimiento`, `autocuidado`, `autoestima`, `autorreflexión`, `bienestar emocional`, `bitácora de terapia`, `calma`, `consulta psicologica`, `cuaderno de terapia`, `cuaderno personal`, `cuaderno terapia`, `depresion`, `diario con contraseña`, `diario de animo`, `diario de emociones`, `diario de gratitud`, `diario de pensamientos`, `diario de reflexión`, `diario de terapia`, `diario digital`, `diario emocional`, `diario guiado`, `diario intimo`, `diario pensamientos`, `diario privado`, `diario salud mental`, `diario secreto`, `diario terapia`, `diario terapéutico`, `diario íntimo`, `emociones`, `escribir diario`, `escritura terapéutica`, `estado de animo`, `estado de ánimo`, `gratitud`, `humor`, `insomnio`, `journaling`, `libreta digital`, `mi psicologo`, `notas de terapia`, `notas personales`, `notas rapidas`, `notas terapia`, `pensamientos`, `psicologa`, `psicoterapia`, `psicólogo`, `recordatorio terapia`, `reflexion`, `reflexión personal`, `registro emocional`, `relajacion`, `respiracion`, `salud emocional`, `salud mental`, `seguimiento terapia`, `sentimientos`, `sesiones de terapia`, `tcc`, `terapeuta`, `terapia`, `terapia en linea`, `therapy journal`, `therapy notes`

**Netherlands (deferred)** (32): `aantekeningen`, `angst`, `burn-out`, `cbt`, `dagboek app`, `dankbaarheid`, `dankbaarheidsdagboek`, `depressie`, `emoties`, `feelings`, `gedachten`, `geheim dagboek`, `gevoel`, `gevoelens`, `gratitude`, `journaling`, `kalm`, `mentale gezondheid`, `mijn dagboek`, `note taker`, `notitieboek`, `persoonlijk`, `privé dagboek`, `psycholoog`, `reflectie`, `stemming`, `therapie`, `therapie dagboek`, `therapy notes`, `wellbeing`, `zelfhulp`, `zelfzorg`

**Sweden (deferred)** (33): `anteckning`, `anteckningsblock`, `avslappning`, `cbt`, `dagbok app`, `depression`, `egenvård`, `feelings`, `gratitude`, `hemlig dagbok`, `humör`, `journaling`, `känsla`, `känslor`, `lugn`, `mental hälsa`, `min dagbok`, `må bra`, `note taker`, `personlig`, `privat dagbok`, `psykolog`, `reflektion`, `självhjälp`, `tacksamhet`, `tacksamhetsdagbok`, `tankar`, `terapi`, `terapidagbok`, `therapy notes`, `utbrändhet`, `wellbeing`, `ångest`

---
## Deferred markets: Netherlands and Sweden

Both were specced in full and both are dropped. The reason is in Part 3.

- Every clinical term in both languages measured at the floor: `therapie`, `psycholoog`, `angst`, `depressie`, `terapi`, `psykolog`, `ångest`, `humör`.
- `therapy notes` also scores 5 in both, so the English field does not rescue them.
- What stays reachable is generic. `notities` (68) and `anteckningar` (68) both simply mean notes.
- Netherlands has 12 live terms, Sweden 10, none qualified for a therapy app.

Sweden's `anteckningar` at 68 volume against difficulty 23 is the best ratio in the entire dataset, and it is still the wrong traffic. Revisit if the app gains traction elsewhere.

---
## Known gaps

- **French (Canada)** is the only shipping field not measured in its own storefront. Built on France data; Canadian French differs on anglicisms.
- **Icon, screenshots, preview video and ratings** are unassessed. They need design assets and a live listing.
- `betterhelp` and `talkspace` show strong volume at low difficulty but are competitor trademarks. Using them breaches App Store Review Guideline 5.2.1.
