interface LiveTranscriptProps {
  transcript: string;
}

export function LiveTranscript({ transcript }: LiveTranscriptProps) {
  return (
    <div className="transcript-section">
      <h4>Latest Transcript</h4>
      <div className="transcript-box">
        {transcript}
      </div>
    </div>
  );
}
