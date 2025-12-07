# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from .controller import Controller

# 1. Initialize the FastAPI app
app = FastAPI()

uv_controller = Controller()    

# 2. CORS (Crucial!): This tells the browser it's safe for your React app 
#    (running on a different port, usually 3000) to talk to your FastAPI app (e.g., port 8000).
origins = [
    "http://localhost:5173",  # Replace with your React development URL
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcedureStep(BaseModel):
    time: str
    intensity: int

class ProcedureRequest(BaseModel):
    steps: list[ProcedureStep]
    selected_channels: list[int]

# 3. Define a simple endpoint (a "route" or URL your React app can visit)
#    This is the first endpoint we will call from React to test the connection.
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend! Connection successful"}

# 4. Define an endpoint to receive your procedure data
@app.post("/start_procedure")
def start_procedure(request_data: ProcedureRequest):
    
    received_steps = request_data.steps
    selected_channels = request_data.selected_channels

    first_step_time = received_steps[0].time

    print(f"Channels: {selected_channels} are on")
    print(f"First step time: {first_step_time}")
    print(f"First step intensity: {received_steps[0].intensity}")

    return {"status": "success", "received_first_first_step_time": first_step_time}

@app.post("/stop_procedure")
def stop_procedure():
    was_running = uv_controller.stop_procedure_signal()
    if was_running:
        # If the procedure was running, tell the user we sent the signal.
        return {"status": "success", "message": "Stop signal sent."}
    else:
        # If it wasn't running, return success anyway, just with a different message.
        return {"status": "not_running", "message": "Procedure was not running when stop was requested."}
# uvicorn src.main:app --app-dir . --reload