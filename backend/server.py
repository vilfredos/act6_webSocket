#!/usr/bin/env python
import asyncio
import json
import logging
import uuid
import websockets #libreria para manejar websockets en python

# Configurar sistema de logs para mostrar mensajes con fecha y hora
logging.basicConfig(
    format="%(asctime)s %(message)s",
    level=logging.INFO,
)

# Almacenamiento de conexiones activas (diccionario global): {client_id: (websocket, username)}
CONNECTED_CLIENTS = {}

async def register_client(websocket):
    """Registra un nuevo cliente en el sistema de chat."""
    client_id = str(uuid.uuid4()) # id unico para cada cliente
    username = f"Usuario_{client_id[:8]}"  # Username temporal
    CONNECTED_CLIENTS[client_id] = (websocket, username)
    
    # Notificar a todos los usuarios sobre el nuevo cliente
    await notify_user_event(client_id, username, "joined")
    logging.info(f"Cliente {username} ({client_id}) conectado")
    return client_id, username

async def unregister_client(client_id):
    """Elimina un cliente del sistema cuando se desconecta."""
    if client_id in CONNECTED_CLIENTS:
        _, username = CONNECTED_CLIENTS[client_id]
        del CONNECTED_CLIENTS[client_id] #eliminar del diccionario
        
        # Notificar a todos los usuarios que alguien se desconectó
        await notify_user_event(client_id, username, "left")
        logging.info(f"Cliente {username} ({client_id}) desconectado")

async def notify_user_event(client_id, username, event_type):
    """Envía notificación a todos los clientes sobre eventos de usuarios (unión/salida)."""
    if CONNECTED_CLIENTS:  # Solo si hay clientes conectados
        #crear mensaje de evento en formato JSON    
        event_message = json.dumps({
            "type": "user_event",
            "username": username,
            "event": event_type,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Enviar a todos los clientes conectados
        await broadcast_message(event_message, None)  # None = enviar a todos

async def broadcast_message(message, exclude_id=None):
    """
    Difunde un mensaje a todos los clientes conectados.
    Si exclude_id está presente, no envía al cliente con ese ID.
    """
    disconnected_clients = [] #lista para rastrear a los que se desconectaron durante el envio
    
    for client_id, (websocket, _) in CONNECTED_CLIENTS.items():
        if exclude_id and client_id == exclude_id:
            continue
            
        try:
            #intentar enviar el mensaje al cliente
            await websocket.send(message)
        except websockets.ConnectionClosed:
            #si la conexion esta cerrada marcar para eliminacion posterior
            disconnected_clients.append(client_id)
    
    # Limpiar clientes desconectados durante el broadcast
    for client_id in disconnected_clients:
        await unregister_client(client_id)

async def process_message(client_id, message_text):
    """Procesa un mensaje de chat y lo difunde a todos los clientes."""
    #obtener el nombre de usuario del cliente
    _, username = CONNECTED_CLIENTS[client_id]
    
    # Crear estructura del mensaje formato JSON 
    message = json.dumps({
        "type": "chat_message",
        "username": username,
        "message": message_text,
        "timestamp": asyncio.get_event_loop().time()
    })
    #registrar mensaje en el log
    logging.info(f"Mensaje de {username}: {message_text}")
    await broadcast_message(message) #mandar el mensaje a todos los clientes

async def process_username_change(client_id, new_username):
    # Define una función asincrónica para cambiar el nombre de usuario de un cliente específico.

    if client_id in CONNECTED_CLIENTS:
        # Verifica si el cliente con el ID dado está actualmente conectado.

        websocket, old_username = CONNECTED_CLIENTS[client_id]
        # Obtiene el WebSocket del cliente y su nombre de usuario anterior desde el diccionario global.

        CONNECTED_CLIENTS[client_id] = (websocket, new_username)
        # Actualiza el diccionario con el nuevo nombre de usuario manteniendo el mismo WebSocket.

        notification = json.dumps({
            "type": "username_changed",
            "old_username": old_username,
            "new_username": new_username,
            "timestamp": asyncio.get_event_loop().time()
        })
        # Crea un mensaje JSON para notificar a todos los clientes que el usuario cambió su nombre.
        # Se incluye un timestamp que representa el tiempo actual según el bucle de eventos.

        logging.info(f"Usuario {old_username} cambió su nombre a {new_username}")
        # Registra en el log el cambio de nombre de usuario con nivel de información.

        await broadcast_message(notification)
        # Envía el mensaje de notificación a todos los clientes conectados usando broadcast_message.

        confirm = json.dumps({
            "type": "username_confirmation",
            "username": new_username
        })
        # Prepara un mensaje JSON de confirmación para enviar solo al cliente que solicitó el cambio.

        await websocket.send(confirm)
        # Envía la confirmación del cambio de nombre de usuario al WebSocket del cliente correspondiente.

async def handle_client(websocket, path):
    """Maneja la conexión WebSocket de un cliente."""
    client_id = None
    
    try:
        # Registrar cliente
        client_id, username = await register_client(websocket)
        
        # Enviar confirmación de conexión al cliente
        welcome = json.dumps({
            "type": "connection_established",
            "client_id": client_id,
            "username": username
        })
        await websocket.send(welcome)
        
        # Bucle principal para recibir mensajes
        async for message in websocket:
            try:
                #decodificar el mensaje JSON recibido
                data = json.loads(message)
                
                # Procesar según el tipo de mensaje
                if data["type"] == "chat_message":
                    await process_message(client_id, data["message"])
                elif data["type"] == "change_username":
                    await process_username_change(client_id, data["username"])
                else:
                    logging.warning(f"Tipo de mensaje desconocido: {data['type']}")
                    
            except json.JSONDecodeError:
                #error al decodificar el JSON
                logging.error(f"Mensaje inválido recibido: {message}")
                
    except websockets.ConnectionClosed:
        #la conexion se cerro de manera inesperada
        logging.info("Conexión cerrada")
    finally:
        # Asegurar que el cliente sea eliminado al desconectarse
        if client_id:
            await unregister_client(client_id)

async def main():
    """Inicia el servidor WebSocket."""
    port = 8765
    host = "localhost"
    
    server = await websockets.serve(
        handle_client, #funcion que maneja cada conexion
        host, #host donde escuchar
        port  #puerto donde escuchar
    )
    
    logging.info(f"Servidor WebSocket iniciado en ws://{host}:{port}")
    
    # Mantener el servidor en ejecución hasta que se cierre
    await server.wait_closed()
#punto de entrada del script cuando se ejecuta directamente
if __name__ == "__main__":
    asyncio.run(main())  #iniciar el bucle de eventos asyncio con la funcion principal