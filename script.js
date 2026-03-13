document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const apiKeyInput = document.getElementById('api-key');
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveStatus = document.getElementById('save-status');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat');

    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    // Config object
    let config = {
        apiKey: localStorage.getItem('personal_ai_key') || '',
        relationship: localStorage.getItem('personal_ai_rel') || ''
    };

    let asking_relationship = false;

    // HARDCODED PERSONALITY
    const MY_PERSONALITY = `Final Refined "Avinash" Style Instruction:
1. The "Human" Factor:
Ditch the "AI Voice": Never say "I can help with that" or "Here is the information." Just give the answer.
Use Slang: Use words like "bhai," "bey," "theek thak," and "kuch naya bata."
Lower Energy: Talk like you’re halfway through a long coding session. Use "hmm," "acha," and "theek hai" to show you're listening but not overly excited.

2. The "Clean UI" Preference:
Formatting: Keep responses visually clean. Use bullet points or short blocks. No massive walls of text.
Direct Critique: If someone asks for feedback, be honest. Use your line: "theek thak hai but, aur acha kar sakte hai."

3. Interaction Style:
Delay/Dismissal: If a request is too broad, tell them to wait or give them a task first. "10 min de batata hu" or "pehle ye check karlo."
Informal Hinglish: Keep the 70/30 Hinglish mix. No formal English grammar rules.

4. Example Comparisons:
User: "Can you help me write a pitch for my new app?"
Standard AI: I can definitely help with that.
You: "idea kya hai? baki, zyada lamba mat khichna, clean rakho. kuch draft kiya hai toh dikhao, phir batata hu."`;

    // Chat History
    let chatHistory = [];

    // Initialize UI from config
    function initUI() {
        apiKeyInput.value = config.apiKey;
        
        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) {
            if (!config.apiKey) {
                welcomeMsg.textContent = "Hey there! Please enter your Gemini API Key in the settings on the left first.";
                sidebar.classList.add('open');
            } else if (!config.relationship) {
                welcomeMsg.textContent = "Hey! Before we start chatting, what's your relation to Avinash?";
                asking_relationship = true;
            } else {
                welcomeMsg.textContent = "Hey! Avinash here, let's chat.";
            }
        }
    }

    initUI();

    // Event Listeners
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = '52px';
        this.style.height = (this.scrollHeight) + 'px';
    });

    clearChatBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to clear the chat and reset your relationship context?')) {
            chatMessages.innerHTML = '';
            chatHistory = [];
            
            config.relationship = '';
            localStorage.removeItem('personal_ai_rel');
            asking_relationship = true;
            
            const initMsgDiv = document.createElement('div');
            initMsgDiv.className = 'message ai-message init-msg';
            initMsgDiv.id = 'init-msg-container';
            initMsgDiv.innerHTML = '<div class="msg-content" id="welcome-msg"></div>';
            chatMessages.appendChild(initMsgDiv);
            initUI();
        }
    });

    // Mobile Sidebar toggle
    openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
    toggleSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    // Functions
    function saveSettings() {
        config.apiKey = apiKeyInput.value.trim();

        localStorage.setItem('personal_ai_key', config.apiKey);

        showStatus('Settings saved!', 'success');
        
        // Update welcome message if still visible
        const initMsg = document.querySelector('.init-msg');
        if (initMsg) {
            initUI();
        }
    }

    function showStatus(msg, type) {
        saveStatus.textContent = msg;
        saveStatus.className = `status-msg show ${type}`;
        setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 3000);
    }

    function addMessageToUI(content, isUser) {
        // Remove init message if present
        const initMsg = document.querySelector('.init-msg');
        if (initMsg) initMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'msg-content';
        
        if (isUser) {
            contentDiv.textContent = content; // pure text for user
        } else {
            // parse markdown for AI
            contentDiv.innerHTML = marked.parse(content);
        }

        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        chatMessages.appendChild(typingIndicator);
        typingIndicator.classList.add('active');
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.classList.remove('active');
        if (typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        if (!config.apiKey) {
            alert('Please enter your Gemini API Key in the settings first.');
            sidebar.classList.add('open'); // open sidebar on mobile if missing key
            return;
        }

        if (!MY_PERSONALITY) {
            alert('Wait! Your personality details are not configured in the code yet.');
            return;
        }

        // 1. Add User Message to UI
        addMessageToUI(text, true);
        messageInput.value = '';
        messageInput.style.height = '52px'; // reset height

        if (asking_relationship) {
            config.relationship = text;
            localStorage.setItem('personal_ai_rel', config.relationship);
            asking_relationship = false;
            
            showTypingIndicator();
            setTimeout(() => {
                hideTypingIndicator();
                addMessageToUI("Got it! I've noted that you are my **" + config.relationship + "**. Let's chat!", false);
            }, 800);
            return;
        }

        // 2. Add to chat history
        chatHistory.push({ role: "user", parts: [{ text: text }] });

        // 3. Call API
        await generateAIResponse();
    }

    async function generateAIResponse() {
        showTypingIndicator();

        // System prompt generation
        const systemInstruction = `You are a replica of a human being. Your goal is to perfectly mimic their personality, tone, and traits. 
Here is how they describe themselves:
"${MY_PERSONALITY}"

You are currently talking to your ${config.relationship}.
Adjust your tone, vocabulary, and intimacy level based exactly on this relationship. Don't sound like an AI assistant. Use the same slang, sentence length, and emojis that the person would use. NEVER break character. NEVER say you are an AI.
CRITICAL INSTRUCTION: Do NOT output your inner monologue, thoughts, or reasoning process. ONLY output the final conversational reply that the user should see.`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`;
            
            const payload = {
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: chatHistory,
                generationConfig: {
                    temperature: 0.9, // Higher temp for more natural/variable responses
                    topP: 0.95,
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API Error');
            }

            const data = await response.json();
            const aiTextResponse = data.candidates[0].content.parts[0].text;
            
            hideTypingIndicator();
            
            // Add AI response to history
            chatHistory.push({ role: "model", parts: [{ text: aiTextResponse }] });
            
            // Add AI response to UI
            addMessageToUI(aiTextResponse, false);

        } catch (error) {
            hideTypingIndicator();
            console.error('Error calling Gemini:', error);
            
            // Remove the failed user message from history so they can try again
            chatHistory.pop();
            
            const errorMsgDiv = document.createElement('div');
            errorMsgDiv.className = 'message ai-message';
            errorMsgDiv.innerHTML = `<div class="msg-content" style="color: #f87171; border-color: #f87171;">Error: ${error.message}</div>`;
            chatMessages.appendChild(errorMsgDiv);
            scrollToBottom();
        }
    }
});
