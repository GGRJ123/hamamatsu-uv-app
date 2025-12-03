# --- src/main.py: THE FASTAPI COMMAND CENTER ---

# 1. CORE IMPORTS & SETUP
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import time             # Needed for time.sleep() in the background thread
import threading        # 🌟 Needed to run the long procedure without blocking the server 🌟
from src.controller import Controller

# ----------------------------------------------------------------------
# 2. DATA BLUEPRINT: The Pydantic Model
# This defines the expected structure of one step from the frontend.
class ProcedureStep(BaseModel):
    time: str
    intensity: int

class ProcedureRequest(BaseModel):
    steps: list[ProcedureStep]
    selected_channels: list[int]

# ----------------------------------------------------------------------
# 3. SERVER SETUP & SECURITY (CORS)
app = FastAPI()

origins = [
    "http://localhost:5173",  # Trust your React development server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------------
# 4. HARDWARE INITIALIZATION (Runs ONCE at Server Startup)
try:
    # Initialize the Controller. It will either connect or go into SAFE MODE.
    UV_CONTROLLER = Controller()
    
    if UV_CONTROLLER.is_connected:
        print("✨ UV Controller initialized and connected to hardware!")
    else:
        print("🟡 UV Controller initialized in SAFE MODE (Hardware not plugged in).")

except Exception as e:
    print(f"🛑 CRITICAL ERROR: Could not create Controller instance: {e}")
    UV_CONTROLLER = None

# ----------------------------------------------------------------------
# 5. BACKGROUND WORKER FUNCTION (The Non-Blocking Procedure Runner)

# This function contains the entire UV sequence and runs in a separate thread.
def run_procedure_in_background(uv_controller: Controller, request_data: ProcedureRequest):
    
    procedure_data = request_data.steps
    selected_channels = request_data.selected_channels
    
    total_steps = len(procedure_data)
    # ⚠️ Adjust this list if the frontend sends the selected channels ⚠️
    selected_channels = [1, 2, 3, 4] 
    
    # START PROCEDURE NOTIFICATION
    print(f"✅ PROCEDURE STARTING: Initiating sequence with {total_steps} steps.")

    for index, step in enumerate(procedure_data):
        step_number = index + 1
        
        # 1. Stop Condition: If intensity is 0 or less, break the loop
        if step.intensity <= 0:
            print(f"🛑 Stopping procedure at Step {step_number}: Intensity is zero.")
            break 
        
        # 2. Convert Time
        try:
            time_s = float(step.time)
        except ValueError:
            time_s = 1.0 # Default time

        # 3. NOTIFY START OF STEP
        print(f"▶️ STEP {step_number} STARTED: Intensity {step.intensity} for {time_s} seconds.")

        # 4. HARDWARE COMMAND: Set Intensity (The first action)
        uv_controller.func_set_uv_intensity(step.intensity)
        
        # 5. HARDWARE COMMAND: Turn UV ON (The second action)
        uv_controller.func_uv_on(selected_channels)
        
        # 6. TIMING: Wait for the required time (This is time.sleep(), safe in this thread!)
        print(f"😴 Thread is sleeping for {time_s} seconds...")
        time.sleep(time_s) 
        
    # PROCEDURE END ACTIONS
    uv_controller.func_uv_off() # Always turn UV OFF for safety!
    print("🛑 PROCEDURE ENDED: All steps complete. System idle.")

# ----------------------------------------------------------------------
# 6. API ENDPOINTS (The "Phone Numbers" your React app calls)

# GET Endpoint: Server Health Check
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend! Connection successful, puppy! 🥳"}

# POST Endpoint: Start the Procedure Command
@app.post("/start_procedure")
def start_procedure(requesst_data: ProcedureRequest):
    
    # A. Check initialization status
    if UV_CONTROLLER is None or not UV_CONTROLLER.is_connected:
        return {"status": "error", "message": "Server is in SAFE MODE. Hardware not available."}
    
    # B. LAUNCH THE THREAD: The long task is passed to a background thread!
    try:
        worker_thread = threading.Thread(
            target=run_procedure_in_background,
            args=(UV_CONTROLLER, requesst_data)
        )
        worker_thread.start() # Start the thread immediately!
        
    except Exception as e:
        print(f"🛑 THREADING ERROR: Could not start background procedure: {e}")
        return {"status": "error", "message": "Failed to start background procedure."}

    # C. Send an IMMEDIATE success message back to React! Server is NOT blocked.
    return {
        "status": "success", 
        "message": "Procedure initiated successfully in background thread."
    }