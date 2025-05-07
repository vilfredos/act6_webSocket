document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const connectionStatus = document.getElementById('connection-status');
    const usernameDisplay = document.getElementById('username-display');
    const changeUsernameBtn = document.getElementById('change-username-btn');
    const usernameModal = document.getElementById('username-modal');
    const newUsernameInput = document.getElementById('new-username');
    const usernameSubmitBtn = document.getElementById('username-submit');
    const connectionText = document.getElementById('connection-text');
    const onlineIndicator = document.querySelector('.online-indicator');
    
    // Variables WebSocket
    let socket;
    let clientId = null;
    let username = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 segundos
    
    // Iniciar conexión WebSocket
    connectToServer();
    
    // Función para conectar al servidor WebSocket
    function connectToServer() {
        socket = new WebSocket('ws://localhost:8765');
        
        // Evento: Conexión establecida
        socket.addEventListener('open', (event) => {
            updateConnectionStatus('connected');
            addSystemMessage('Conectado al servidor de chat');
        });
        
        // Evento: Mensaje recibido
        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Procesar según el tipo de mensaje
                switch (data.type) {
                    case 'connection_established':
                        clientId = data.client_id;
                        username = data.username;
                        usernameDisplay.textContent = username;
                        break;
                        
                    case 'chat_message':
                        addChatMessage(data.username, data.message, data.timestamp, data.username === username);
                        break;
                        
                    case 'user_event':
                        const eventText = data.event === 'joined' ? 
                            `${data.username} se ha unido al chat` : 
                            `${data.username} ha abandonado el chat`;
                        addSystemMessage(eventText, data.timestamp);
                        break;
                        
                    case 'username_changed':
                        addSystemMessage(`${data.old_username} ha cambiado su nombre a ${data.new_username}`, data.timestamp);
                        break;
                        
                    case 'username_confirmation':
                        username = data.username;
                        usernameDisplay.textContent = username;
                        break;
                }
            } catch (error) {
                console.error('Error al procesar el mensaje:', error);
                addSystemMessage('Error al procesar el mensaje recibido');
            }
        });
        
        // Evento: Error en la conexión
        socket.addEventListener('error', (event) => {
            updateConnectionStatus('disconnected');
            addSystemMessage('Error de conexión');
        });
        
        // Evento: Conexión cerrada
        socket.addEventListener('close', (event) => {
            updateConnectionStatus('disconnected');
            addSystemMessage('Desconectado del servidor');
            
            // Intentar reconectar
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const timeoutSeconds = (reconnectDelay / 1000) * reconnectAttempts;
                addSystemMessage(`Intentando reconectar en ${timeoutSeconds} segundos... (Intento ${reconnectAttempts}/${maxReconnectAttempts})`);
                
                setTimeout(() => {
                    updateConnectionStatus('connecting');
                    connectToServer();
                }, reconnectDelay * reconnectAttempts);
            } else {
                addSystemMessage('No se pudo reconectar al servidor. Por favor, recarga la página.');
            }
        });
    }
    
    // Función para actualizar el estado de conexión
    function updateConnectionStatus(status) {
        onlineIndicator.classList.remove('connected', 'disconnected', 'connecting');
        
        switch(status) {
            case 'connected':
                connectionText.textContent = 'Conectado';
                onlineIndicator.classList.add('connected');
                messageInput.disabled = false;
                sendButton.disabled = false;
                break;
            case 'disconnected':
                connectionText.textContent = 'Desconectado';
                onlineIndicator.classList.add('disconnected');
                messageInput.disabled = true;
                sendButton.disabled = true;
                break;
            case 'connecting':
                connectionText.textContent = 'Conectando...';
                onlineIndicator.classList.add('connecting');
                messageInput.disabled = true;
                sendButton.disabled = true;
                break;
        }
    }
    
    // Al iniciar, establecemos estado "conectando"
    updateConnectionStatus('connecting');
    
    // Función para enviar un mensaje de chat
    function sendChatMessage(message) {
        if (!message || message.trim().length === 0) {
            return;
        }

        if (socket.readyState === WebSocket.OPEN) {
            const messagePacket = {
                type: 'chat_message',
                message: message.trim()
            };
            
            socket.send(JSON.stringify(messagePacket));
            messageInput.value = '';
        } else {
            addSystemMessage('No se pudo enviar el mensaje, conexión cerrada');
            messageInput.value = '';
        }
    }
    
    // Función para cambiar nombre de usuario
    function changeUsername(newUsername) {
        if (!newUsername || newUsername.trim().length === 0) {
            addSystemMessage('El nombre de usuario no puede estar vacío');
            return;
        }

        if (socket.readyState === WebSocket.OPEN) {
            const usernamePacket = {
                type: 'change_username',
                username: newUsername.trim()
            };
            
            socket.send(JSON.stringify(usernamePacket));
        } else {
            addSystemMessage('No se pudo cambiar el nombre, conexión cerrada');
        }
    }
    
    // Función para añadir un mensaje de chat al historial
    function addChatMessage(user, message, timestamp, isOwnMessage) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwnMessage ? 'user-message' : 'other-message'}`;
        
        const usernameElement = document.createElement('span');
        usernameElement.className = 'username';
        usernameElement.textContent = user + ': ';
        
        const messageText = document.createElement('span');
        messageText.textContent = message;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'timestamp';
        timeElement.textContent = formatTimestamp(timestamp);
        
        messageElement.appendChild(usernameElement);
        messageElement.appendChild(messageText);
        messageElement.appendChild(timeElement);
        chatMessages.appendChild(messageElement);
        
        // Desplazar hacia el último mensaje
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Función para añadir un mensaje del sistema
    function addSystemMessage(message, timestamp = null) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.textContent = message;
        
        if (timestamp) {
            const timeElement = document.createElement('div');
            timeElement.className = 'timestamp';
            timeElement.textContent = formatTimestamp(timestamp);
            messageElement.appendChild(timeElement);
        }
        
        chatMessages.appendChild(messageElement);
        
        // Desplazar hacia el último mensaje
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Función para formatear un timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    }
    
    // Función para procesar el cambio de nombre
    function handleUsernameChange() {
        const newUsername = newUsernameInput.value.trim();
        if (newUsername && newUsername !== username) {
            changeUsername(newUsername);
            usernameModal.style.display = 'none';
        }
    }

    // Event Listeners
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            sendChatMessage(message);
        }
    });
    
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const message = messageInput.value.trim();
            if (message) {
                sendChatMessage(message);
            }
        }
    });
    
    // Modal para cambiar nombre de usuario
    changeUsernameBtn.addEventListener('click', () => {
        usernameModal.style.display = 'block';
        newUsernameInput.value = username;
        newUsernameInput.focus();
    });

    // Añadir evento de tecla Enter al input de nombre de usuario
    newUsernameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleUsernameChange();
        }
    });

    // Mantener el evento click del botón
    usernameSubmitBtn.addEventListener('click', handleUsernameChange);
    
    // Cerrar modal haciendo clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === usernameModal) {
            usernameModal.style.display = 'none';
        }
    });
    
    // Agregar mensaje de bienvenida
    addSystemMessage('Bienvenido al chat en tiempo real');
});