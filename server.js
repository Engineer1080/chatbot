const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import multilingual knowledge bases
const multilingualCareerKnowledge = require('./knowledge/multilingual-career-knowledge.json');
const multilingualFallbackResponses = require('./knowledge/multilingual-fallback-responses.json');

class MultilingualCareerChatBot {
    constructor() {
        this.name = 'easy-job.ai Career Assistant';
        this.conversationHistory = new Map(); // Store conversation per socket
        this.fallbackCount = new Map(); // Track failed attempts per socket
        this.userLanguage = new Map(); // Track user's preferred language per socket
        this.supportedLanguages = ['de', 'en'];
        this.defaultLanguage = 'de';
    }

    // Main method to process user messages
    processMessage(socketId, message) {
        const userMessage = message.toLowerCase().trim();
        
        // Initialize conversation data for new users
        if (!this.conversationHistory.has(socketId)) {
            this.conversationHistory.set(socketId, []);
            this.fallbackCount.set(socketId, 0);
            this.userLanguage.set(socketId, this.defaultLanguage);
        }

        // Detect and set user language
        const detectedLanguage = this.detectLanguage(userMessage);
        if (detectedLanguage) {
            this.userLanguage.set(socketId, detectedLanguage);
            console.log(`Language detected for ${socketId}: ${detectedLanguage}`);
        }

        // Add user message to history
        this.conversationHistory.get(socketId).push({
            sender: 'user',
            message: userMessage,
            language: this.userLanguage.get(socketId),
            timestamp: new Date()
        });

        // Find intent and generate response
        const response = this.findResponse(socketId, userMessage);
        
        // Add bot response to history
        this.conversationHistory.get(socketId).push({
            sender: 'bot',
            message: response,
            language: this.userLanguage.get(socketId),
            timestamp: new Date()
        });

        return response;
    }

    // Detect user language based on message content
    detectLanguage(userMessage) {
        const englishIndicators = [
            'hello', 'hi', 'job', 'career', 'application', 'resume', 'interview', 
            'salary', 'work', 'position', 'help', 'please', 'thank', 'english'
        ];
        
        const germanIndicators = [
            'hallo', 'bewerbung', 'lebenslauf', 'gehalt', 'karriere', 'arbeit', 
            'stelle', 'vorstellungsgespräch', 'danke', 'bitte', 'deutsch', 'hilfe'
        ];

        let englishScore = 0;
        let germanScore = 0;

        const words = userMessage.split(/\s+/);
        
        words.forEach(word => {
            if (englishIndicators.some(indicator => word.includes(indicator))) {
                englishScore++;
            }
            if (germanIndicators.some(indicator => word.includes(indicator))) {
                germanScore++;
            }
        });

        // Return detected language or null if unclear
        if (englishScore > germanScore && englishScore > 0) {
            return 'en';
        } else if (germanScore > englishScore && germanScore > 0) {
            return 'de';
        }
        
        return null; // Keep current language if detection is unclear
    }

    // Find appropriate response based on multilingual keyword matching
    findResponse(socketId, userMessage) {
        console.log(`\\n=== MULTILINGUAL DEBUG findResponse ===`);
        console.log(`User Message: "${userMessage}"`);
        console.log(`Current Language: ${this.userLanguage.get(socketId)}`);
        
        let bestMatch = null;
        let highestScore = 0;
        const currentLang = this.userLanguage.get(socketId);

        // Search through multilingual career knowledge base
        for (const item of multilingualCareerKnowledge.intents) {
            const score = this.calculateMultilingualMatchScore(userMessage, item.keywords, currentLang);
            
            console.log(`Intent: ${item.intent}, Score: ${score}`);
            
            if (score > highestScore && score > 0.2) { // Lowered threshold for multilingual
                highestScore = score;
                bestMatch = item;
                console.log(`✓ New best match: ${item.intent} (score: ${score})`);
            }
        }

        console.log(`Best match: ${bestMatch ? bestMatch.intent : 'none'}`);
        console.log(`Highest score: ${highestScore}`);

        if (bestMatch) {
            // Reset fallback counter on successful match
            this.fallbackCount.set(socketId, 0);
            
            // Return random response in user's language
            const responses = bestMatch.responses[currentLang] || bestMatch.responses[this.defaultLanguage];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            // Add follow-up questions if available
            if (bestMatch.followUp && bestMatch.followUp[currentLang]) {
                const followUps = bestMatch.followUp[currentLang];
                const followUp = followUps[Math.floor(Math.random() * followUps.length)];
                const finalResponse = `${randomResponse}\\n\\n${followUp}`;
                console.log(`Final response: "${finalResponse}"`);
                console.log(`=== END MULTILINGUAL DEBUG ===\\n`);
                return finalResponse;
            }
            
            console.log(`Response: "${randomResponse}"`);
            console.log(`=== END MULTILINGUAL DEBUG ===\\n`);
            return randomResponse;
        } else {
            console.log(`✗ No match found, using fallback`);
            console.log(`=== END MULTILINGUAL DEBUG ===\\n`);
            return this.handleMultilingualFallback(socketId, userMessage);
        }
    }

