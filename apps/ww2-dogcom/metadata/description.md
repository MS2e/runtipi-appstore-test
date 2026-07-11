# WW2 Dogcom - Flight Simulator

Ein voll procedualer 3D-Dogfight-Simulator, der direkt im Browser läuft. Keine Installation, kein Download - einfach fliegen!

## 🛩️ Features

- **Prozedurale Flugzeugmodelle** - Spitfire Mk.V, Zero A6M5, P-51 Mustang - alle mit Detail-Geometrie (Fuselage, Flügel, Propeller, Cockpit, Markierungen)
- **Flugphysik-Engine** - Echtzeit-Aerodynamik mit Anstellwinkel, Widerstand, Auftrieb, G-Kräften
- **KI-Gegner** - Behavior-Tree-AI mit Patrol → Search → Engage → Retreat Zustandsmaschine
- **Waffensystem** - Maschinengewehr-Salven mit Ballistik, Treffererkennung, Hit-Scanning
- **Partikeleffekte** - Explosionen, Rauchwolken, Funken, Contrails, Trümmer
- **Dynamisches Terrain** - Simplex-Noise-Landschaft mit Hügeln, Wasser, Felswänden, Schnee-Gipfeln
- **Volumetrischer Himmel** - Shader-basierter Gradient-Sky mit Wolken-Layer, Sonne, atmosphärischer Dämmerung
- **Prozedurale Audio** - Web Audio API - Motor-Drone (RPM-gesteuert), Geschützknall, Explosionen, Metall-Crunch
- **3 Kameramodi** - Chase-Cam, Cockpit-Sicht, Cinematic-Orbit
- **Vollständiges HUD** - Kompass, Speed, Höhe, Vertikal-Speed, G-Kraft, Health-Bar, Target-Info, Minimap

## 🎮 Steuerung

| Taste | Aktion |
|-------|--------|
| **W / S** | Pitch (Nase hoch/runter) |
| **A / D** | Roll (Link/rechts) |
| **Q / E** | Yaw (Schwanz links/rechts) |
| **Shift** | Volle Leistung |
| **Ctrl** | Leerlauf |
| **Space / LMB** | Feuer! |
| **C** | Kamera-Modus wechseln |
| **R** | Neustart |

## 🎯 Spielprinzip

Du bist Pilot eines Spitfire Mk.V und startest mit 3 Verbündeten (Spitfire + Mustang) gegen 8 Gegner (Zero + Axis-Spitfires). Die KI-Gegner patrouillieren, erkennen dich, engagieren im Dogfight und respawnen nach 15 Sekunden.

- **Abstand halten** bis unter 300m für effektives Feuer
- **Energie-Management**: Höhe = potentielle Energie, Speed = kinetische Energie
- **Hinter den Gegner kommen** für Treffer -正面-Angriff wird abgewehrt
- **G-Kräfte beachten** - zu harte Manöver lassen dich Sturzflug machen

## 🖥️ Technik

- **Three.js r128** für 3D-Rendering
- **12 modulare JS-Dateien** (~8.500 Zeilen)
- **Nginx Alpine** als statischer Web-Server
- **0 externe Assets** - alles prozedural generiert
- **Single Page Application** - kein Build, kein Framework, kein Build-Step
