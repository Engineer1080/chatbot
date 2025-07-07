document.addEventListener('DOMContentLoaded', () => {
    //  DOM Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = sidebar.querySelector('.sidebar-content');
    const toggleSidebarButton = document.getElementById('toggleSidebarButton');
    const toggleSidebarIcon = document.getElementById('toggleSidebarIcon');
    const mainChatArea = document.getElementById('mainChatArea');
    const chatMessagesDisplay = document.getElementById('messagesDisplay');
    const userInputTextarea = document.getElementById('userInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const clearChatButton = document.getElementById('clearChatButton');
    const goToHomeButton = document.getElementById('goToHomeButton');

    // State Variables
    let messages = []; // Stores chat messages
    let isSidebarOpen = true; 

    //  Utility Functions

    // Function to scroll to the bottom of messages display
    const scrollToBottom = () => {
        const lastMessage = chatMessagesDisplay.lastElementChild;
        if (lastMessage && lastMessage.classList.contains('chat-message-bubble')) {
            setTimeout(() => {
                lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        } else if (messages.length === 0) {
        } else {
            setTimeout(() => {
                chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
            }, 100);
        }
    };


    // Function to update the UI based on sidebar state
    const updateSidebarUI = () => {
        if (isSidebarOpen) {
            sidebar.classList.remove('is-closed');
            sidebar.classList.add('is-open');
            sidebarContent.classList.remove('opacity-0', 'pointer-events-none');
            mainChatArea.classList.remove('no-sidebar-offset');
            mainChatArea.classList.add('sidebar-offset');
            toggleSidebarButton.classList.remove('button-pos-closed');
            toggleSidebarButton.classList.add('button-pos-open');
            toggleSidebarIcon.classList.remove('fa-bars');
            toggleSidebarIcon.classList.add('fa-arrow-left');
        } else {
            sidebar.classList.remove('is-open');
            sidebar.classList.add('is-closed');
            sidebarContent.classList.add('opacity-0', 'pointer-events-none');
            mainChatArea.classList.remove('sidebar-offset');
            mainChatArea.classList.add('no-sidebar-offset');
            toggleSidebarButton.classList.remove('button-pos-open');
            toggleSidebarButton.classList.add('button-pos-closed');
            toggleSidebarIcon.classList.remove('fa-arrow-left');
            toggleSidebarIcon.classList.add('fa-bars');
        }
    };

    // Function to render messages to the DOM
    const renderMessages = () => {
        chatMessagesDisplay.innerHTML = ''; // Clear current messages

        // Display initial message if no messages
        if (messages.length === 0) {
            const initialMessageDiv = document.createElement('div');
            initialMessageDiv.className = 'chat-initial-message';
            initialMessageDiv.innerHTML = `
                <i class="fas fa-robot robot-icon"></i>
                <h3 class="initial-message-title">Start a conversation</h3>
                <p class="initial-message-text">Ask me questions about job offers, careers, and more. I'm here to help you!</p>
            `;
            chatMessagesDisplay.appendChild(initialMessageDiv);
        }

        messages.forEach(msg => {
            const messageBubble = document.createElement('div');
            messageBubble.className = `chat-message-bubble ${msg.sender}-message`;

            let senderLabel = '';
            if (msg.sender === 'ai') {
                senderLabel = `<span class="message-sender-label ai"><i class="fas fa-robot"></i> Easy-Job:</span>`;
            } else if (msg.sender === 'user') {
                senderLabel = `<span class="message-sender-label user">You:</span>`;
            }

            messageBubble.innerHTML = `
                ${senderLabel} ${msg.text}
            `;
            chatMessagesDisplay.appendChild(messageBubble);
        });
        // Scroll to bottom immediately after rendering messages
        scrollToBottom();
    };

    // Event Handlers 

    const handleSendMessage = (event) => {
        event.preventDefault(); // Prevent form submission and page reload
        const text = userInputTextarea.value.trim();
        if (text === '') return; // Do nothing if input is empty

        // Add user message
        messages.push({ text: text, sender: 'user' });
        renderMessages(); // Rerender to show new message

        userInputTextarea.value = '';
        userInputTextarea.style.height = 'auto';
        userInputTextarea.style.height = userInputTextarea.scrollHeight + 'px';

        // Simulate AI response after a short delay
        setTimeout(() => {
            messages.push({ text: "Hello! How can I help you today regarding job offers?", sender: 'ai' });
            renderMessages(); 
            scrollToBottom();
        }, 1000);
    };

    const handleClearChat = () => {
        messages = [];
        renderMessages(); // Update the UI to show the initial message
        userInputTextarea.value = '';
        userInputTextarea.style.height = 'auto';

        if (window.innerWidth < 767) {
            isSidebarOpen = false;
            updateSidebarUI();
        }
    };

    const handleToggleSidebar = () => {
        isSidebarOpen = !isSidebarOpen; 
        updateSidebarUI(); // Update the UI
    };

    const handleGoToHome = () => {
        window.location.href = '/'; // Navigate to the root URL
    };

    // Event Listeners
    sendMessageButton.addEventListener('click', handleSendMessage);
    userInputTextarea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            handleSendMessage(event);
        }
    });

    userInputTextarea.addEventListener('input', () => {
        userInputTextarea.style.height = 'auto';
        userInputTextarea.style.height = userInputTextarea.scrollHeight + 'px';
    });


    clearChatButton.addEventListener('click', handleClearChat);
    toggleSidebarButton.addEventListener('click', handleToggleSidebar);
    goToHomeButton.addEventListener('click', handleGoToHome);

    // Initial Setup
    if (window.innerWidth < 767) {
        isSidebarOpen = false;
    } else {
        isSidebarOpen = true;
    }
    updateSidebarUI();
    renderMessages();
});