# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 1. Initialize the FastAPI app
app = FastAPI()

# 2. CORS (Crucial!): This tells the browser it's safe for your React app 
#    (running on a different port, usually 3000) to talk to your FastAPI app (e.g., port 8000).
origins = [
    "http://localhost:3000",  # Replace with your React development URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define a simple endpoint (a "route" or URL your React app can visit)
#    This is the first endpoint we will call from React to test the connection.
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend! Connection successful, puppy! 🥳"}

# 4. Define an endpoint to receive your procedure data
@app.post("/start_procedure")
def start_procedure(procedure_data: list):
    # Here is where the real work would happen:
    # 1. Save the data to a database.
    # 2. Start a process based on the steps.
    
    # For now, we just confirm we received the data and show the first step's time.
    first_step_time = procedure_data[0]['time']
    print(f"Received {len(procedure_data)} steps. First step time: {first_step_time}")
    
    return {"status": "success", "received_first_step_time": first_step_time}

# uvicorn src.main:app --app-dir . --reload