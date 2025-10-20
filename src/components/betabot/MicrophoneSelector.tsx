interface MicrophoneSelectorProps {
  selectedMicrophoneId: string;
  availableMicrophones: MediaDeviceInfo[];
  isListening: boolean;
  onMicrophoneChange: (deviceId: string) => void;
}

export function MicrophoneSelector({
  selectedMicrophoneId,
  availableMicrophones,
  isListening,
  onMicrophoneChange
}: MicrophoneSelectorProps) {
  return (
    <div className="microphone-selection-section">
      <h4>🎤 Select Your Microphone</h4>
      <select
        value={selectedMicrophoneId}
        onChange={(e) => onMicrophoneChange(e.target.value)}
        className="mic-select"
        disabled={isListening}
      >
        {availableMicrophones.length === 0 && (
          <option value="">No microphones detected</option>
        )}
        {availableMicrophones.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
