import { useState, useRef, useCallback, useEffect } from "react";

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Rachel — natural, clear, great for demo narration
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const TTS_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

/**
 * useTTS(text)
 *
 * Returns:
 *   play()       — fetch audio if needed, then play (or pause if already playing)
 *   stop()       — stop and reset to beginning
 *   isLoading    — true while fetching from ElevenLabs
 *   isPlaying    — true while audio is actively playing
 *   hasAudio     — true once audio has been fetched successfully
 *   error        — string error message, or null
 *   clearError() — dismiss the error
 */
export function useTTS(text) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  // Track the text for which audio was fetched so we refetch on text change
  const fetchedForTextRef = useRef(null);

  // Cleanup blob URL and audio element on unmount or text change
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    fetchedForTextRef.current = null;
    setIsPlaying(false);
    setHasAudio(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // Reset when text changes
  useEffect(() => {
    if (fetchedForTextRef.current && fetchedForTextRef.current !== text) {
      cleanup();
    }
  }, [text, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const fetchAudio = useCallback(async () => {
    if (!ELEVENLABS_API_KEY) {
      setError("ElevenLabs API key not configured.");
      return null;
    }
    if (!text || !text.trim()) {
      setError("No text to speak.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.1,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        const msg = await response.text().catch(() => "Unknown error");
        throw new Error(`ElevenLabs ${response.status}: ${msg}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error("Received empty audio response.");

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      fetchedForTextRef.current = text;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onerror = () => {
        setError("Audio playback failed.");
        setIsPlaying(false);
      };

      setHasAudio(true);
      return audio;
    } catch (err) {
      setError(err.message || "Failed to generate audio.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  const play = useCallback(async () => {
    // Toggle pause if already playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Resume if paused and audio already loaded
    if (!isPlaying && hasAudio && audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        setError("Playback blocked — try clicking play again.");
      }
      return;
    }

    // Fetch fresh audio
    const audio = await fetchAudio();
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      setError("Playback blocked by browser — try clicking play again.");
    }
  }, [isPlaying, hasAudio, fetchAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    play,
    stop,
    isLoading,
    isPlaying,
    hasAudio,
    error,
    clearError,
  };
}
