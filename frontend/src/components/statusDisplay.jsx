function StatusDisplay({ time, intensity, currentStep }) {
  const displayTime = time || "00:00:00";
  const displayIntensity = intensity || 0;

  return (
    <div>
      <div>
        <p>Time Left: </p>
        <p>{displayTime}</p>
      </div>
      <div>
        <p>Current Intensity: </p>
        <p>{displayIntensity}</p>
      </div>
      <div>
        <p>Current Step: </p>
        <p>{currentStep}</p>
      </div>
    </div>
  );
}

export default StatusDisplay;
