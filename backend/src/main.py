# main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from pathlib import Path
from pydantic import BaseModel
from .controller import Controller

# 1. Initialize the FastAPI app
app = FastAPI()

uv_controller = Controller()

RECIPES_PATH = Path(__file__).parent / "recipes.json"

# 2. CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC MODELS ---

class ProcedureStep(BaseModel):
    time: str
    intensity: int

class ProcedureRequest(BaseModel):
    steps: list[ProcedureStep]
    selected_channels: list[int]

class RecipeStep(BaseModel):
    time: str
    intensity: int

class SaveRecipeRequest(BaseModel):
    procedure: str
    step_count: int
    steps: list[RecipeStep]

# --- HELPERS ---

def rekey_recipes(recipes: dict) -> dict:
    values = list(recipes.values())
    return {str(i + 1): v for i, v in enumerate(values)}

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend! Connection successful"}

@app.get("/recipes")
def get_recipes():
    with open(RECIPES_PATH, "r") as f:
        return json.load(f)

@app.post("/recipes")
def save_recipe(request: SaveRecipeRequest):
    with open(RECIPES_PATH, "r") as f:
        recipes = json.load(f)
    new_key = str(len(recipes) + 1)
    recipes[new_key] = {
        "procedure": request.procedure,
        "step_count": request.step_count,
        "steps": [s.model_dump() for s in request.steps],
    }
    with open(RECIPES_PATH, "w") as f:
        json.dump(recipes, f, indent=4)
    return recipes

@app.delete("/recipes/{key}")
def delete_recipe(key: str):
    with open(RECIPES_PATH, "r") as f:
        recipes = json.load(f)
    if key not in recipes:
        raise HTTPException(status_code=404, detail="Recipe not found")
    del recipes[key]
    recipes = rekey_recipes(recipes)
    with open(RECIPES_PATH, "w") as f:
        json.dump(recipes, f, indent=4)
    return recipes

@app.post("/start_procedure")
def start_procedure(request_data: ProcedureRequest):
    received_steps = request_data.steps
    selected_channels = request_data.selected_channels
    first_step_time = received_steps[0].time
    print(f"Channels: {selected_channels} are on")
    print(f"First step time: {first_step_time}")
    print(f"First step intensity: {received_steps[0].intensity}")
    return {"status": "success", "received_first_first_step_time": first_step_time}

@app.post("/procedure/toggle")
def toggle_procedure():
    is_now_paused = uv_controller.toggle_pause()
    if is_now_paused:
        return {"status": "paused", "message": "Procedure is now PAUSED."}
    else:
        return {"status": "running", "message": "Procedure is now RUNNING."}

@app.post("/stop_procedure")
def stop_procedure():
    was_running = uv_controller.stop_procedure_signal()
    if was_running:
        return {"status": "success", "message": "Stop signal sent."}
    else:
        return {"status": "not_running", "message": "Procedure was not running when stop was requested."}

# uvicorn src.main:app --app-dir . --reload
