"""
FastAPI Server for Replit
A complete FastAPI application with basic endpoints and interactive documentation.
"""

import logging
import os
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import uvicorn

from models import HealthResponse, ErrorResponse
from routers import items
from mqtt_service import mqtt_service
from mqtt_config import mqtt_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Store recent POST requests in memory
recent_requests = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("FastAPI server starting up...")
    
    # Connect to MQTT broker
    try:
        mqtt_service.connect()
        logger.info("MQTT service initialized")
    except Exception as e:
        logger.error(f"Failed to initialize MQTT service: {e}")
    
    yield
    
    # Disconnect from MQTT broker
    logger.info("FastAPI server shutting down...")
    try:
        mqtt_service.disconnect()
        logger.info("MQTT service disconnected")
    except Exception as e:
        logger.error(f"Error disconnecting MQTT service: {e}")

# Initialize FastAPI application
app = FastAPI(
    title="FastAPI Server on Replit",
    description="A demonstration FastAPI server with basic endpoints and interactive documentation",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(items.router, prefix="/api/v1", tags=["items"])

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - dashboard showing recent POST requests"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>FastAPI Server Dashboard</title>
        <meta http-equiv="refresh" content="10">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #333; text-align: center; }}
            .links {{ text-align: center; margin: 20px 0; }}
            .links a {{ margin: 0 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }}
            .links a:hover {{ background: #0056b3; }}
            .requests {{ margin-top: 30px; }}
            .request {{ background: #f8f9fa; border: 1px solid #dee2e6; margin: 10px 0; padding: 15px; border-radius: 5px; }}
            .request-header {{ font-weight: bold; color: #495057; margin-bottom: 10px; }}
            .request-data {{ background: #e9ecef; padding: 10px; border-radius: 3px; overflow-x: auto; }}
            pre {{ margin: 0; white-space: pre-wrap; word-wrap: break-word; }}
            .no-requests {{ text-align: center; color: #6c757d; font-style: italic; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 FastAPI Server Dashboard</h1>
            <div class="links">
                <a href="/docs">📚 API Docs</a>
                <a href="/redoc">📖 ReDoc</a>
                <a href="/health">❤️ Health Check</a>
                <a href="/requests">📋 Recent Requests</a>
                <a href="/mqtt">🔗 MQTT Messages</a>
                <a href="/settings">⚙️ MQTT Settings</a>
                <a href="/mqtt-status">📊 MQTT Status</a>
            </div>
            
            <div class="requests">
                <h2>Recent POST Requests (Last 10)</h2>
                {_generate_requests_html()}
            </div>
            
            <p style="text-align: center; color: #6c757d; margin-top: 30px;">
                This page auto-refreshes every 10 seconds
            </p>
        </div>
    </body>
    </html>
    """
    return html_content

def _generate_requests_html():
    """Generate HTML for recent requests"""
    if not recent_requests:
        return '<div class="no-requests">No POST requests received yet. Send a POST request to see it here!</div>'
    
    html = ""
    recent_list = list(reversed(recent_requests[-10:]))
    for i, req in enumerate(recent_list, 1):
        request_num = len(recent_requests) - len(recent_list) + i
        html += f'''
        <div class="request">
            <div class="request-header">Request #{request_num} - {req['timestamp']}</div>
            <div class="request-data">
                <pre>{req['data_pretty']}</pre>
            </div>
        </div>
        '''
    return html

@app.post("/", response_model=dict)
async def root_post(request: dict = {}):
    """Root POST endpoint - shows incoming POST data and forwards to MQTT"""
    from datetime import datetime
    import json
    
    timestamp = datetime.now().isoformat()
    logger.info(f"POST request received at root with data: {request}")
    
    # Store the request for display on dashboard
    recent_requests.append({
        "timestamp": timestamp,
        "data": request,
        "data_pretty": json.dumps(request, indent=2, default=str)
    })
    
    # Keep only last 50 requests to prevent memory issues
    if len(recent_requests) > 50:
        recent_requests.pop(0)
    
    # Forward HTTP request as MQTT message
    mqtt_payload = {
        "source": "http_request",
        "timestamp": timestamp,
        "http_data": request,
        "metadata": {
            "data_type": type(request).__name__,
            "data_size": len(str(request)) if request else 0
        }
    }
    
    # Send to MQTT broker
    mqtt_success = mqtt_service.publish_message(mqtt_payload)
    
    return {
        "message": "POST request received at root endpoint",
        "received_data": request,
        "timestamp": timestamp,
        "data_type": type(request).__name__,
        "data_size": len(str(request)) if request else 0,
        "mqtt_forwarded": mqtt_success,
        "mqtt_status": "sent" if mqtt_success else "failed"
    }

@app.get("/requests", response_model=dict)
async def get_recent_requests():
    """Get recent POST requests as JSON"""
    return {
        "total_requests": len(recent_requests),
        "recent_requests": recent_requests[-10:],  # Last 10 requests
        "message": "Recent POST requests data"
    }

@app.get("/mqtt", response_class=HTMLResponse)
async def mqtt_dashboard():
    """MQTT messages dashboard"""
    import json
    
    mqtt_status = mqtt_service.get_connection_status()
    recent_mqtt = mqtt_service.get_recent_messages(20)
    
    def generate_mqtt_html():
        if not recent_mqtt:
            return '<div class="no-requests">No MQTT messages yet. Send a POST request to trigger MQTT forwarding!</div>'
        
        html = ""
        for i, msg in enumerate(recent_mqtt, 1):
            msg_type = msg.get('type', 'unknown')
            timestamp = msg.get('timestamp', 'N/A')
            
            # Format different message types
            if msg_type == 'outgoing':
                topic = msg.get('topic', 'N/A')
                payload = msg.get('payload', {})
                status = msg.get('status', 'unknown')
                status_class = 'outgoing-success' if status == 'published' else 'outgoing-failed'
                html += f'''
                <div class="request mqtt-message {status_class}">
                    <div class="request-header">📤 Outgoing #{i} - {timestamp}</div>
                    <div class="mqtt-details">Topic: <code>{topic}</code> | Status: <span class="status-{status}">{status}</span></div>
                    <div class="request-data"><pre>{json.dumps(payload, indent=2, default=str)}</pre></div>
                </div>
                '''
            elif msg_type == 'incoming':
                topic = msg.get('topic', 'N/A')
                payload = msg.get('payload', {})
                qos = msg.get('qos', 0)
                html += f'''
                <div class="request mqtt-message incoming">
                    <div class="request-header">📥 Incoming #{i} - {timestamp}</div>
                    <div class="mqtt-details">Topic: <code>{topic}</code> | QoS: {qos}</div>
                    <div class="request-data"><pre>{json.dumps(payload, indent=2, default=str) if isinstance(payload, (dict, list)) else payload}</pre></div>
                </div>
                '''
            elif msg_type == 'connection':
                status = msg.get('status', 'unknown')
                broker = msg.get('broker', 'N/A')
                html += f'''
                <div class="request mqtt-message connection">
                    <div class="request-header">🔌 Connection #{i} - {timestamp}</div>
                    <div class="mqtt-details">Broker: <code>{broker}</code> | Status: <span class="status-{status}">{status}</span></div>
                </div>
                '''
        
        return html
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>MQTT Messages - FastAPI Server</title>
        <meta http-equiv="refresh" content="15">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #333; text-align: center; }}
            .status-bar {{ background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .status-connected {{ color: #28a745; font-weight: bold; }}
            .status-disconnected {{ color: #dc3545; font-weight: bold; }}
            .links {{ text-align: center; margin: 20px 0; }}
            .links a {{ margin: 0 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }}
            .links a:hover {{ background: #0056b3; }}
            .requests {{ margin-top: 30px; }}
            .request {{ background: #f8f9fa; border: 1px solid #dee2e6; margin: 10px 0; padding: 15px; border-radius: 5px; }}
            .mqtt-message.outgoing-success {{ border-left: 4px solid #28a745; }}
            .mqtt-message.outgoing-failed {{ border-left: 4px solid #dc3545; }}
            .mqtt-message.incoming {{ border-left: 4px solid #007bff; }}
            .mqtt-message.connection {{ border-left: 4px solid #6c757d; }}
            .request-header {{ font-weight: bold; color: #495057; margin-bottom: 10px; }}
            .mqtt-details {{ font-size: 0.9em; color: #6c757d; margin-bottom: 10px; }}
            .request-data {{ background: #e9ecef; padding: 10px; border-radius: 3px; overflow-x: auto; }}
            pre {{ margin: 0; white-space: pre-wrap; word-wrap: break-word; }}
            .no-requests {{ text-align: center; color: #6c757d; font-style: italic; margin: 20px 0; }}
            code {{ background: #f1f3f4; padding: 2px 4px; border-radius: 2px; font-family: monospace; }}
            .status-published, .status-connected {{ color: #28a745; }}
            .status-failed, .status-disconnected, .status-error {{ color: #dc3545; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔗 MQTT Messages Dashboard</h1>
            <div class="links">
                <a href="/">🏠 Home</a>
                <a href="/mqtt-status">📊 MQTT Status</a>
                <a href="/requests">📋 HTTP Requests</a>
            </div>
            
            <div class="status-bar">
                <strong>MQTT Connection Status:</strong> 
                <span class="status-{'connected' if mqtt_status['connected'] else 'disconnected'}">
                    {'🟢 Connected' if mqtt_status['connected'] else '🔴 Disconnected'}
                </span>
                | Broker: {mqtt_status['broker']} | Total Messages: {mqtt_status['total_messages']}
            </div>
            
            <div class="requests">
                <h2>Recent MQTT Messages (Last 20)</h2>
                {generate_mqtt_html()}
            </div>
            
            <p style="text-align: center; color: #6c757d; margin-top: 30px;">
                This page auto-refreshes every 15 seconds
            </p>
        </div>
    </body>
    </html>
    """
    return html_content

@app.get("/mqtt-status", response_model=dict)
async def get_mqtt_status():
    """Get MQTT connection status and recent messages"""
    return {
        "connection_status": mqtt_service.get_connection_status(),
        "recent_messages": mqtt_service.get_recent_messages(10),
        "message": "MQTT service status and recent messages"
    }

@app.post("/mqtt/send", response_model=dict)
async def send_mqtt_message(payload: dict, topic: Optional[str] = None):
    """Send a custom MQTT message"""
    from datetime import datetime
    
    success = mqtt_service.publish_message(payload, topic)
    
    return {
        "success": success,
        "message": "MQTT message sent successfully" if success else "Failed to send MQTT message",
        "payload": payload,
        "topic": topic or mqtt_service.OUTGOING_TOPIC,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/settings", response_class=HTMLResponse)
async def mqtt_settings_page():
    """MQTT Settings configuration page"""
    current_config = mqtt_config.get_config()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>MQTT Settings - FastAPI Server</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            h1 {{ color: #333; text-align: center; }}
            .links {{ text-align: center; margin: 20px 0; }}
            .links a {{ margin: 0 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }}
            .links a:hover {{ background: #0056b3; }}
            .form-group {{ margin: 15px 0; }}
            label {{ display: block; font-weight: bold; margin-bottom: 5px; color: #555; }}
            input[type="text"], input[type="number"] {{ width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }}
            input[type="password"] {{ width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }}
            .form-row {{ display: flex; gap: 15px; }}
            .form-row .form-group {{ flex: 1; }}
            .btn {{ padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin: 10px 5px; }}
            .btn:hover {{ background: #218838; }}
            .btn-secondary {{ background: #6c757d; }}
            .btn-secondary:hover {{ background: #545b62; }}
            .current-status {{ background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .status-connected {{ color: #28a745; font-weight: bold; }}
            .status-disconnected {{ color: #dc3545; font-weight: bold; }}
            .section {{ border: 1px solid #ddd; border-radius: 5px; padding: 20px; margin: 20px 0; }}
            .section h3 {{ margin-top: 0; color: #495057; }}
        </style>
        <script>
            async function updateSettings() {{
                const formData = new FormData(document.getElementById('settingsForm'));
                const settings = {{}};
                
                // Convert form data to object
                for (let [key, value] of formData.entries()) {{
                    if (key === 'broker_port') {{
                        settings[key] = parseInt(value);
                    }} else {{
                        settings[key] = value;
                    }}
                }}
                
                try {{
                    const response = await fetch('/settings', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json',
                        }},
                        body: JSON.stringify(settings)
                    }});
                    
                    const result = await response.json();
                    
                    if (result.success) {{
                        alert('Settings updated successfully! MQTT connection will restart.');
                        window.location.reload();
                    }} else {{
                        alert('Failed to update settings: ' + result.message);
                    }}
                }} catch (error) {{
                    alert('Error updating settings: ' + error.message);
                }}
            }}
            
            async function testConnection() {{
                try {{
                    const response = await fetch('/mqtt-status');
                    const result = await response.json();
                    
                    const status = result.connection_status.connected ? 'Connected' : 'Disconnected';
                    alert('Current MQTT Status: ' + status);
                }} catch (error) {{
                    alert('Error testing connection: ' + error.message);
                }}
            }}
        </script>
    </head>
    <body>
        <div class="container">
            <h1>⚙️ MQTT Settings</h1>
            <div class="links">
                <a href="/">🏠 Home</a>
                <a href="/mqtt">🔗 MQTT Dashboard</a>
                <a href="/requests">📋 HTTP Requests</a>
            </div>
            
            <div class="current-status">
                <strong>Current Status:</strong>
                <span id="connectionStatus">Loading...</span>
                <button type="button" class="btn btn-secondary" onclick="testConnection()">Test Connection</button>
            </div>
            
            <form id="settingsForm">
                <div class="section">
                    <h3>🏢 Broker Configuration</h3>
                    <div class="form-group">
                        <label for="broker_host">Broker Host:</label>
                        <input type="text" id="broker_host" name="broker_host" value="{current_config['broker_host']}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="broker_port">Port:</label>
                            <input type="number" id="broker_port" name="broker_port" value="{current_config['broker_port']}" required>
                        </div>
                        <div class="form-group">
                            <label for="client_id">Client ID:</label>
                            <input type="text" id="client_id" name="client_id" value="{current_config['client_id']}" required>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>🔐 Authentication</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="username">Username:</label>
                            <input type="text" id="username" name="username" value="{current_config['username']}" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" value="{current_config['password']}" required>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>📡 Topics Configuration</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="publish_topic">Publishing Topic (Outgoing):</label>
                            <input type="text" id="publish_topic" name="publish_topic" value="{current_config['publish_topic']}" required>
                            <small style="color: #6c757d;">Topic where HTTP requests are forwarded</small>
                        </div>
                        <div class="form-group">
                            <label for="subscribe_topic">Subscribing Topic (Incoming):</label>
                            <input type="text" id="subscribe_topic" name="subscribe_topic" value="{current_config['subscribe_topic']}" required>
                            <small style="color: #6c757d;">Topic to listen for incoming messages</small>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button type="button" class="btn" onclick="updateSettings()">💾 Save Settings & Reconnect</button>
                    <button type="button" class="btn btn-secondary" onclick="window.location.href='/mqtt-status'">📊 View Status</button>
                </div>
            </form>
        </div>
        
        <script>
            // Load connection status on page load
            window.onload = async function() {{
                try {{
                    const response = await fetch('/mqtt-status');
                    const result = await response.json();
                    const statusElement = document.getElementById('connectionStatus');
                    
                    if (result.connection_status.connected) {{
                        statusElement.innerHTML = '<span class="status-connected">🟢 Connected to ' + result.connection_status.broker + '</span>';
                    }} else {{
                        statusElement.innerHTML = '<span class="status-disconnected">🔴 Disconnected</span>';
                    }}
                }} catch (error) {{
                    document.getElementById('connectionStatus').innerHTML = '<span class="status-disconnected">🔴 Error loading status</span>';
                }}
            }}
        </script>
    </body>
    </html>
    """
    return html_content

@app.post("/settings", response_model=dict)
async def update_mqtt_settings(request: Request):
    """Update MQTT settings and reconnect"""
    try:
        settings_data = await request.json()
        
        # Validate required fields
        required_fields = ["broker_host", "broker_port", "username", "password", "client_id", "publish_topic", "subscribe_topic"]
        for field in required_fields:
            if field not in settings_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Reconnect with new settings
        success = mqtt_service.reconnect_with_new_settings(settings_data)
        
        return {
            "success": success,
            "message": "MQTT settings updated and reconnected successfully" if success else "Failed to reconnect with new settings",
            "settings": settings_data
        }
        
    except Exception as e:
        logger.error(f"Error updating MQTT settings: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")

@app.get("/settings/current", response_model=dict)
async def get_current_settings():
    """Get current MQTT settings"""
    return {
        "settings": mqtt_config.get_config(),
        "connection_status": mqtt_service.get_connection_status(),
        "message": "Current MQTT configuration"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    return HealthResponse(
        status="healthy",
        message="FastAPI server is running successfully",
        version="1.0.0"
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=True,
            message=exc.detail,
            status_code=exc.status_code
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler for unexpected errors"""
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error=True,
            message="Internal server error occurred",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        ).dict()
    )

if __name__ == "__main__":
    # Get port from environment or default to 5000 (required for Replit)
    port = int(os.getenv("PORT", 5000))
    
    logger.info(f"Starting FastAPI server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
