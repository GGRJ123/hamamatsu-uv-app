import { useState } from "react";

// --- THE CHANNEL SELECTION COMPONENT ---
function ChannelSelection({ onChannelToggle, currentSelection }) {
  // Defines all available channel IDs.
  const channels = [1, 2, 3, 4];

  // --- RENDER SECTION ---

  return (
    <div
      id="channelSelection"
      className="d-flex flex-column align-items-center p-2"
    >
      {/* Create a button for each channel (1, 2, 3, 4). */}
      {channels.map((item) => (
        <button
          type="button"
          key={item}
          // Styling: Set the button class based on whether it is in the 'selectedChannel' array.
          className={
            currentSelection.includes(item)
              ? "btn btn-light m-1" // ON style
              : "btn btn-dark m-1" // OFF style
          }
          onClick={() => {
            // Call the toggle handler with the channel's ID.
            onChannelToggle(item);
          }}
        >
          Channel {item}
        </button>
      ))}
    </div>
  );
}
export default ChannelSelection;
