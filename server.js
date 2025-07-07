const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import knowledge bases
const careerKnowledge = require('./knowledge/career-knowledge.json');
const fallbackResponses = require('./knowledge/fallback-responses.json');

class CareerChatBot {
    constructor() {
        this.name = 'Easy-Job Assistant';
        this.conversationHistory = new Map(); // Store conversation per socket
        this.fallbackCount = new Map(); // Track failed attempts per socket
    }

    // Main method to process user messages
    processMessage(socketId, message) {
        const userMessage = message.toLowerCase().trim();
        
        // Initialize conversation history for new users
        if (!this.conversationHistory.has(socketId)) {
            this.conversationHistory.set(socketId, []);
            this.fallbackCount.set(socketId, 0);
        }

        // Add user message to history
        this.conversationHistory.get(socketId).push({
            sender: 'user',
            message: userMessage,
            timestamp: new Date()
        });

        // Find intent and generate response
        const response = this.findResponse(socketId, userMessage);
        
        // Add bot response to history
        this.conversationHistory.get(socketId).push({
            sender: 'bot',
            message: response,
            timestamp: new Date()
        });

        return response;
    }

    // Find appropriate response based on keyword matching
    findResponse(socketId, userMessage) {
        let bestMatch = null;
        let highestScore = 0;

        // Search through career knowledge base
        for (const item of careerKnowledge.intents) {
            const score = this.calculateMatchScore(userMessage, item.keywords);
            if (score > highestScore && score > 0.3) { // Minimum threshold
                highestScore = score;
                bestMatch = item;
            }
        }

        if (bestMatch) {
            // Reset fallback counter on successful match
            this.fallbackCount.set(socketId, 0);
            
            // Return random response from matched intent
            const responses = bestMatch.responses;
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            // Add follow-up questions if available
            if (bestMatch.followUp && bestMatch.followUp.length > 0) {
                const followUp = bestMatch.followUp[Math.floor(Math.random() * bestMatch.followUp.length)];
                return `${randomResponse}\n\n${followUp}`;
            }
            
            return randomResponse;
        } else {
            return this.handleFallback(socketId, userMessage);
        }
    }

    // Calculate match score between user message and keywords
    calculateMatchScore(userMessage, keywords) {
        const messageWords = userMessage.split(/\s+/);
        let matchCount = 0;
        let totalWeight = 0;

        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            for (const word of messageWords) {
                if (word.includes(keywordLower) || keywordLower.includes(word)) {
                    matchCount++;
                    totalWeight += keyword.length > 3 ? 2 : 1; // Longer keywords get more weight
                }
            }
        }

        return messageWords.length > 0 ? (totalWeight / messageWords.length) : 0;
    }

    // Handle cases when no intent is matched
    handleFallback(socketId, userMessage) {
        const currentFallbackCount = this.fallbackCount.get(socketId) || 0;
        this.fallbackCount.set(socketId, currentFallbackCount + 1);

        if (currentFallbackCount >= 2) {
            // Hard fallback - restart conversation
            this.fallbackCount.set(socketId, 0);
            return this.getRandomResponse(fallbackResponses.hardFallback);
        } else {
            // Soft fallback - ask for clarification
            return this.getRandomResponse(fallbackResponses.softFallback);
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
    }

    // Get greeting message
    getGreeting() {
        const greetings = [
            "Hallo! Ich bin der Easy-Job Assistant. Wie kann ich Ihnen bei Ihrer Karriere helfen?",
            "Willkommen! Ich helfe Ihnen gerne bei Fragen rund um Bewerbungen und Karriere.",
            "Hi! Ich bin hier, um Sie bei Ihrer Jobsuche und Karriereplanung zu unterstützen. Was beschäftigt Sie?"
        ];
        return this.getRandomResponse(greetings);
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

// Initialize Bot
const chatBot = new CareerChatBot();

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
        timestamp: new Date().toISOString()
    });
});

// API endpoint to get conversation history
app.get('/api/conversation/:socketId', (req, res) => {
    const history = chatBot.getConversationHistory(req.params.socketId);
    res.json({ history });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send greeting message
    socket.emit('bot-message', {
        type: 'message',
        sender: 'bot',
        message: chatBot.getGreeting(),
        timestamp: new Date().toISOString()
    });

    // Handle incoming messages
    socket.on('user-message', (data) => {
        try {
            console.log(`Message from ${socket.id}: ${data.message}`);
            
            // Process message through bot
            const botResponse = chatBot.processMessage(socket.id, data.message);
            
            // Send response back to user
            socket.emit('bot-message', {
                type: 'message',
                sender: 'bot',
                message: botResponse,
                timestamp: new Date().toISOString()
            });

            // Optional: Broadcast to all clients (for multi-user chat)
            // socket.broadcast.emit('user-message', {
            //     type: 'message',
            //     sender: 'user',
            //     message: data.message,
            //     socketId: socket.id,
            //     timestamp: new Date().toISOString()
            // });

        } catch (error) {
            console.error('Error processing message:', error);
            socket.emit('bot-message', {
                type: 'error',
                sender: 'bot',
                message: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle clear chat request
    socket.on('clear-chat', () => {
        chatBot.clearConversationHistory(socket.id);
        socket.emit('chat-cleared', {
            message: 'Chat wurde geleert.'
        });
        
        // Send new greeting
        setTimeout(() => {
            socket.emit('bot-message', {
                type: 'message',
                sender: 'bot',
                message: chatBot.getGreeting(),
                timestamp: new Date().toISOString()
            });
        }, 500);
    });

    // Handle user joining
    socket.on('user-join', (data) => {
        const userName = data.name || `User-${socket.id.substring(0, 6)}`;
        console.log(`${userName} joined the chat`);
        
        socket.emit('join-confirmed', {
            message: `Willkommen, ${userName}!`,
            socketId: socket.id
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
            typing: data.typing
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
    console.log(`\n🤖 Easy-Job Chatbot Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check available at http://${HOST}:${PORT}/api/health`);
    console.log(`💬 Bot Name: ${chatBot.name}`);
    console.log(`🚀 Ready to help with career questions!\n`);
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