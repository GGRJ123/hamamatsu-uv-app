import { useState } from "react";
// StatusDisplay is not imported here because the parent component (Body.jsx) handles rendering it.

// --- TIME FORMATTING HELPER ---
// ⬅️ FLOW STEP 1: The Helper Function
// This function takes a raw 6-digit number string (like "001234")
// and makes it look pretty for the user ("00:12:34").
const formatTime = (timeStr) => {
  // Check if what we're formatting is actually a string.
  if (typeof timeStr !== "string") return "00:00:00";

  // Ensure the number string is always 6 digits long by adding leading zeros if needed.
  const padded = timeStr.padStart(6, "0");

  // Use string slicing to insert the colons (HH:MM:SS).
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
};
// ------------------------------

// We accept the 'onStart' function that the parent (Body.jsx) gave us.
function ProcedureSelection({ onStart }) {
  // --- STATE: WHERE THE USER'S INPUTS ARE STORED ---

  // ⬅️ FLOW STEP 2: Central State for ALL Timers
  // This array holds the raw 6-digit time string for EACH of the 5 inputs (Steps 1-5).
  // This format (e.g., "001234") is easy to manipulate for shifting digits.
  const [rawTime, setRawTime] = useState([
    "000000",
    "000000",
    "000000",
    "000000",
    "000000",
  ]);

  // This array holds the intensity number (0-100) for EACH of the 5 steps.
  const [intensity, setIntensity] = useState([0, 0, 0, 0, 0]);

  // -------------------------------------------------

  // 🚀 FUNCTION: Called when the user clicks the "Start Procedure" button.
  const handleStartProcedure = () => {
    // 1. Compile the full list of steps into a clean array of objects.
    // We go through all 5 times and pair each one with its intensity.
    const procedureList = rawTime.map((time, index) => ({
      // We format the raw time string (e.g., "001234") into "00:12:34" for the Body component.
      time: formatTime(time),
      intensity: intensity[index], // Use the corresponding intensity number.
    }));

    // 2. Pass the entire structured list UP to the Body component using the 'onStart' prop.
    // The Body component (the brain) will use this list to manage the countdown.
    if (onStart) {
      onStart(procedureList);
    }
  };

  // ------------------- INPUT HANDLERS -------------------

  // ⬅️ FLOW STEP 3: The Universal Change Handler for TIME
  // Runs every time the user types or presses backspace in ANY of the 5 time inputs.
  const handleTimeChange = (event, index) => {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, ""); // Clean the input, keeping only numbers.
    const currentRawTime = rawTime[index]; // Get the time string for THIS specific input.

    let newRawTime;

    // --- Logic to Shift/Backspace ---
    // If the cleaned number is shorter than 6 digits, the user pressed BACKSPACE.
    if (numericValue.length < 6) {
      // ⬅️ FLOW STEP 3A: Handle Backspace
      // To simulate a backspace, we take the first 5 digits of the current time
      // and put a '0' in front. This shifts all digits one place to the right.
      newRawTime = "0" + currentRawTime.slice(0, 5);
    }
    // --- Logic to Type/Replace ---
    // If the cleaned number is 6 or longer, the user TYPED a new digit.
    else {
      // ⬅️ FLOW STEP 3B: Handle Typing
      const newDigit = numericValue.slice(-1); // Get the LAST digit the user typed.

      // We take the current 6-digit string, remove the first digit (slice(1)),
      // and add the new digit at the end. This makes the input act like a queue (FIFO).
      newRawTime = currentRawTime.slice(1) + newDigit;
    }

    // ⬅️ FLOW STEP 4: Update the State Array
    const newTimes = [...rawTime]; // 1. Create a brand new copy of the full time array.
    newTimes[index] = newRawTime; // 2. Update ONLY the element for the input that changed.
    setRawTime(newTimes); // 3. Tell React to save the new array and re-render.
  };

  // ⬅️ FLOW STEP 3: The Universal Change Handler for INTENSITY (0-100)
  const handleIntensityChange = (event, index) => {
    const value = event.target.value;

    // 🧹 Clean Up: Remove anything that's NOT a number.
    const numericValue = value.replace(/[^0-9]/g, "");

    const currentNumber = intensity[index]; // Get the currently saved intensity.

    let finalIntensityValue;

    if (numericValue.length === 0) {
      // 🗑️ Backspace Action: If the user deletes everything, reset to 0.
      finalIntensityValue = 0;
    } else {
      // 🔢 Typing Action: The user is entering numbers.
      let digitsString = numericValue.slice(-3); // Only care about the last 3 digits (Max 100).

      // --- Special Case: User types a digit when the value is 0 ---
      if (currentNumber === 0 && numericValue.length === 1) {
        digitsString = numericValue.slice(-1); // Use only the new digit.
      }

      let numberValue = Number(digitsString);

      // --- 🛑 The Max Limit Logic (Stopping at 100) ---
      if (currentNumber === 100 && numericValue.length > 3) {
        // 🛑 Rule 1: If it's already 100, ignore any new typing.
        finalIntensityValue = 100;
      } else if (numberValue > 100) {
        // 🛑 Rule 2: If the typed number is too big (e.g., 200), revert to the last saved number.
        finalIntensityValue = currentNumber;
      } else {
        // ✅ Accept: The number is 100 or less, so it's a good number!
        finalIntensityValue = numberValue;
      }
    }

    // 🔄 Update State: We are ready to save the new valid number.
    const newIntensity = [...intensity]; // Copy the intensity array.
    newIntensity[index] = finalIntensityValue; // Update ONLY the element that changed.
    setIntensity(newIntensity); // Save the new array.
  };

  // ------------------- RENDER SECTION -------------------

  return (
    <div className="m-2">
      <div className="row">
        {/* ⬅️ FLOW STEP 5: Rendering the TIME Inputs */}
        {/* We map over the state array (rawTime) to create 5 separate input fields. */}
        {rawTime.map((item, index) => (
          <input
            key={index} // Key helps React keep track of each input.
            type="text"
            className="col"
            // When the user types, call the handler, passing the event and the specific index (0-4).
            onChange={(e) => handleTimeChange(e, index)}
            // ⬅️ FLOW STEP 6: Displaying the Correct Value
            // The value is the *formatted* time string (with colons), ensuring the user sees "00:00:00".
            value={formatTime(item)}
          />
        ))}
      </div>

      <div className="row">
        {/* Rendering the INTENSITY Inputs */}
        {intensity.map((item, index) => (
          <input
            key={index}
            type="text"
            className="col"
            onChange={(e) => handleIntensityChange(e, index)}
            value={item} // Displays the saved number (0-100).
          />
        ))}
      </div>

      <div className="row">
        {/* The Start Button is connected to the function that sends the data to Body.jsx */}
        <button type="button" className="col-3" onClick={handleStartProcedure}>
          Start Procedure
        </button>
        {/* This button doesn't do anything yet, but it's ready for the next challenge! */}
        <button type="button" className="col-3">
          Stop Procedure
        </button>
      </div>
    </div>
  );
}
export default ProcedureSelection;
