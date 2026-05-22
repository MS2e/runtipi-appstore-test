# ⏱️ Markdown TimeTracker

Eine elegante, serverlose Zeiterfassungs-Anwendung, die komplett lokal im Browser läuft und Daten im Markdown-Format verarbeitet.

## Features

### ⏱️ Zeiterfassung
- **Live-Timer** mit Start/Stopp-Mechanismus und visueller Statusanzeige (Indigo = Bereit, Rot = Läuft)
- **Echtzeit-Anzeige** – laufende Zeit wird sekundengenau (HH:MM:SS) dargestellt
- **Manuelles Nachtragen** – vergessene Einträge inkl. Datum, Start-/Endzeit und Beschreibung per Modal hinzufügen

### 📅 Verlauf & Datenmanagement
- **Hierarchische Baumansicht** – Einträge gruppiert nach Jahr → Monat → Woche (KW) → Tag
- **Aggregation** – automatische Berechnung der Arbeitsstunden auf jeder Ebene
- **Tages-Zusammenfassung** – Frühester Start bis spätestes Ende
- **Clipboard-Funktion** – Klick auf Start-/Endzeiten kopiert sie in die Zwischenablage
- **Inline-Bearbeitung** – Einträge direkt in der Liste editieren (Beschreibung & Zeiten)

### 📊 Statistik & Visualisierung
- **Wochenübersicht** – interaktives Balkendiagramm zur Visualisierung der Arbeitslast
- **Kontext-Sensitiv** – Klick auf einen Eintrag im Verlauf zeigt die Statistik für die entsprechende Woche
- **Dark Mode** – durchgängiges, augenschonendes "Slate"-Design

### 💾 Import & Export
- **Markdown Export** – generiert eine `.md` Datei mit allen Einträgen, formatiert als Liste
- **Intelligenter Import** – exportierte Markdown-Dateien wieder einlesen und App-Status wiederherstellen
- **Persistenz** – automatische Speicherung im Browser-Cache (LocalStorage)

## Technik

- React 18 mit TypeScript
- Tailwind CSS für Styling
- Recharts für Diagramme
- Date-fns für Datumsmanipulation
- Nginx Alpine Container als Webserver

## Datenschutz

> Die Daten gehören Ihnen. Alle Daten verbleiben lokal im Browser oder auf Ihrem Dateisystem (bei Export). Kein Backend, keine Cloud, keine externen Abhängigkeiten.

---

*Speichern Sie regelmäßig Backups über die "Export MD" Funktion.*
