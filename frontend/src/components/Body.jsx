import { useState, useEffect } from "react";
import ChannelSelection from "./channelSelection";
import ProcedureSelection from "./procedureSelection";
import StatusDisplay from "./statusDisplay";

// --- HELPER FUNCTIONS ---
// These functions help us switch between how the computer understands time (seconds)
// and how people read time ("HH:MM:SS").

// 🕐 HELPER: Turns the "HH:MM:SS" time *string* (e.g., "01:05:30") into total *seconds* (e.g., 3930).
const timeStringToSeconds = (timeStr) => {
  // It splits the string at the colons (:) and converts them to numbers.
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    // Then calculates total seconds: Hours*3600 + Minutes*60 + Seconds.
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0; // Return 0 if the format is incorrect.
};

// 🕜 HELPER: Turns total *seconds* back into the "HH:MM:SS" time *string* for display.
const secondstoTimeString = (totalSeconds) => {
  // Finds how many full hours, minutes, and remaining seconds are in the total.
  const hours = String(Math.floor(totalSeconds / 3600));
  const minutes = String(Math.floor((totalSeconds % 3600) / 60));
  const seconds = String(totalSeconds % 60);
  // This helper makes sure numbers like '5' look like '05'.
  const pad = (num) => String(num).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
// ------------------------

function Body() {
  // --- CORE STATE (The Brain of the Procedure) ---

  // 📜 This array holds the WHOLE procedure: 5 sets of time and intensity settings (the steps).
  const [procedureList, setProcedureList] = useState([]);

  // 🧭 This number tracks WHICH step we are currently running (0 = Step 1, 1 = Step 2, etc.).
  // -1 means no procedure is active.
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // ⏱️ This number is the timer itself! It holds the remaining time for the current step in seconds.
  const [currentStepSeconds, setCurrentStepSeconds] = useState(0);

  // 🏃 This is a simple ON/OFF switch. True means the timer is counting down.
  const [isRunning, setIsRunning] = useState(false);

  // -------------------------------------------------

  // This function receives the 'list' of 5 procedure steps from ProcedureSelection.jsx
  // We change it to an ASYNC function so it can 'await' the API call.
  const startProcedure = async (list) => {
    // The list looks like this: [{time: "00:00:10", intensity: 50}, ...]

    const API_URL = "http://127.0.0.1:8000/start_procedure"; // <--- 📌 This is the exact URL for your FastAPI endpoint!

    try {
      // 1. SEND the data to your FastAPI backend
      const response = await fetch(API_URL, {
        method: "POST", // We are sending new data, so we use POST.
        headers: {
          // Tells FastAPI that the data coming is formatted as JSON.
          "Content-Type": "application/json",
        },
        // Convert the JavaScript list into a JSON string that Python can read.
        body: JSON.stringify(list),
      });

      // 2. CHECK the response status
      if (!response.ok) {
        // If the status is 400, 500, etc., show an error!
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // 3. READ the response
      const data = await response.json();
      console.log("SUCCESS! FastAPI Response:", data);

      setProcedureList(list); // Save the procedure steps into state.

      // --- 4. START FRONTEND TIMER (ONLY if API call succeeded) ---
      // This is your original logic to start the countdown.
      if (list.length > 0) {
        // Assume you have a helper to convert "HH:MM:SS" to seconds
        const initialSeconds = timeStringToSeconds(list[0].time);
        setCurrentStepIndex(0); // Start at the first step.
        setCurrentStepSeconds(initialSeconds); // Load the first step's time.
        setIsRunning(true); // Start the timer!

        // Update your state to start the timer (if you have this state):
        // setCurrentStepIndex(0);
        // setCurrentStepSeconds(initialSeconds);
        // setIsRunning(true);

        // You will put your actual state update logic here!
      }
    } catch (error) {
      // If the connection fails (e.g., FastAPI server is off), this runs.
      console.error("MOMMY CAN'T TALK TO FASTAPI:", error);
      alert(
        "🛑 Connection Error: Is your Uvicorn server running on port 8000?"
      );
    }
  };

  // 🧙‍♀️ FUNCTION: Called when a step finishes to decide what to do next.
  const advanceStep = () => {
    const nextIndex = currentStepIndex + 1; // Figure out the index of the next step.

    // 🛑 STOP CONDITION 1: Check if we have run ALL 5 steps.
    if (nextIndex >= procedureList.length) {
      setIsRunning(false); // Stop everything.
      setCurrentStepIndex(-1); // Reset step tracker.
      //console.log("Procedure Finished!");
      return; // Stop this function right here.
    }

    const nextStep = procedureList[nextIndex];
    const nextSeconds = timeStringToSeconds(nextStep.time);

    // 🛑 STOP CONDITION 2: Check if the NEXT step's time is 00:00:00.
    if (nextSeconds === 0) {
      //console.log(`Procedure stopped: Step ${nextIndex + 1} time is 00:00:00.`);
      setIsRunning(false); // Stop everything.
      setCurrentStepIndex(-1); // Reset step tracker.
      setCurrentStepSeconds(0);
      return; // Stop this function.
    }

    // ✅ ADVANCE: If checks pass, move to the next valid step.
    setCurrentStepIndex(nextIndex); // Move step tracker to the new index.
    setCurrentStepSeconds(nextSeconds); // Load the new time into the timer.
  };

  // 🪄 useEffect: The Core Timer and Step Advancement Logic
  // This function runs every time the 'isRunning' or 'currentStepIndex' changes.
  useEffect(() => {
    let intervalId;

    // Check 1: Is the timer supposed to be running AND are we on an active step?
    if (isRunning && currentStepIndex !== -1) {
      // Start the official JavaScript timer (it fires every 1000ms = 1 second).
      intervalId = setInterval(() => {
        // This is the actual countdown:
        setCurrentStepSeconds((prevSeconds) => {
          if (prevSeconds > 1) {
            return prevSeconds - 1; // Count down by 1 second.
          } else {
            // Time is zero or less!
            clearInterval(intervalId); // Stop this specific timer instance.
            setCurrentStepSeconds(0); // Make sure the display shows exactly '00:00:00'.
            advanceStep(); // ⬅️ Immediately jump to the function that checks and starts the next step.
            return 0;
          }
        });
      }, 1000);
    } else {
      // If isRunning is false (stopped, finished, or reset), stop any running timer.
      clearInterval(intervalId);
    }

    // 🧹 CLEANUP: This is VITAL! It ensures the timer stops if the Body component disappears
    // or if the dependencies change, preventing bugs.
    return () => clearInterval(intervalId);
  }, [isRunning, currentStepIndex, procedureList]);
  // Dependencies: Tells React to re-run this setup function if these values change.

  // --- RENDER SECTION ---

  // Figure out the correct intensity to show based on which step we are currently on.
  const displayIntensity =
    currentStepIndex !== -1 && procedureList[currentStepIndex]
      ? procedureList[currentStepIndex].intensity // Get intensity from the active step in the list
      : 0; // Show 0 if no step is active.

  return (
    <div className="container bg-primary text-white p-2">
      <div className="row mx-auto text-center">
        <div id="ProcedureControl" className="col-md-7 bg-secondary m-1">
          <p>Procedure Selection</p>
          {/* Passes the start function down to the ProcedureSelection component */}
          <ProcedureSelection onStart={startProcedure} />
        </div>
        <div id="channelSelection" className="col bg-secondary m-1">
          <p>Channel Selection</p>
          <ChannelSelection />
        </div>
        <div id="statusDisplay" className="col bg-secondary m-1">
          <p>Status Display</p>
          {/* Passes the final calculated display values to the StatusDisplay component */}
          <StatusDisplay
            time={secondstoTimeString(currentStepSeconds)} // Convert seconds back to HH:MM:SS
            intensity={displayIntensity}
            currentStep={currentStepIndex + 1} // Shows 1 for index 0, 2 for index 1, etc.
          />
        </div>
      </div>
    </div>
  );
}
export default Body;
