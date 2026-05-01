# 🛒 Custom RunTipi App Store

## 📋 Über diesen Store / About This Store

### 🇩🇪 Deutsch

Dies ist ein **privater App Store für RunTipi**, der neu erstellte Apps und Apps enthält, die speziell für die Installation auf RunTipi vorbereitet wurden.

⚠️ **Alle Apps befinden sich im Teststadium** und müssen abschließend validiert werden, bevor sie als stabil gelten. Installiere nur in einer Test- oder Sandbox-Umgebung.

**Was erwartet dich hier:**
- Eigenentwickelte Apps, die für RunTipi verpackt wurden
- Drittanbieter-Apps mit angepasster Konfiguration
- Experimentelle Anwendungen und Prototypen

### 🇬🇧 English

This is a **custom app store for RunTipi** containing newly created apps and apps prepared for installation on RunTipi.

⚠️ **All apps are in a testing phase** and require final validation before being considered stable. Install only in a test or sandbox environment.

**What you'll find here:**
- Self-developed apps packaged for RunTipi
- Third-party apps with custom configuration
- Experimental applications and prototypes

---

## 📦 Aktuelle Apps / Current Apps

| App | Status | 🇩🇪 Beschreibung | 🇬🇧 Description |
|-----|--------|-------------------|-----------------|
| [hermes-agent](apps/hermes-agent/) | 🧪 Test | Autonome AI-Agent-Plattform mit Gateway für Telegram/Discord, lokaler LLM-Unterstützung und persistentem Gedächtnis. | Autonomous AI agent platform with Telegram/Discord gateway, local LLM support, and persistent memory system. |
| [sonnensystem](apps/sonnensystem/) | 🧪 Test | Interaktive 3D-Simulation unseres Sonnensystems mit allen Planeten, Monden, Asteroidengürtel und prozeduralen Texturen. | Interactive 3D simulation of our solar system featuring all planets, moons, asteroid belt, and procedural textures. |
| [whoami](apps/whoami/) | ✅ Vorlage | Traefik Whoami — Minimaler Go-Webserver zur Verifikation von Reverse Proxies und Netzwerk-Konfiguration. | Traefik Whoami — Minimal Go webserver for verifying reverse proxy and network configuration. |

### Status-Symbole / Status Legend
| Symbol | Bedeutung / Meaning |
|--------|---------------------|
| 🧪 | **Test** — App wird noch validiert / App is being validated |
| ✅ | **Stabil** — App hat Tests bestanden / App has passed testing |
| 🚧 | **WIP** — App befindet sich in Entwicklung / App is in development |

---

## 🚀 Installation des Stores auf RunTipi

### 🇩🇪 Anleitung

Füge diesen Store zu deiner RunTipi-Instanz hinzu:

1. Öffne das RunTipi Dashboard
2. Navigiere zu **Settings** → **App Store**
3. Füge eine neue App Store URL hinzu:
   ```
   https://github.com/MS2e/runtipi-appstore-test
   ```
4. Wende die Änderungen an und starte RunTipi neu

Die Apps erscheinen dann im **Custom Store** Tab der App-Liste.

### 🇬🇧 Instructions

Add this store to your RunTipi instance:

1. Open the RunTipi dashboard
2. Navigate to **Settings** → **App Store**
3. Add a new App Store URL:
   ```
   https://github.com/MS2e/runtipi-appstore-test
   ```
4. Apply changes and restart RunTipi

The apps will then appear in the **Custom Store** tab of the app list.

---

## 📁 Repository-Struktur / Repository Structure

```
├── apps/                    # App-Verzeichnisse
│   ├── hermes-agent/        # Hermes Agent App
│   │   ├── config.json      #   App-Konfiguration
│   │   ├── docker-compose.json  # Docker-Setup
│   │   └── metadata/        #   Metadaten (Logo, Beschreibung)
│   ├── sonnensystem/        # Sonnensystem 3D App
│   └── whoami/              # Whoami (Vorlage/Beispiel)
├── .github/workflows/       # CI/CD Pipeline
├── __tests__/               # Test-Suite
├── scripts/                 # Hilfs-Skripte
└── README.md                # Diese Datei
```

---

## 🧪 Testing & Qualitätssicherung / Testing & QA

### 🇩🇪

Bevor eine App als **stabil** markiert wird, sollte folgende Checklist abgearbeitet werden:

- [ ] App-Installation über RunTipi funktioniert
- [ ] Docker-Container startet ohne Fehler
- [ ] Alle definierten Ports sind erreichbar
- [ ] Konfigurationsfelder (form_fields) werden korrekt verarbeitet
- [ ] Umgebungsvariablen werden durchgereicht
- [ ] Volume-Mounts funktionieren korrekt
- [ ] App lässt sich sauber deinstallieren
- [ ] Update-Pfad funktioniert (falls zutreffend)

### 🇬🇧

Before an app is marked as **stable**, the following checklist should be completed:

- [ ] App installation via RunTipi works
- [ ] Docker container starts without errors
- [ ] All defined ports are accessible
- [ ] Configuration fields (form_fields) are processed correctly
- [ ] Environment variables are properly passed through
- [ ] Volume mounts work correctly
- [ ] App can be cleanly uninstalled
- [ ] Update path works (if applicable)

---

## ⚙️ Neue Apps hinzufügen / Adding New Apps

### 🇩🇪

1. Erstelle einen neuen Ordner in `apps/<app-name>/`
2. Kopiere die Struktur von `apps/whoami/` als Vorlage
3. Passe `config.json` an (Name, Port, Beschreibung, Konfigurationsfelder)
4. Erstelle `docker-compose.json` mit deinem Docker-Setup
5. Füge Logo (`logo.jpg`) und Beschreibung (`description.md`) in `metadata/` hinzu
6. Teste die Installation auf einer RunTipi-Instanz
7. Commit und push die Änderungen

### 🇬🇧

1. Create a new folder in `apps/<app-name>/`
2. Copy the structure from `apps/whoami/` as a template
3. Adapt `config.json` (name, port, description, config fields)
4. Create `docker-compose.json` with your Docker setup
5. Add logo (`logo.jpg`) and description (`description.md`) in `metadata/`
6. Test the installation on a RunTipi instance
7. Commit and push the changes

---

## 📖 Weitere Dokumentation / Further Documentation

- [RunTipi: Create Your Own App Store Guide](https://runtipi.io/docs/guides/create-your-own-app-store)
- [RunTipi Documentation](https://runtipi.io/docs/)

---

## ⚠️ Disclaimer

### 🇩🇪
Diese Apps werden **ohne Garantie** bereitgestellt. Der Autor übernimmt keine Verantwortung für Datenverlust, Systeminstabilität oder andere Schäden durch die Installation oder Nutzung dieser Apps.

### 🇬🇧
These apps are provided **as-is, without warranty**. The author is not responsible for data loss, system instability, or any other damage resulting from the installation or use of these apps.
