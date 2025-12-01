import { useState } from "react";

// --- THE CHANNEL SELECTION COMPONENT ---
function ChannelSelection() {
  // 💾 STATE: This array holds the list of channels (by their ID: 1, 2, 3, etc.)
  // that the user has currently selected (toggled ON).
  const [selectedChannel, setSelectedChannel] = useState([]);

  // 📚 This simple array defines all the available channel IDs (1, 2, 3, 4).
  const channels = [1, 2, 3, 4];

  // 🔄 FUNCTION: Called every time a channel button is clicked.
  const handleToggle = (channelID) => {
    // 1. CHECK: Is this channel already in the selected list?
    if (selectedChannel.includes(channelID)) {
      // ✅ IF YES (The channel is currently ON, so we turn it OFF):
      // We use the filter method to create a NEW array that EXCLUDES the clicked channelID.
      setSelectedChannel(selectedChannel.filter((item) => item !== channelID));
    } else {
      // ❌ IF NO (The channel is currently OFF, so we turn it ON):
      // We create a NEW array by taking all the currently selected channels
      // and adding the new channelID to the end.
      setSelectedChannel([...selectedChannel, channelID]);
    }
    // NOTE: Creating a new array (via filter or [...spread]) is essential for React to update!
  };

  // --- RENDER SECTION ---

  return (
    <div
      id="channelSelection"
      className="d-flex flex-column align-items-center p-2"
    >
      {/* 🎨 MAPPING: We go through the 'channels' array (1, 2, 3, 4) to create a button for each one. */}
      {channels.map((item, index) => (
        <button
          type="button"
          key={item}
          // 💡 STYLING LOGIC: We check if the button's channel ID is in the 'selectedChannel' array.
          // If it IS included, we use the 'btn-light' class (active/ON style).
          // If it IS NOT included, we use the 'btn-dark' class (inactive/OFF style).
          className={
            selectedChannel.includes(item)
              ? "btn btn-light m-1" // ON style
              : "btn btn-dark m-1" // OFF style
          }
          onClick={() => {
            // When clicked, we call the toggle handler, passing the channel's ID (item).
            handleToggle(item);
          }}
        >
          Channel {item}
        </button>
      ))}
    </div>
  );
}
export default ChannelSelection;
