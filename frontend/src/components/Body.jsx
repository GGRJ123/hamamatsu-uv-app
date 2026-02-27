import { useState, useEffect } from "react";
import logo from "../assets/logo.jpg";

// --- HELPER FUNCTIONS ---

const formatTime = (timeStr) => {
  if (typeof timeStr !== "string") return "00:00:00";
  const padded = timeStr.padStart(6, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
};

const timeStringToSeconds = (timeStr) => {
  const parts = timeStr.split(":").map((p) => parseInt(p, 10));
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

const secondsToTimeString = (totalSeconds) => {
  const pad = (num) => String(num).padStart(2, "0");
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// ------------------------

const API = "http://127.0.0.1:8000";

function Body() {
  // --- PROCEDURE INPUT STATE ---
  const [stepCount, setStepCount] = useState(5);
  const [rawTime, setRawTime] = useState(() => Array(5).fill("000000"));
  const [intensity, setIntensity] = useState(() => Array(5).fill(0));
  const [selectedRecipeKey, setSelectedRecipeKey] = useState("");
  const [recipes, setRecipes] = useState({});
  const [recipeName, setRecipeName] = useState("");
  const [recipeToDelete, setRecipeToDelete] = useState("");

  // --- CORE RUNNING STATE ---
  const [procedureList, setProcedureList] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentStepSeconds, setCurrentStepSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState([0]);

  // --- FETCH RECIPES ON MOUNT ---

  useEffect(() => {
    fetch(`${API}/recipes`)
      .then((r) => r.json())
      .then((data) => setRecipes(data))
      .catch(() => console.error("Could not load recipes from backend"));
  }, []);

  // --- STEP COUNT HANDLER ---

  const handleStepCountChange = (e) => {
    const n = Math.min(20, Math.max(1, Number(e.target.value)));
    setStepCount(n);
    setRawTime((prev) => {
      const copy = [...prev];
      while (copy.length < n) copy.push("000000");
      return copy.slice(0, n);
    });
    setIntensity((prev) => {
      const copy = [...prev];
      while (copy.length < n) copy.push(0);
      return copy.slice(0, n);
    });
  };

  // --- PROCEDURE INPUT HANDLERS ---

  const handleTimeChange = (event, index) => {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    const currentRawTime = rawTime[index];

    let newRawTime;
    if (numericValue.length < 6) {
      newRawTime = "0" + currentRawTime.slice(0, 5);
    } else {
      const newDigit = numericValue.slice(-1);
      newRawTime = currentRawTime.slice(1) + newDigit;
    }

    const newTimes = [...rawTime];
    newTimes[index] = newRawTime;
    setRawTime(newTimes);
  };

  const handleIntensityChange = (event, index) => {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    const currentNumber = intensity[index];

    let finalIntensityValue;

    if (numericValue.length === 0) {
      finalIntensityValue = 0;
    } else {
      let numberValue = Number(numericValue.slice(-3));
      if (currentNumber === 100 && numericValue.length > 3) {
        finalIntensityValue = 100;
      } else if (numberValue > 100) {
        finalIntensityValue = currentNumber;
      } else {
        finalIntensityValue = numberValue;
      }
    }

    const newIntensity = [...intensity];
    newIntensity[index] = finalIntensityValue;
    setIntensity(newIntensity);
  };

  const handleRecipeChange = (event) => {
    const key = event.target.value;
    setSelectedRecipeKey(key);
    setRecipeName("");
    setRecipeToDelete("");

    if (key === "ADD" || key === "DELETE" || key === "") {
      if (key === "") {
        setRawTime(Array(stepCount).fill("000000"));
        setIntensity(Array(stepCount).fill(0));
      }
      return;
    }

    const recipe = recipes[key];
    const n = recipe.step_count;

    setStepCount(n);
    setRawTime(
      Array.from({ length: n }, (_, i) =>
        recipe.steps[i] ? recipe.steps[i].time.replace(/:/g, "") : "000000"
      )
    );
    setIntensity(
      Array.from({ length: n }, (_, i) =>
        recipe.steps[i] ? recipe.steps[i].intensity : 0
      )
    );
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      alert("Please enter a name for the recipe.");
      return;
    }
    const steps = rawTime.map((t, i) => ({
      time: formatTime(t),
      intensity: intensity[i],
    }));
    try {
      const res = await fetch(`${API}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedure: recipeName.trim(), step_count: stepCount, steps }),
      });
      const updated = await res.json();
      setRecipes(updated);
      setSelectedRecipeKey("");
      setRecipeName("");
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert("Error: Could not save recipe.");
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) {
      alert("Please select a recipe to delete.");
      return;
    }
    try {
      const res = await fetch(`${API}/recipes/${recipeToDelete}`, {
        method: "DELETE",
      });
      const updated = await res.json();
      setRecipes(updated);
      setSelectedRecipeKey("");
      setRecipeToDelete("");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      alert("Error: Could not delete recipe.");
    }
  };

  const handleStartProcedure = () => {
    const procedureList = rawTime.map((time, index) => ({
      time: formatTime(time),
      intensity: intensity[index],
    }));
    startProcedure(procedureList);
  };

  const handleToggleProcedure = async () => {
    try {
      await fetch(`${API}/procedure/toggle`, { method: "POST" });
      setIsRunning((prev) => !prev);
    } catch (error) {
      console.error("Failed to send toggle signal to server:", error);
    }
  };

  // --- CHANNEL HANDLER ---

  const handleChannelToggle = (channelNumber) => {
    setSelectedChannels((prevChannels) => {
      if (prevChannels.includes(channelNumber)) {
        return prevChannels.filter((channel) => channel !== channelNumber);
      } else {
        return [...prevChannels, channelNumber];
      }
    });
  };

  // --- PROCEDURE FUNCTIONS ---

  const startProcedure = async (list) => {
    const requestPayload = { steps: list, selected_channels: selectedChannels };
    console.log("Starting procedure with payload:", requestPayload);
    try {
      const response = await fetch(`${API}/start_procedure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("FastAPI Error:", errorData);
        throw new Error("FastAPI request failed");
      }

      setProcedureList(list);

      if (list.length > 0) {
        const initialSeconds = timeStringToSeconds(list[0].time);
        if (initialSeconds > 0) {
          setCurrentStepIndex(0);
          setCurrentStepSeconds(initialSeconds);
          setIsRunning(true);
        } else {
          setCurrentStepIndex(-1);
          setCurrentStepSeconds(0);
          setIsRunning(false);
          console.log("Procedure failed: Step 1 time is 00:00:00.");
        }
      }
    } catch (error) {
      console.error("Failed to communicate with FastAPI:", error);
      alert("Error: Could not start procedure. Is your uvicorn running on port 8000?");
    }
  };

  const advanceStep = () => {
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= procedureList.length) {
      setIsRunning(false);
      setCurrentStepIndex(-1);
      console.log("Procedure Finished!");
      return;
    }

    const nextStep = procedureList[nextIndex];
    const nextSeconds = timeStringToSeconds(nextStep.time);

    if (nextSeconds === 0) {
      console.log(`Procedure stopped: Step ${nextIndex + 1} time is 00:00:00.`);
      setIsRunning(false);
      setCurrentStepIndex(-1);
      setCurrentStepSeconds(0);
      return;
    }
    if (nextStep.intensity === 0) {
      console.log(`Procedure stopped: Step ${nextIndex + 1} intensity is set to 0.`);
      setIsRunning(false);
      setCurrentStepIndex(-1);
      setCurrentStepSeconds(0);
      return;
    }

    setCurrentStepIndex(nextIndex);
    setCurrentStepSeconds(nextSeconds);
  };

  // --- TIMER ---

  useEffect(() => {
    let intervalId;

    if (isRunning && currentStepIndex !== -1) {
      intervalId = setInterval(() => {
        setCurrentStepSeconds((prevSeconds) => {
          if (prevSeconds > 1) {
            return prevSeconds - 1;
          } else {
            clearInterval(intervalId);
            setCurrentStepSeconds(0);
            advanceStep();
            return 0;
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, currentStepIndex, procedureList]);

  // --- DISPLAY VALUES ---

  const displayIntensity =
    currentStepIndex !== -1 && procedureList[currentStepIndex]
      ? procedureList[currentStepIndex].intensity
      : 0;

  // --- RENDER ---

  return (
    <div>
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark p-2">
        <h1 className="navbar-brand">Hamamatsu UV Controller</h1>
        <a className="navbar-brand">
          <img src={logo} width={100} />
        </a>
      </nav>

      {/* Main Layout */}
      <div className="container bg-primary text-white p-2">
        <div className="row mx-auto text-center">

          {/* Procedure Selection */}
          <div id="ProcedureControl" className="col-md-7 bg-secondary m-1">
            <p>Procedure Selection</p>
            <div className="m-2">

              {/* Step Count Picker */}
              <div className="row mb-2 align-items-center">
                <label className="col-auto">Number of Steps:</label>
                <div className="col-auto">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={stepCount}
                    onChange={handleStepCountChange}
                    style={{ width: "70px" }}
                  />
                </div>
              </div>

              {/* Step Rows */}
              {Array.from({ length: stepCount }, (_, index) => (
                <div className="row mb-1 align-items-center" key={index}>
                  <label className="col-auto">Step {index + 1}</label>
                  <input
                    type="text"
                    className="col"
                    onChange={(e) => handleTimeChange(e, index)}
                    value={formatTime(rawTime[index])}
                  />
                  <input
                    type="text"
                    className="col"
                    onChange={(e) => handleIntensityChange(e, index)}
                    value={intensity[index]}
                  />
                </div>
              ))}

              {/* Controls */}
              <div className="row mt-2">
                <button type="button" className="col-3" onClick={handleStartProcedure}>
                  Start Procedure
                </button>
                <button type="button" className="col-3" onClick={handleToggleProcedure}>
                  {isRunning ? "PAUSE PROCEDURE" : "RESUME PROCEDURE"}
                </button>
                <select
                  className="formm-select col-6"
                  value={selectedRecipeKey}
                  onChange={handleRecipeChange}
                >
                  <option value="">Select Procedure Recipe</option>
                  <option value="ADD">⭐ ADD New Procedure</option>
                  <option value="DELETE">❌ DELETE Selected Procedure</option>
                  <option disabled>--- Saved Procedures ---</option>
                  {Object.keys(recipes).map((key) => (
                    <option key={key} value={key}>
                      {recipes[key]["procedure"]}
                    </option>
                  ))}
                </select>
              </div>

              {/* ADD: name input + save button */}
              {selectedRecipeKey === "ADD" && (
                <div className="row mt-2 mb-3">
                  <input
                    type="text"
                    className="col"
                    placeholder="Recipe name..."
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="col-auto btn btn-success"
                    onClick={handleSaveRecipe}
                  >
                    SAVE Current Inputs as New Recipe
                  </button>
                </div>
              )}

              {/* DELETE: pick recipe + delete button */}
              {selectedRecipeKey === "DELETE" && (
                <div className="row mt-2 mb-3">
                  <select
                    className="col"
                    value={recipeToDelete}
                    onChange={(e) => setRecipeToDelete(e.target.value)}
                  >
                    <option value="">Select recipe to delete...</option>
                    {Object.keys(recipes).map((key) => (
                      <option key={key} value={key}>
                        {recipes[key]["procedure"]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="col-auto btn btn-danger"
                    onClick={handleDeleteRecipe}
                  >
                    DELETE Selected Recipe
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Channel Selection */}
          <div id="channelSelection" className="col bg-secondary m-1">
            <p>Channel Selection</p>
            <div className="d-flex flex-column align-items-center p-2">
              {[1, 2, 3, 4].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    selectedChannels.includes(item)
                      ? "btn btn-light m-1"
                      : "btn btn-dark m-1"
                  }
                  onClick={() => handleChannelToggle(item)}
                >
                  Channel {item}
                </button>
              ))}
            </div>
          </div>

          {/* Status Display */}
          <div id="statusDisplay" className="col bg-secondary m-1">
            <p>Status Display</p>
            <div>
              <div>
                <p>Time Left:</p>
                <p>{secondsToTimeString(currentStepSeconds)}</p>
              </div>
              <div>
                <p>Current Intensity:</p>
                <p>{displayIntensity}</p>
              </div>
              <div>
                <p>Current Step:</p>
                <p>{currentStepIndex + 1}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Body;
