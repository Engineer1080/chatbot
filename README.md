# EasyJobAI Multilingual Career Chatbot

Ein intelligenter mehrsprachiger Karriere-Chatbot für die Easy-Job.ai Plattform mit WebSocket-basierter Echtzeitkommunikation.

## Features

- **Multilinguale Unterstützung**: Vollständig zweisprachig (Deutsch/Englisch) mit automatischer Spracherkennung
- **Karriere-spezialisiert**: Umfassende Wissensbasis zu Bewerbung, Lebenslauf, Vorstellungsgesprächen, Gehalt und Karriereplanung
- **WebSocket-Kommunikation**: Echtzeitchat über Socket.IO mit niedrigen Latenzen
- **Conversation Memory**: Individuelle Gesprächsverläufe und Sprachpräferenzen pro Nutzer
- **Rate Limiting**: Integrierte Sicherheitsfeatures mit konfigurierbaren Limits für WebSocket und HTTP
- **Intelligente Fallbacks**: Mehrschichtige Fallback-Strategien bei Verständnisproblemen
- **Keyword-Spotting**: Erweiterte mehrsprachige Absichtserkennung
- **Easy-Job.ai Integration**: Nahtlose Integration der Easy-Job.ai Plattform-Features
- **RESTful API**: Umfassende HTTP-Endpunkte für Statusabfragen und Verwaltung
- **Responsive Design**: Optimiert für Desktop und mobile Geräte mit Theme-Switching

## Projektstruktur

```
chatbot/
├── server.js                           # Hauptserver mit Express und Socket.IO
├── package.json                        # Dependencies und Scripts
├── knowledge/                          # Mehrsprachige Wissensbasis
│   ├── multilingual-career-knowledge.json    # Karriere-Intents (DE/EN)
│   └── multilingual-fallback-responses.json  # Fallback-Antworten (DE/EN)
├── public/                             # Frontend-Dateien
│   └── chat.html                       # Vollständiges Chat-Interface
└── README.md                          # Projektdokumentation
```

## Installation

### Voraussetzungen
- Node.js (Version 16+)
- npm (Version 8+)

### Setup

1. Repository klonen
```bash
git clone <repository-url>
cd chatbot
```

2. Dependencies installieren
```bash
npm install
```

3. Server starten

**Entwicklungsmodus:**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm start
```

Der Server läuft standardmäßig auf `http://localhost:3000`

## Konfiguration

### Environment Variables
Erstellen Sie eine `.env` Datei für Konfigurationen:

```env
NODE_ENV=development
PORT=3000
HOST=localhost
```

### Wissensbasis erweitern
Die mehrsprachige Wissensbasis kann in `knowledge/multilingual-career-knowledge.json` erweitert werden:

```json
{
  "intent": "neuer_intent",
  "keywords": {
    "de": ["keyword1", "keyword2"],
    "en": ["keyword1", "keyword2"]
  },
  "responses": {
    "de": ["Deutsche Antwort"],
    "en": ["English response"]
  },
  "followUp": {
    "de": ["Deutsche Nachfrage"],
    "en": ["English follow-up"]
  }
}
```

### Rate Limiting konfigurieren
Das Rate-Limiting kann im Server angepasst werden:

```javascript
const rateLimiter = new RateLimiter();
// WebSocket: 30 Nachrichten/min, 5min Block
// HTTP: 100 Requests/min, 3min Block
```

## API Endpunkte

### HTTP Endpoints
- `GET /` - Haupt-Chat-Interface
- `GET /api/health` - Server-Status mit Rate-Limit-Informationen
- `GET /api/rate-limit` - Rate-Limit-Status abfragen
- `GET /api/conversation/:socketId` - Gesprächsverlauf abrufen
- `POST /api/language/:socketId` - Sprache setzen

### WebSocket Events

**Client zu Server:**
```javascript
// Nachricht senden
socket.emit('user-message', {
  message: "Wie schreibe ich eine Bewerbung?"
});

// Sprache wechseln
socket.emit('switch-language', {
  language: "en"
});

// Chat leeren
socket.emit('clear-chat');

// Nutzer beitritt
socket.emit('user-join', {
  name: "Max Mustermann",
  language: "de"
});
```

**Server zu Client:**
```javascript
// Bot-Antwort
socket.on('bot-message', (data) => {
  console.log(data.message, data.language);
});

// Rate-Limit erreicht
socket.on('bot-message', (data) => {
  if (data.type === 'rate-limit') {
    // Rate limit handling
  }
});

// Chat geleert
socket.on('chat-cleared', (data) => {
  console.log(data.message);
});
```

## Unterstützte Themen

Der Chatbot bietet umfassende Unterstützung in folgenden Bereichen:

### Bewerbung
- Bewerbungsschreiben verfassen und strukturieren
- Anschreiben individuell anpassen
- Bewerbungsunterlagen zusammenstellen
- Easy-Job.ai KI-Anschreiben-Generation

