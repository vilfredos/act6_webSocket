#!/usr/bin/env python
import json
import time
from datetime import datetime

def format_timestamp(timestamp):
    """Convierte un timestamp en un formato de hora legible."""
    dt = datetime.fromtimestamp(timestamp)
    return dt.strftime("%H:%M:%S")

def create_message_packet(message_type, **kwargs):
    """
    Crea un paquete de mensaje estandarizado.
    
    Args:
        message_type (str): Tipo de mensaje ('chat_message', 'user_event', etc.)
        **kwargs: Datos adicionales para incluir en el mensaje
    
    Returns:
        str: Mensaje en formato JSON
    """
    packet = {
        "type": message_type,
        "timestamp": time.time(),
        **kwargs
    }
    return json.dumps(packet)

def parse_message(message_str):
    """
    Analiza un mensaje JSON y devuelve un diccionario.
    
    Args:
        message_str (str): Mensaje en formato JSON
    
    Returns:
        dict: Contenido del mensaje
        None: Si el mensaje no es válido
    """
    try:
        return json.loads(message_str)
    except json.JSONDecodeError:
        return None

def validate_username(username):
    """
    Valida que un nombre de usuario cumpla con requisitos básicos.
    
    Args:
        username (str): Nombre de usuario a validar
    
    Returns:
        bool: True si es válido, False en caso contrario
    """
    if not username or not isinstance(username, str):
        return False
    
    # El nombre debe tener entre 3 y 20 caracteres
    if len(username) < 3 or len(username) > 20:
        return False
    
    # Verificar caracteres permitidos (alfanuméricos y algunos símbolos)
    allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.")
    return all(c in allowed_chars for c in username)