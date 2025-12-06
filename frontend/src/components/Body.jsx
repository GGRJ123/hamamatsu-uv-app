import { useState, useEffect } from "react";
import ChannelSelection from "./channelSelection";
import ProcedureSelection from "./procedureSelection";
import StatusDisplay from "./statusDisplay";

// --- HELPER FUNCTIONS ---

// Converts "HH:MM:SS" time string (e.g., "01:05:30") into total seconds.
const timeStringToSeconds = (timeStr) => {
  const parts = timeStr.split(":").map((p) => parseInt(p, 10));
  // Calculation: Hours*3600 + Minutes*60 + Seconds.
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

// Converts total seconds back into the "HH:MM:SS" time string for display.
const secondstoTimeString = (totalSeconds) => {
  const hours = String(Math.floor(totalSeconds / 3600));
  const minutes = String(Math.floor((totalSeconds % 3600) / 60));
  const seconds = String(totalSeconds % 60);
  // Ensures single digits (like '5') display as '05'.
  const pad = (num) => String(num).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
// ------------------------

function Body() {
  // --- CORE STATE (Application Data) ---

  // Holds the list of steps: time and intensity settings.
  const [procedureList, setProcedureList] = useState([]);

  // Tracks the current step index (0 for step 1, -1 for inactive).
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Holds the remaining time for the current step, in seconds.
  const [currentStepSeconds, setCurrentStepSeconds] = useState(0);

  // ON/OFF switch for the timer.
  const [isRunning, setIsRunning] = useState(false);

  // Tracks which UV channels (1, 2, 3, 4) the user has selected.
  const [selectedChannels, setSelectedChannels] = useState([0]);

  // --- CHANNEL SELECTION FUNCTION ---

  // Manages adding or removing a channel from the selected list.
  const handleChannelToggle = (channelNumber) => {
    setSelectedChannels((prevChannels) => {
      if (prevChannels.includes(channelNumber)) {
        // Channel is already selected: remove it (filter).
        return prevChannels.filter((channel) => channel !== channelNumber);
      } else {
        // Channel is not selected: add it.
        return [...prevChannels, channelNumber];
      }
    });
  };

  // --- PROCEDURE FUNCTIONS ---

  // Called by the "Start Procedure" button.
  const startProcedure = (list) => {
    // This is where the FastAPI call will eventually go.

    // 1. Save the full list of steps.
    setProcedureList(list);

    if (list.length > 0) {
      const initialSeconds = timeStringToSeconds(list[0].time);

      // Start the timer only if the first step's time is not zero.
      if (initialSeconds > 0) {
        setCurrentStepIndex(0); // Start at step 1.
        setCurrentStepSeconds(initialSeconds); // Load time.
        setIsRunning(true); // Turn timer ON.
      } else {
        // If first step time is zero, reset everything.
        setCurrentStepIndex(-1);
        setCurrentStepSeconds(0);
        setIsRunning(false);
        console.log("Procedure failed: Step 1 time is 00:00:00.");
      }
    }
  };

  // Called when the current step finishes counting down.
  const advanceStep = () => {
    const nextIndex = currentStepIndex + 1;

    // Check 1: Stop if all steps are finished.
    if (nextIndex >= procedureList.length) {
      setIsRunning(false);
      setCurrentStepIndex(-1);
      console.log("Procedure Finished!");
      return;
    }

    const nextStep = procedureList[nextIndex];
    const nextInensity = nextStep.intensity;
    const nextSeconds = timeStringToSeconds(nextStep.time);

    // Check 2: Stop if the next step's time is 00:00:00.
    if (nextSeconds === 0) {
      console.log(`Procedure stopped: Step ${nextIndex + 1} time is 00:00:00.`);
      setIsRunning(false);
      setCurrentStepIndex(-1);
      setCurrentStepSeconds(0);
      return;
    }
    if (nextInensity === 0) {
      console.log(
        `Procedure stopped: Step ${nextIndex + 1} intensity is set to 0.`
      );
      setIsRunning(false);
      setCurrentStepIndex(-1);
      setCurrentStepSeconds(0);
      return;
    }

    // Advance to the next valid step.
    setCurrentStepIndex(nextIndex);
    setCurrentStepSeconds(nextSeconds);
  };

  // --- useEffect: The Core Timer Logic ---

  // Runs the countdown and step advancement every second.
  useEffect(() => {
    let intervalId;

    if (isRunning && currentStepIndex !== -1) {
      // Start the JavaScript timer.
      intervalId = setInterval(() => {
        setCurrentStepSeconds((prevSeconds) => {
          if (prevSeconds > 1) {
            return prevSeconds - 1; // Count down.
          } else {
            // Time is zero: stop timer, reset time, and advance to next step.
            clearInterval(intervalId);
            setCurrentStepSeconds(0);
            advanceStep();
            return 0;
          }
        });
      }, 1000); // Runs every 1 second
    } else {
      // If timer is stopped, clear any running timer.
      clearInterval(intervalId);
    }

    // Cleanup function: ensures the timer stops if the component is removed.
    return () => clearInterval(intervalId);
  }, [isRunning, currentStepIndex, procedureList]);
  // Dependencies: Reruns this effect when these values change.

  // --- RENDER SECTION ---

  // Calculates the current intensity for display.
  const displayIntensity =
    currentStepIndex !== -1 && procedureList[currentStepIndex]
      ? procedureList[currentStepIndex].intensity
      : 0;

  return (
    <div className="container bg-primary text-white p-2">
      <div className="row mx-auto text-center">
        <div id="ProcedureControl" className="col-md-7 bg-secondary m-1">
          <p>Procedure Selection</p>
          {/* Pass the start function down */}
          <ProcedureSelection onStart={startProcedure} />
        </div>
        <div id="channelSelection" className="col bg-secondary m-1">
          <p>Channel Selection</p>
          {/* Pass the state and the toggler function down */}
          <ChannelSelection
            onChannelToggle={handleChannelToggle}
            currentSelection={selectedChannels}
          />
        </div>
        <div id="statusDisplay" className="col bg-secondary m-1">
          <p>Status Display</p>
          {/* Pass the final calculated display values */}
          <StatusDisplay
            time={secondstoTimeString(currentStepSeconds)}
            intensity={displayIntensity}
            currentStep={currentStepIndex + 1}
          />
        </div>
      </div>
    </div>
  );
}
export default Body;
