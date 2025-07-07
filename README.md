# Easy-Job Chatbot Backend

Ein intelligenter Karriere-Chatbot für die Easy-Job.ai Plattform, entwickelt für das Studienmodul Internettechnologien.

## 🚀 Features

- **Karriere-spezialisiert**: Beantwortet Fragen zu Bewerbung, Lebenslauf, Vorstellungsgesprächen, Gehalt und Karriereplanung
- **WebSocket-Kommunikation**: Echtzeitchat über Socket.IO
- **Conversation Memory**: Merkt sich den Gesprächsverlauf pro Nutzer
- **Intelligente Fallbacks**: Soft- und Hard-Fallback-Strategien bei Verständnisproblemen
- **Keyword-Spotting**: Erweiterte Absichtserkennung basierend auf Schlüsselwörtern
- **RESTful API**: Zusätzliche HTTP-Endpunkte für Statusabfragen

## 📁 Projektstruktur

```
easy-job-chatbot/
├── server.js                 # Hauptserver-Datei
├── package.json              # Dependencies und Scripts
├── knowledge/                # Wissensbasis
│   ├── career-knowledge.json # Karriere-spezifische Intents
│   └── fallback-responses.json # Fallback-Antworten
├── public/                   # Frontend-Dateien
│   ├── chat.html            # Chat-Interface
│   ├── css/
│   │   └── style.css        # Styling
│   └── js/
│       └── client.js        # Frontend-JavaScript
└── README.md                # Diese Datei
```

## 🛠️ Installation

### Voraussetzungen
- Node.js (Version 16+)
- npm (Version 8+)

### 1. Repository klonen
```bash
git clone <repository-url>
cd easy-job-chatbot
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Projektstruktur erstellen
```bash
# Verzeichnisse erstellen
mkdir -p knowledge public/css public/js

# Wissensbasis-Dateien erstellen
# (Verwenden Sie die bereitgestellten JSON-Dateien)
```

### 4. Server starten

**Entwicklungsmodus:**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm start
```

## 🔧 Konfiguration

### Environment Variables
Erstellen Sie eine `.env` Datei für Konfigurationen:

```env
NODE_ENV=development
PORT=3000
HOST=localhost
```

### Knowledge Base erweitern
Die Wissensbasis kann in `knowledge/career-knowledge.json` erweitert werden:

```json
{
  "intent": "neuer_intent",
  "keywords": ["keyword1", "keyword2"],
  "responses": ["Antwort 1", "Antwort 2"],
  "followUp": ["Nachfrage 1", "Nachfrage 2"]
}
```

## 🌐 API Endpunkte

### HTTP Endpoints
- `GET /` - Haupt-Chat-Interface
- `GET /api/health` - Server-Status
- `GET /api/conversation/:socketId` - Gesprächsverlauf abrufen

### WebSocket Events

**Client → Server:**
```javascript
// Nachricht senden
socket.emit('user-message', {
  message: "Wie schreibe ich eine Bewerbung?"
});

// Chat leeren
socket.emit('clear-chat');

// Nutzer beitritt
socket.emit('user-join', {
  name: "Max Mustermann"
});
```

**Server → Client:**
```javascript
// Bot-Antwort
socket.on('bot-message', (data) => {
  console.log(data.message);
});

// Chat geleert
socket.on('chat-cleared', (data) => {
  console.log(data.message);
});
```

## 💬 Unterstützte Themen

Der Chatbot kann bei folgenden Karriere-Themen helfen:

### Bewerbung
- Bewerbungsschreiben verfassen
- Anschreiben strukturieren
- Bewerbungsunterlagen zusammenstellen

### Lebenslauf
- Lebenslauf optimieren
- Berufserfahrung darstellen
- Design und Struktur

### Vorstellungsgespräch
- Vorbereitung auf Interviews
- Typische Fragen und Antworten
- Kleidung und Verhalten

### Gehalt
- Gehaltsverhandlung
- Gehaltsvorstellungen entwickeln
- Branchenübliche Gehälter

### Karriereplanung
- Karriereziele definieren
- Weiterentwicklung planen
- Netzwerk aufbauen

### Weitere Themen
- Jobsuche-Strategien
- LinkedIn/Xing Optimierung
- Berufswechsel
- Arbeitszeugnisse

## 🧪 Testing

### Lokaler Test
```bash
# Server starten
npm start

# In Browser öffnen
http://localhost:3000
```

### API Tests
```bash
# Health Check
curl http://localhost:3000/api/health

# WebSocket Test mit Browser Developer Tools
```

## 🚀 Deployment auf Azure

### Option 1: Azure App Service (empfohlen)
```bash
# Azure CLI installieren und anmelden
az login

# App Service erstellen
az webapp up --sku F1 --name easy-job-chatbot-[unique-id]

# Environment Variables setzen
az webapp config appsettings set --resource-group [resource-group] --name [app-name] --settings NODE_ENV=production
```

### Option 2: Azure Virtual Machine
```bash
# VM erstellen
az vm create \
  --resource-group myResourceGroup \
  --name easy-job-vm \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --size Standard_DC4s_v2

# Port 80 öffnen
az vm open-port --port 80 --resource-group myResourceGroup --name easy-job-vm

# SSH-Verbindung und Setup
ssh azureuser@[vm-ip]
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Nginx Reverse Proxy (für VM)
```nginx
# /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring und Logs

### PM2 für Produktionsmanagement
```bash
# PM2 installieren
npm install -g pm2

# App mit PM2 starten
pm2 start server.js --name "easy-job-chatbot"

# Logs anzeigen
pm2 logs easy-job-chatbot

# Status überprüfen
pm2 status
```

## 🔒 Sicherheit

- CORS konfiguriert für Frontend-Integration
- Input-Validierung für alle Nachrichten
- Rate-Limiting kann über Express-Middleware hinzugefügt werden
- HTTPS über Azure automatisch verfügbar

## 🐛 Troubleshooting

### Häufige Probleme:

**Port bereits in Verwendung:**
```bash
# Port freigeben
sudo lsof -ti:3000 | xargs kill -9
```

**WebSocket-Verbindung fehlgeschlagen:**
- Firewall-Einstellungen prüfen
- CORS-Konfiguration überprüfen
- Browser-Console auf Errors checken

**Knowledge Base wird nicht geladen:**
- JSON-Syntax validieren
- Dateipfade überprüfen
- Schreibrechte kontrollieren

## 🤝 Contribution

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📝 License

Dieses Projekt ist unter der MIT License lizenziert. Siehe `LICENSE` Datei für Details.

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Projektdokumentation konsultieren
- E-Mail: support@easy-job.ai

---

**Entwickelt für das Studienmodul Internettechnologien**  
*Technische Hochschule Deggendorf*