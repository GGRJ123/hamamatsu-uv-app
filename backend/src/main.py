# main.py

# --- 📚 IMPORTING THE NECESSARY TOOLS (Python Libraries) ---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 🛡️ The Security Guard (CORS)
from pydantic import BaseModel                   # 🗺️ The Data Mapper (Pydantic)
import uvicorn                                   # 🚀 The Server Launcher (Uvicorn)
from src.controller import Controller      # 🎛️ The UV Controller Interface


# 🌟 NEW: Initialize the Controller (This is done ONCE when the server starts) 🌟
try:
    # Initialize the controller, which attempts to connect to the hardware
    UV_CONTROLLER = Controller()
    print("✨ UV Controller initialized and connected to hardware!")
except Exception as e:
    print(f"🛑 HARDWARE CONNECTION FAILED: {e}")
    UV_CONTROLLER = None # Set to None if connection fails




# --- 🗺️ DATA MAP: The Pydantic Model (Telling the server what data looks like) ---

# Think of this class like a clear blueprint or a contract for ONE step of the procedure.
# When React sends data, FastAPI uses this map to check if the structure is correct.
class ProcedureStep(BaseModel):
    # This says: I MUST receive a variable named 'time' and it MUST be a string.
    time: str
    # And I MUST receive a variable named 'intensity' and it MUST be a whole number (integer).
    intensity: int

# --- ⚙️ SERVER SETUP ---

# 1. Initialize the FastAPI app
# 'app' is the main Python brain that receives and handles all web traffic.
app = FastAPI()

# --- 🛡️ SECURITY CHECK: CROSS-ORIGIN (CORS) ---

# 2. CORS: This is the security rule that prevents your browser from saying,
#    "Hey, React is on port 5173, but Python is on port 8000. That looks suspicious!"
origins = [
    # We must explicitly tell the server to trust and allow traffic from your frontend's address.
    "http://localhost:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Only allow connections from your safe React address.
    allow_credentials=True,
    allow_methods=["*"],   # Allow all request types (GET, POST, etc.)
    allow_headers=["*"],   # Allow standard data headers
)

# --- 📞 API ENDPOINTS (The "Phone Numbers" your React app calls) ---

# 3. GET Endpoint: The "Are You Awake?" check
#    @app.get("/") means "When someone visits the root address (like '...:8000/'), do this."
@app.get("/")
def read_root():
    # Sends a friendly 'Hello' message back in a format the web understands (JSON).
    return {"message": "Hello from FastAPI backend! Connection successful, puppy! 🥳"}

# 4. POST Endpoint: The "Start the Procedure" command
#    @app.post("/start_procedure") means "When React SENDS data to this specific address, do this."
@app.post("/start_procedure")
# FastAPI automatically checks the incoming data against our list of 'ProcedureStep' blueprints.
def start_procedure(procedure_data: list[ProcedureStep]):
    
    # 🌟 STEP 1: Process the data sent by React 🌟
    intensity_list = []

    # Loop through the list of steps (which we know are clean because of Pydantic!)
    for step in procedure_data:
        # Pull out ONLY the intensity number from each step object.
        intensity_list.append(step.intensity)
    
    # Send a message to the Uvicorn terminal (your console) to confirm it worked.
    print(f"Received total steps: {len(procedure_data)}")
    print(f"All Intensities Received: {intensity_list}")    

    # 🌟 STEP 2: Send a confirmation message back to React 🌟
    return {
        "status": "success", 
        "total_steps_received": len(procedure_data), 
        "recvied_intensities": intensity_list # Sending the list back for confirmation!
    }

# --- 🚀 SERVER LAUNCH INSTRUCTIONS ---

# To run this server, you must be in the 'backend' folder with the venv active.

# The magical command that launches the server:
# uvicorn src.main:app --app-dir . --reload