    // Calculate match score for multilingual keywords
    calculateMultilingualMatchScore(userMessage, keywordsByLanguage, currentLang) {
        console.log(`  → Calculating multilingual score for: "${userMessage}"`);
        
        const messageWords = userMessage.split(/\\s+/);
        let totalWeight = 0;
        let matches = [];

        // First try current language keywords
        if (keywordsByLanguage[currentLang]) {
            totalWeight += this.calculateKeywordScore(messageWords, keywordsByLanguage[currentLang], matches, currentLang);
        }

        // Also check other languages (but with lower weight)
        this.supportedLanguages.forEach(lang => {
            if (lang !== currentLang && keywordsByLanguage[lang]) {
                const otherLangScore = this.calculateKeywordScore(messageWords, keywordsByLanguage[lang], matches, lang);
                totalWeight += otherLangScore * 0.7; // Lower weight for other languages
            }
        });

        const score = messageWords.length > 0 ? (totalWeight / messageWords.length) : 0;
        
        console.log(`  → Matches: ${matches.length > 0 ? matches.join(', ') : 'none'}`);
        console.log(`  → Final multilingual score: ${score}`);
        
        return score;
    }

    // Helper method to calculate keyword score for specific language
    calculateKeywordScore(messageWords, keywords, matches, language) {
        let weight = 0;
        
        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            for (const word of messageWords) {
                const wordLower = word.toLowerCase();
                if (wordLower.includes(keywordLower) || keywordLower.includes(wordLower)) {
                    const keywordWeight = keyword.length > 3 ? 2 : 1;
                    weight += keywordWeight;
                    matches.push(`"${word}" matches "${keyword}" (${language})`);
                }
            }
        }
        
        return weight;
    }

    // Handle multilingual fallbacks
    handleMultilingualFallback(socketId, userMessage) {
        const currentFallbackCount = this.fallbackCount.get(socketId) || 0;
        this.fallbackCount.set(socketId, currentFallbackCount + 1);
        const currentLang = this.userLanguage.get(socketId);

        if (currentFallbackCount >= 2) {
            // Hard fallback - restart conversation
            this.fallbackCount.set(socketId, 0);
            const hardFallbacks = multilingualFallbackResponses.hardFallback[currentLang] || 
                                 multilingualFallbackResponses.hardFallback[this.defaultLanguage];
            return this.getRandomResponse(hardFallbacks);
        } else {
            // Soft fallback - ask for clarification
            const softFallbacks = multilingualFallbackResponses.softFallback[currentLang] || 
                                 multilingualFallbackResponses.softFallback[this.defaultLanguage];
            return this.getRandomResponse(softFallbacks);
        }
    }

    // Get random response from array
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Get conversation history for a socket
    getConversationHistory(socketId) {
        return this.conversationHistory.get(socketId) || [];
    }

    // Clear conversation history for a socket
    clearConversationHistory(socketId) {
        this.conversationHistory.delete(socketId);
        this.fallbackCount.delete(socketId);
        this.userLanguage.set(socketId, this.defaultLanguage); // Reset to default language
    }

    // Get multilingual greeting message
    getGreeting(language = null) {
        const lang = language || this.defaultLanguage;
        
        const greetings = {
            'de': [
                "Hallo! Ich bin der Easy-Job Assistant. Wie kann ich Ihnen bei Ihrer Karriere helfen?",
                "Willkommen! Ich helfe Ihnen gerne bei Fragen rund um Bewerbungen und Karriere.",
                "Hi! Ich bin hier, um Sie bei Ihrer Jobsuche und Karriereplanung zu unterstützen. Was beschäftigt Sie?"
            ],
            'en': [
                "Hello! I'm the Easy-Job Assistant. How can I help you with your career?",
                "Welcome! I'm happy to help you with questions about applications and career development.",
                "Hi! I'm here to support you with your job search and career planning. What's on your mind?"
            ]
        };
        
        const langGreetings = greetings[lang] || greetings[this.defaultLanguage];
        return this.getRandomResponse(langGreetings);
    }

    // Get user's current language
    getUserLanguage(socketId) {
        return this.userLanguage.get(socketId) || this.defaultLanguage;
    }

    // Set user's language manually
    setUserLanguage(socketId, language) {
        if (this.supportedLanguages.includes(language)) {
            this.userLanguage.set(socketId, language);
            console.log(`Language manually set for ${socketId}: ${language}`);
            return true;
        }
        return false;
    }

    // Get language statistics
    getLanguageStats() {
        const stats = {};
        this.supportedLanguages.forEach(lang => stats[lang] = 0);
        
        for (const [socketId, language] of this.userLanguage) {
            if (stats[language] !== undefined) {
                stats[language]++;
            }
        }
        
        return stats;
    }
}

