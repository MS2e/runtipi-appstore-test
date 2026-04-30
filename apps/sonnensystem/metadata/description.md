# ☀️ Sonnensystem 3D

Interaktive 3D-Simulation unseres Sonnensystems — alles in einer einzigen HTML-Datei.

## Features

- **8 Planeten** mit prozedural generierten Texturen
- **Sonne** mit pulsierendem Glow-Effekt
- **Saturnringe** mit realistischen Bandstrukturen
- **Alle Monde** (Mond, Phobos, Deimos, Io, Europa, Ganymed, Kallisto, Titan, Enceladus, Titania, Oberon, Triton)
- **Asteroidengürtel** zwischen Mars und Jupiter (3000 Objekte)
- **20.000-Sterne-Hintergrund**

## Steuerung

- **Maus**: Drehen, Zoomen, Schwenken
- **Klick**: Planet anklicken → Kamera fliegt hin + Infobox mit Fakten
- **UI-Panel**: Zeitgeschwindigkeit, Pause, Vogelperspektive, Orbits/Labels an/aus

## Technik

- Three.js für 3D-Rendering
- Keine externen Bilder — alles prozedural
- Single HTML file — kein Build nötig
- Nginx Alpine Container (~5MB)