### Lebenslauf
- Lebenslauf optimieren und strukturieren
- Berufserfahrung wirkungsvoll darstellen
- Design und Layout verbessern
- Lücken professionell erklären

### Vorstellungsgespräch
- Umfassende Interview-Vorbereitung
- STAR-Methode für Antwortstruktur
- Typische Fragen und optimale Antworten
- Kleidung und professionelles Verhalten

### Gehalt und Vergütung
- Gehaltsverhandlung strategisch führen
- Gehaltsvorstellungen entwickeln und kommunizieren
- Marktübliche Gehälter recherchieren
- Alternative Benefits verhandeln

### Karriereplanung
- Langfristige Karriereziele definieren
- Skill-Gap-Analysen durchführen
- Weiterentwicklungspläne erstellen
- Branchenwechsel und Quereinstieg

### Weitere Fachbereiche
- Strategisches Networking und LinkedIn-Optimierung
- Remote Work und flexible Arbeitsmodelle
- Work-Life-Balance und Zeitmanagement
- Skills-Entwicklung und Weiterbildung

## Mehrsprachigkeit

### Unterstützte Sprachen
- Deutsch (Standard)
- Englisch

### Sprachfeatures
- Automatische Spracherkennung basierend auf Nachrichteninhalt
- Manueller Sprachwechsel über Interface
- Sprachspezifische Antworten und Fallbacks
- Persistente Sprachpräferenzen pro Nutzer

## Testing

### Lokaler Test
```bash
# Server starten
npm start

# Browser öffnen
http://localhost:3000
```

### API Tests
```bash
# Health Check
curl http://localhost:3000/api/health

# Rate Limit Status
curl http://localhost:3000/api/rate-limit
```

## Deployment

### Azure App Service (empfohlen)
```bash
# Azure CLI installieren und anmelden
az login

# App Service erstellen
az webapp up --sku F1 --name easyjobai-chatbot-[unique-id]

# Environment Variables setzen
az webapp config appsettings set \
  --resource-group [resource-group] \
  --name [app-name] \
  --settings NODE_ENV=production
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### PM2 für Produktionsmanagement
```bash
# PM2 installieren
npm install -g pm2

# App mit PM2 starten
pm2 start server.js --name "easyjobai-chatbot"

# Logs anzeigen
pm2 logs easyjobai-chatbot

# Status überprüfen
pm2 status
```

### Monitoring-Metriken
- WebSocket-Verbindungen aktiv
- Rate-Limit-Status pro Client
- Sprachverteilung der Nutzer
- Conversation-Memory-Auslastung

## Sicherheit

### Implementierte Sicherheitsfeatures
- CORS-Konfiguration für Cross-Origin-Requests
- Input-Validierung für alle Nachrichten
- Rate-Limiting für WebSocket und HTTP
- HTTPS über Azure automatisch verfügbar
- Sichere Session-Verwaltung

### Rate-Limiting-Details
- WebSocket: 30 Nachrichten pro Minute, 5-Minuten-Blockierung
- HTTP: 100 Requests pro Minute, 3-Minuten-Blockierung
- Automatische Cleanup alter Einträge
- Individuelle Limits pro Socket-ID/IP-Adresse

## Troubleshooting

### Häufige Probleme

**Port bereits in Verwendung:**
```bash
# Port freigeben
sudo lsof -ti:3000 | xargs kill -9
```

**WebSocket-Verbindung fehlgeschlagen:**
- Firewall-Einstellungen prüfen
- CORS-Konfiguration überprüfen
- Browser-Console auf Errors checken
- Rate-Limits überprüfen

**Wissensbasis wird nicht geladen:**
- JSON-Syntax in Wissensbasis-Dateien validieren
- Dateipfade und Schreibrechte überprüfen
- Server-Logs auf Parsing-Fehler checken

**Mehrsprachigkeit funktioniert nicht:**
- Spracherkennung-Keywords überprüfen
- Fallback-Responses kontrollieren
- Browser-Spracheinstellungen prüfen

## Entwicklung

### Code-Struktur
- `server.js`: Hauptserver mit Express, Socket.IO und Rate-Limiting
- `MultilingualCareerChatBot`: Kernlogik für Spracherkennung und Intent-Matching
- `RateLimiter`: Sicherheitskomponente für Request-Limiting
- Wissensbasis: JSON-basierte mehrsprachige Intent-Definitionen

### Beitrag leisten
1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

### Testing-Guidelines
- Beide Sprachen (DE/EN) testen
- Rate-Limiting-Verhalten validieren
- WebSocket-Reconnection testen
- Mobile Responsiveness prüfen

## License

Dieses Projekt gehört Mario Michael Heinrich und Richelle Audrey Kouedzo.

## Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Projektdokumentation konsultieren
- E-Mail: team@easy-job.ai

---

**Entwickelt für die easy-job.ai Plattform**  
*Technische Hochschule Deggendorf - Studienmodul Internettechnologien*