// Express App Setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Initialize Multilingual Bot
const chatBot = new MultilingualCareerChatBot();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        bot: chatBot.name,
        supportedLanguages: chatBot.supportedLanguages,
        languageStats: chatBot.getLanguageStats(),
        timestamp: new Date().toISOString()
    });
});

// API endpoint to get conversation history
app.get('/api/conversation/:socketId', (req, res) => {
    const history = chatBot.getConversationHistory(req.params.socketId);
    const userLang = chatBot.getUserLanguage(req.params.socketId);
    res.json({ 
        history, 
        language: userLang,
        supportedLanguages: chatBot.supportedLanguages 
    });
});

// API endpoint to set language
app.post('/api/language/:socketId', (req, res) => {
    const { language } = req.body;
    const success = chatBot.setUserLanguage(req.params.socketId, language);
    
    if (success) {
        res.json({ 
            success: true, 
            language: language,
            message: language === 'de' ? 'Sprache auf Deutsch gesetzt' : 'Language set to English'
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Unsupported language',
            supportedLanguages: chatBot.supportedLanguages 
        });
    }
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send multilingual greeting message
    socket.emit('bot-message', {
        type: 'message',
        sender: 'bot',
        message: chatBot.getGreeting(),
        language: chatBot.getUserLanguage(socket.id),
        timestamp: new Date().toISOString()
    });

    // Handle incoming messages
    socket.on('user-message', (data) => {
        try {
            console.log(`Message from ${socket.id}: ${data.message}`);
            
            // Process message through multilingual bot
            const botResponse = chatBot.processMessage(socket.id, data.message);
            const userLang = chatBot.getUserLanguage(socket.id);
            
            // Send response back to user
            socket.emit('bot-message', {
                type: 'message',
                sender: 'bot',
                message: botResponse,
                language: userLang,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error processing message:', error);
            const userLang = chatBot.getUserLanguage(socket.id);
            const errorMessage = userLang === 'en' ? 
                'Sorry, an error occurred. Please try again.' :
                'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
                
            socket.emit('bot-message', {
                type: 'error',
                sender: 'bot',
                message: errorMessage,
                language: userLang,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle language switch request
    socket.on('switch-language', (data) => {
        const { language } = data;
        const success = chatBot.setUserLanguage(socket.id, language);
        
        if (success) {
            const confirmMessage = language === 'en' ? 
                'Language switched to English. How can I help you with your career?' :
                'Sprache auf Deutsch umgestellt. Wie kann ich Ihnen bei Ihrer Karriere helfen?';
                
            socket.emit('bot-message', {
                type: 'language-switch',
                sender: 'bot',
                message: confirmMessage,
                language: language,
                timestamp: new Date().toISOString()
            });
        } else {
            socket.emit('language-switch-error', {
                error: 'Unsupported language',
                supportedLanguages: chatBot.supportedLanguages
            });
        }
    });

    // Handle clear chat request
    socket.on('clear-chat', () => {
        chatBot.clearConversationHistory(socket.id);
        const userLang = chatBot.getUserLanguage(socket.id);
        const clearMessage = userLang === 'en' ? 'Chat cleared.' : 'Chat wurde geleert.';
        
        socket.emit('chat-cleared', {
            message: clearMessage,
            language: userLang
        });
        
        // Send new greeting
        setTimeout(() => {
            socket.emit('bot-message', {
                type: 'message',
                sender: 'bot',
                message: chatBot.getGreeting(userLang),
                language: userLang,
                timestamp: new Date().toISOString()
            });
        }, 500);
    });

    // Handle user joining
    socket.on('user-join', (data) => {
        const userName = data.name || `User-${socket.id.substring(0, 6)}`;
        const userLang = data.language || chatBot.defaultLanguage;
        
        // Set user language if provided
        if (data.language && chatBot.supportedLanguages.includes(data.language)) {
            chatBot.setUserLanguage(socket.id, data.language);
        }
        
        console.log(`${userName} joined the chat (Language: ${userLang})`);
        
        const welcomeMessage = userLang === 'en' ? 
            `Welcome, ${userName}!` : 
            `Willkommen, ${userName}!`;
        
        socket.emit('join-confirmed', {
            message: welcomeMessage,
            socketId: socket.id,
            language: userLang
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Clean up conversation history after some time (optional)
        setTimeout(() => {
            chatBot.clearConversationHistory(socket.id);
        }, 300000); // 5 minutes
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        socket.broadcast.emit('user-typing', {
            socketId: socket.id,
            typing: data.typing,
            language: chatBot.getUserLanguage(socket.id)
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
    console.log(`\n🤖 Easy-Job Multilingual Chatbot Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check available at http://${HOST}:${PORT}/api/health`);
    console.log(`💬 Bot Name: ${chatBot.name}`);
    console.log(`🌐 Supported Languages: ${chatBot.supportedLanguages.join(', ')}`);
    console.log(`🚀 Ready to help with career questions in multiple languages!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, server, chatBot };