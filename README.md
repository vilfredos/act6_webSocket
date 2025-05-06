# Chat Colaborativo en Tiempo Real con WebSocket

Este proyecto implementa un sistema de chat en tiempo real utilizando WebSocket para comunicación bidireccional entre un servidor Python y clientes web.

## Características

- Comunicación en tiempo real entre múltiples usuarios
- Asignación automática de nombres de usuario
- Posibilidad de cambiar nombre de usuario
- Notificaciones cuando usuarios se unen o abandonan el chat
- Interfaz web responsiva
- Reconexión automática en caso de pérdida de conexión

## Estructura del Proyecto

```
chat-websocket/
├── backend/
│   ├── server.py                # Servidor WebSocket (Python)
│   ├── utils.py                 # Funciones auxiliares
│   └── requirements.txt         # Paquetes necesarios
├── frontend/
│   ├── index.html               # Cliente web
│   └── script.js                # Lógica WebSocket del cliente
├── README.md                    # Instrucciones generales
└── .gitignore                   # Ignorar env/, __pycache__, etc.
```

## Requisitos

### Backend
- Python 3.7 o superior
- Librería websockets

### Frontend
- Navegador web moderno con soporte para WebSocket

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/chat-websocket.git
   cd chat-websocket
   ```

2. Crea un entorno virtual y actívalo:
   ```bash
   python -m venv env
   env\Scripts\activate
   
  

3. Instala las dependencias:
   ```bash
   pip install -r backend/requirements.txt
   ```

## Ejecución

### Iniciar el servidor

1. Asegúrate de tener el entorno virtual activado
2. Ejecuta el servidor:
   ```bash
   # Desde la raíz del proyecto
   python backend/server.py
   ```
   El servidor se iniciará en `ws://localhost:8765`

### Iniciar el cliente

1. Abre el archivo `frontend/index.html` en tu navegador web
   - Puedes usar un servidor web simple para servir los archivos estáticos:
     ```bash
     # Con Python
     # Desde el directorio frontend/
     python -m http.server 8000
     ```
   - Luego abre http://localhost:8000 en tu navegador

2. También puedes abrir el archivo directamente:
   - Haz doble clic en `frontend/index.html` para abrirlo con tu navegador predeterminado

## Uso

1. Al conectarte al servidor, se te asignará automáticamente un nombre de usuario temporal
2. Puedes enviar mensajes escribiendo en el campo de texto y presionando Enter o el botón "Enviar"
3. Para cambiar tu nombre de usuario, haz clic en el botón "Cambiar nombre" en la esquina superior derecha
4. Los mensajes del sistema notificarán cuando otros usuarios se unan o abandonen el chat

## Notas técnicas

- La comunicación cliente-servidor utiliza JSON para el intercambio de mensajes
- El protocolo WebSocket permite comunicación bidireccional en tiempo real
- El servidor maneja múltiples conexiones simultáneas
- El cliente intenta reconectarse automáticamente si pierde la conexión

## Solución de problemas

- **El servidor no inicia**: Verifica que el puerto 8765 no esté siendo utilizado por otra aplicación
- **No puedes conectarte al servidor**: Asegúrate de que el servidor esté en ejecución y que no haya restricciones de firewall
- **Los mensajes no se envían**: Verifica en la consola del navegador si hay errores de WebSocket
