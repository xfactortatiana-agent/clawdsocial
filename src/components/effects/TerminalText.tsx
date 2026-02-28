"use client";

import { useEffect, useState } from "react";

const phrases = [
  "Generating content...",
  "Analyzing engagement patterns...",
  "Optimizing post timing...",
  "Training brand voice model...",
  "Connecting to X API...",
  "Syncing with Shinra...",
  "Scheduling posts...",
  "Monitoring trends...",
];

export function TerminalText() {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhrase];
    
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayText.length < phrase.length) {
            setDisplayText(phrase.slice(0, displayText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentPhrase((prev) => (prev + 1) % phrases.length);
          }
        }
      },
      isDeleting ? 30 : 50
    );

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPhrase]);

  return (
    <div className="font-mono text-sm text-cyan-400/80">
      <span className="text-violet-400">$</span> {displayText}
      <span className="animate-pulse">▊</span>
    </div>
  );
}
