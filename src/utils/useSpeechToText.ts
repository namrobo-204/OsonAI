import { useState, useRef, useEffect, useCallback } from "react";

export interface SpeechLanguage {
  code: string;
  name: string;
  flag: string;
}

export interface AudioInputDevice {
  deviceId: string;
  label: string;
  groupId?: string;
}

export const SUPPORTED_STT_LANGUAGES: SpeechLanguage[] = [
  { code: "uz-UZ", name: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru-RU", name: "Русский", flag: "🇷🇺" },
  { code: "en-US", name: "English", flag: "🇺🇸" },
];

export interface UseSpeechToTextOptions {
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  defaultLang?: string;
}

const STORAGE_KEY_DEVICE = "oson_stt_device_id";
const STORAGE_KEY_SENSITIVITY = "oson_stt_sensitivity";
const STORAGE_KEY_THRESHOLD = "oson_stt_threshold";
const STORAGE_KEY_NOISE_SUPP = "oson_stt_noise_suppression";
const STORAGE_KEY_ECHO_CANCEL = "oson_stt_echo_cancellation";

export function useSpeechToText(options?: UseSpeechToTextOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>(options?.defaultLang || "uz-UZ");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings State: Device, Sensitivity & Noise Gate Threshold
  const [audioDevices, setAudioDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEVICE) || "";
    } catch {
      return "";
    }
  });

  const [sensitivity, setSensitivityState] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_SENSITIVITY);
      return val ? Math.max(50, Math.min(200, parseInt(val, 10))) : 100;
    } catch {
      return 100;
    }
  });

  const [threshold, setThresholdState] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_THRESHOLD);
      return val !== null ? Math.max(0, Math.min(50, parseInt(val, 10))) : 15;
    } catch {
      return 15;
    }
  });

  const [noiseSuppression, setNoiseSuppressionState] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_NOISE_SUPP);
      return val !== null ? val === "true" : true;
    } catch {
      return true;
    }
  });

  const [echoCancellation, setEchoCancellationState] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_ECHO_CANCEL);
      return val !== null ? val === "true" : true;
    } catch {
      return true;
    }
  });

  // Mic test mode
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testAudioLevel, setTestAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Test microphone refs
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAudioContextRef = useRef<AudioContext | null>(null);
  const testGainNodeRef = useRef<GainNode | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);

  // Keep options in ref to avoid recreation
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Setters with persistent localStorage
  const setSelectedDeviceId = useCallback((id: string) => {
    setSelectedDeviceIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY_DEVICE, id);
    } catch {}
  }, []);

  const setSensitivity = useCallback((val: number) => {
    const clamped = Math.max(50, Math.min(200, val));
    setSensitivityState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_SENSITIVITY, String(clamped));
    } catch {}

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped / 100;
    }
    if (testGainNodeRef.current) {
      testGainNodeRef.current.gain.value = clamped / 100;
    }
  }, []);

  const setThreshold = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(50, val));
    setThresholdState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_THRESHOLD, String(clamped));
    } catch {}
  }, []);

  const setNoiseSuppression = useCallback((val: boolean) => {
    setNoiseSuppressionState(val);
    try {
      localStorage.setItem(STORAGE_KEY_NOISE_SUPP, String(val));
    } catch {}
  }, []);

  const setEchoCancellation = useCallback((val: boolean) => {
    setEchoCancellationState(val);
    try {
      localStorage.setItem(STORAGE_KEY_ECHO_CANCEL, String(val));
    } catch {}
  }, []);

  const resetSettings = useCallback(() => {
    setSelectedDeviceId("");
    setSensitivity(100);
    setThreshold(15);
    setNoiseSuppression(true);
    setEchoCancellation(true);
  }, [setSelectedDeviceId, setSensitivity, setThreshold, setNoiseSuppression, setEchoCancellation]);

  // Audio device enumeration
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Mikrofon ${index + 1}`,
          groupId: d.groupId,
        }));
      setAudioDevices(audioInputs);
    } catch (err) {
      console.warn("Could not enumerate audio devices:", err);
    }
  }, []);

  useEffect(() => {
    refreshDevices();

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      const handleDeviceChange = () => {
        refreshDevices();
      };
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      };
    }
  }, [refreshDevices]);

  // Stop mic test
  const stopMicTest = useCallback(() => {
    setIsTestingMic(false);
    if (testAnimFrameRef.current) {
      cancelAnimationFrame(testAnimFrameRef.current);
      testAnimFrameRef.current = null;
    }
    if (testAudioContextRef.current) {
      try {
        testAudioContextRef.current.close();
      } catch {}
      testAudioContextRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    testGainNodeRef.current = null;
    setTestAudioLevel(0);
  }, []);

  // Start mic test
  const startMicTest = useCallback(async () => {
    stopMicTest();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          noiseSuppression,
          echoCancellation,
          autoGainControl: true,
        },
      });
      testStreamRef.current = stream;
      setIsTestingMic(true);

      // Refresh devices to get real labels after permission
      refreshDevices();

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      testAudioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = sensitivity / 100;
      testGainNodeRef.current = gainNode;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(gainNode);
      gainNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!testAudioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setTestAudioLevel(normalized);

        testAnimFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      console.error("Mic test error:", err);
      stopMicTest();
    }
  }, [selectedDeviceId, noiseSuppression, echoCancellation, sensitivity, refreshDevices, stopMicTest]);

  const toggleMicTest = useCallback(() => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      startMicTest();
    }
  }, [isTestingMic, stopMicTest, startMicTest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
      stopMicTest();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = sensitivity / 100;
      gainNodeRef.current = gainNode;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(gainNode);
      gainNode.connect(analyser);

      // Create destination stream so MediaRecorder captures audio with gain applied
      const destination = audioCtx.createMediaStreamDestination();
      gainNode.connect(destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
      return destination.stream;
    } catch (e) {
      console.warn("AudioContext visualizer error:", e);
      return null;
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string) || "";
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = useCallback(async (langOverride?: string) => {
    // If mic testing is active, stop it before starting actual recording
    stopMicTest();

    const langToUse = langOverride || selectedLang;
    setErrorMsg(null);
    setTranscript("");
    setInterimTranscript("");
    setDuration(0);
    audioChunksRef.current = [];

    // 1. Request microphone access with preferred device & constraints
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Brauzeringiz mikrofondan audio yozishni qo'llab-quvvatlamaydi.");
      }

      const audioConstraints: MediaTrackConstraints = {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        noiseSuppression,
        echoCancellation,
        autoGainControl: true,
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (deviceErr) {
        // If specific deviceId failed (e.g. disconnected), fallback to default audio
        if (selectedDeviceId) {
          console.warn("Preferred device unavailable, falling back to default:", deviceErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              noiseSuppression,
              echoCancellation,
              autoGainControl: true,
            },
          });
        } else {
          throw deviceErr;
        }
      }

      streamRef.current = stream;
      // Refresh devices now that permission is definitely granted
      refreshDevices();
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalarida mikrofonga ruxsat bering.");
      } else {
        setErrorMsg("Mikrofonni ishga tushirib bo'lmadi: " + (err.message || "noma'lum xatolik"));
      }
      return false;
    }

    setIsRecording(true);

    // 2. Start duration timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    // 3. Start audio level visualizer and get gain-processed stream
    const processedStream = startAudioVisualizer(stream);

    // 4. Setup MediaRecorder for universal backend STT fallback
    try {
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/wav",
      ];
      let supportedType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      // Prefer recording from gain-boosted stream if available
      const streamToRecord = processedStream && processedStream.getAudioTracks().length > 0
        ? processedStream
        : stream;

      const mediaRecorder = new MediaRecorder(
        streamToRecord,
        supportedType ? { mimeType: supportedType } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Collect data chunks every 250ms
    } catch (mrError) {
      console.warn("MediaRecorder initialization warning:", mrError);
    }

    // 5. Setup Web Speech Recognition for real-time live typing
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langToUse;
        recognition.maxAlternatives = 1;

        let accumulatedFinal = "";

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              accumulatedFinal += (accumulatedFinal ? " " : "") + res[0].transcript.trim();
            } else {
              currentInterim += res[0].transcript;
            }
          }

          setTranscript(accumulatedFinal);
          setInterimTranscript(currentInterim);

          const fullCurrentText = (accumulatedFinal + (currentInterim ? " " + currentInterim : "")).trim();
          if (optionsRef.current?.onTranscriptChange && fullCurrentText) {
            optionsRef.current.onTranscriptChange(fullCurrentText);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("SpeechRecognition event warning:", e.error);
          if (e.error === "not-allowed") {
            setErrorMsg("Brauzer nutqni tanishga ruxsat bermadi.");
          }
        };

        recognition.onend = () => {
          if (recognitionRef.current && isRecording) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognition.start();
      } catch (recInitError) {
        console.warn("SpeechRecognition could not be started, relying on MediaRecorder fallback:", recInitError);
      }
    }

    return true;
  }, [
    selectedLang,
    selectedDeviceId,
    noiseSuppression,
    echoCancellation,
    sensitivity,
    refreshDevices,
    stopMicTest,
    isRecording,
  ]);

  const stopRecording = useCallback(async (): Promise<string> => {
    setIsRecording(false);

    // Stop duration timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopAudioVisualizer();

    // Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    let currentRecognized = (transcript + (interimTranscript ? " " + interimTranscript : "")).trim();

    // Stop media recorder
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch (e) {}
    }

    // If client Web Speech API already gathered text, use it right away!
    if (currentRecognized.length > 2) {
      setInterimTranscript("");
      if (optionsRef.current?.onFinalTranscript) {
        optionsRef.current.onFinalTranscript(currentRecognized);
      }
      return currentRecognized;
    }

    // Otherwise send audio chunks to server Gemini STT endpoint
    setIsTranscribing(true);

    try {
      await new Promise((r) => setTimeout(r, 200));

      const chunks = audioChunksRef.current;
      if (chunks.length > 0) {
        const mimeType = chunks[0].type || "audio/webm";
        const audioBlob = new Blob(chunks, { type: mimeType });

        if (audioBlob.size > 1000) {
          const base64Data = await blobToBase64(audioBlob);

          const response = await fetch("/api/transcribe-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: mimeType,
              language: selectedLang,
            }),
          });

          const data = await response.json();
          if (response.ok && data.text) {
            const finalGeminiText = data.text.trim();
            setTranscript(finalGeminiText);
            setInterimTranscript("");
            if (optionsRef.current?.onFinalTranscript) {
              optionsRef.current.onFinalTranscript(finalGeminiText);
            }
            return finalGeminiText;
          }
        }
      }
    } catch (transcribeErr: any) {
      console.error("Gemini transcribe error:", transcribeErr);
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }

    return currentRecognized;
  }, [transcript, interimTranscript, selectedLang]);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setIsTranscribing(false);
    setTranscript("");
    setInterimTranscript("");
    setDuration(0);
    setErrorMsg(null);
    audioChunksRef.current = [];

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopAudioVisualizer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    interimTranscript,
    fullLiveTranscript: (transcript + (interimTranscript ? " " + interimTranscript : "")).trim(),
    duration,
    formattedDuration: formatDuration(duration),
    selectedLang,
    setSelectedLang,
    audioLevel,
    isAboveThreshold: audioLevel >= threshold,
    errorMsg,
    startRecording,
    stopRecording,
    cancelRecording,
    supportedLanguages: SUPPORTED_STT_LANGUAGES,

    // Settings & Device Selection
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    sensitivity,
    setSensitivity,
    threshold,
    setThreshold,
    noiseSuppression,
    setNoiseSuppression,
    echoCancellation,
    setEchoCancellation,
    resetSettings,

    // Mic Test
    isTestingMic,
    toggleMicTest,
    startMicTest,
    stopMicTest,
    testAudioLevel,
  };
}
