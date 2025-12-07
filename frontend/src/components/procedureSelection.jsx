import { useState } from "react";
import savedProcedures from "./recipes.json";

// --- TIME FORMATTING HELPER ---
// Converts a raw 6-digit number string ("001234") to a display format ("00:12:34").
const formatTime = (timeStr) => {
  if (typeof timeStr !== "string") return "00:00:00";

  // Ensure the string is 6 digits long.
  const padded = timeStr.padStart(6, "0");

  // Insert colons (HH:MM:SS).
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
};
// ------------------------------

// Accepts the 'onStart' function from the parent (Body.jsx).
function ProcedureSelection({ onStart }) {
  // --- STATE ---

  // Holds the raw 6-digit time string for all 5 steps (e.g., ["001234", ...]).
  const [rawTime, setRawTime] = useState([
    "000000",
    "000000",
    "000000",
    "000000",
    "000000",
  ]);

  // Holds the intensity number (0-100) for all 5 steps.
  const [intensity, setIntensity] = useState([0, 0, 0, 0, 0]);

  const [selectedRecipeKey, setSelectedRecipeKey] = useState("");

  // --- START FUNCTION ---

  // Called when the user clicks "Start Procedure".
  const handleStartProcedure = () => {
    // 1. Compile all steps into a list of objects (time: "HH:MM:SS", intensity: 50).
    const procedureList = rawTime.map((time, index) => ({
      time: formatTime(time),
      intensity: intensity[index],
    }));

    // 2. Pass the list UP to the parent component (Body.jsx).
    if (onStart) {
      onStart(procedureList);
    }
  };

  // --- INPUT HANDLERS ---

  // Handles typing/backspace in any of the 5 time inputs.
  const handleTimeChange = (event, index) => {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    const currentRawTime = rawTime[index];

    let newRawTime;

    // Handle Backspace: If input length decreased, shift all digits right (prepend '0').
    if (numericValue.length < 6) {
      newRawTime = "0" + currentRawTime.slice(0, 5);
    }
    // Handle Typing: If input length increased, shift all digits left (remove first, append new).
    else {
      const newDigit = numericValue.slice(-1);
      newRawTime = currentRawTime.slice(1) + newDigit;
    }

    // Update the state array for the specific index.
    const newTimes = [...rawTime];
    newTimes[index] = newRawTime;
    setRawTime(newTimes);
  };

  // Handles changes in any of the 5 intensity inputs (limits input to 0-100).
  const handleIntensityChange = (event, index) => {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    const currentNumber = intensity[index];

    let finalIntensityValue;

    if (numericValue.length === 0) {
      // If user deletes input, set value to 0.
      finalIntensityValue = 0;
    } else {
      let numberValue = Number(numericValue.slice(-3));

      // Limit Rule 1: If value is 100 and user keeps typing, stay at 100.
      if (currentNumber === 100 && numericValue.length > 3) {
        finalIntensityValue = 100;
      }
      // Limit Rule 2: If typed number exceeds 100, use the last valid number.
      else if (numberValue > 100) {
        finalIntensityValue = currentNumber;
      }
      // Accept the new valid number.
      else {
        finalIntensityValue = numberValue;
      }
    }

    // Update the state array for the specific index.
    const newIntensity = [...intensity];
    newIntensity[index] = finalIntensityValue;
    setIntensity(newIntensity);
  };

  const handleRecipeChange = (event) => {
    const key = event.target.value;
    setSelectedRecipeKey(key);

    if (key === "") {
      setRawTime(["000000", "000000", "000000", "000000", "000000"]);
      setIntensity([0, 0, 0, 0, 0]);
      return;
    }

    const recipe = savedProcedures[key];

    const newIntensities = [
      recipe["step_1_value"],
      recipe["step_2_value"],
      recipe["step_3_value"],
      recipe["step_4_value"],
      recipe["step_5_value"],
    ];

    const newTimes = [
      recipe["step_1_time"].replace(/:/g, ""),
      recipe["step_2_time"].replace(/:/g, ""),
      recipe["step_3_time"].replace(/:/g, ""),
      recipe["step_4_time"].replace(/:/g, ""),
      recipe["step_5_time"].replace(/:/g, ""),
    ];

    setIntensity(newIntensities);
    setRawTime(newTimes);
  };

  const handleStopProcedure = async () => {
    try {
      await fetch("http://localhost:8000/stop_procedure", {
        method: "POST",
      });
      console.log("Stop procedure request sent.");
    } catch (error) {
      console.error("Failed to send stop signal to server:", error);
    }
  };
  // --- RENDER SECTION ---

  return (
    <div className="m-2">
      <div className="row">
        {/* Render 5 Time Inputs */}
        {rawTime.map((item, index) => (
          <input
            key={index}
            type="text"
            className="col"
            onChange={(e) => handleTimeChange(e, index)}
            // Display the time in HH:MM:SS format.
            value={formatTime(item)}
          />
        ))}
      </div>

      <div className="row">
        {/* Render 5 Intensity Inputs */}
        {intensity.map((item, index) => (
          <input
            key={index}
            type="text"
            className="col"
            onChange={(e) => handleIntensityChange(e, index)}
            // Display the saved number (0-100).
            value={item}
          />
        ))}
      </div>

      <div className="row">
        {/* Start Button */}
        <button type="button" className="col-3" onClick={handleStartProcedure}>
          Start Procedure
        </button>
        {/* Stop Button (currently inactive) */}
        <button type="button" className="col-3" onClick={handleStopProcedure}>
          Stop Procedure
        </button>
        <select
          className="formm-select col-4"
          value={selectedRecipeKey}
          onChange={handleRecipeChange}
        >
          <option selected>Preset Recipes</option>
          {Object.keys(savedProcedures).map((key) => (
            <option key={key} value={key}>
              {savedProcedures[key]["procedure"]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ProcedureSelection;
