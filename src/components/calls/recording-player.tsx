"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Call } from "@/types/index";
import { Play, Pause, Download, Volume2, VolumeX, BarChart3 } from "lucide-react";

interface RecordingPlayerProps {
  call: Call;
  onClose?: () => void;
}

export function RecordingPlayer({ call, onClose }: RecordingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [showWaveform, setShowWaveform] = useState(true);
  const [waveformLoading, setWaveformLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Generate waveform data from audio
  const generateWaveform = async (audioBuffer: AudioBuffer): Promise<number[]> => {
    const channelData = audioBuffer.getChannelData(0);
    const samples = 200; // Number of bars in the waveform
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      waveform.push(sum / blockSize);
    }

    return waveform;
  };

  // Draw waveform on canvas
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const maxAmplitude = Math.max(...waveformData);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#e5e7eb'; // Light gray for bars

    waveformData.forEach((amplitude, index) => {
      const barHeight = (amplitude / maxAmplitude) * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw progress indicator
    if (duration > 0) {
      const progress = currentTime / duration;
      const progressX = progress * width;
      
      ctx.fillStyle = '#3b82f6'; // Blue for progress
      ctx.fillRect(0, 0, progressX, height);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError("Failed to load recording");
      setLoading(false);
    };
    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleLoadedData = async () => {
      if (showWaveform && !waveformData.length) {
        setWaveformLoading(true);
        try {
          // Create audio context and decode audio data
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          
          const response = await fetch(call.recordingUrl!);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          
          const waveform = await generateWaveform(audioBuffer);
          setWaveformData(waveform);
        } catch (err) {
          console.warn('Failed to generate waveform:', err);
          setShowWaveform(false);
        } finally {
          setWaveformLoading(false);
        }
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", handleLoadedData);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [call.recordingUrl, showWaveform, waveformData.length]);

  // Redraw waveform when data or progress changes
  useEffect(() => {
    drawWaveform();
  }, [waveformData, currentTime, duration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    if (call.recordingUrl) {
      const link = document.createElement("a");
      link.href = call.recordingUrl;
      link.download = `call-recording-${call.id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!call.recordingUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No recording is available for this call.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Call Recording</span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <audio
          ref={audioRef}
          src={call.recordingUrl}
          preload="metadata"
          style={{ display: "none" }}
        />

        {/* Recording Metadata */}
        <div className="text-sm text-muted-foreground">
          <div>Call ID: {call.id}</div>
          <div>Duration: {formatTime(duration)}</div>
          <div>Date: {new Date(call.createdAt).toLocaleString()}</div>
          {call.contact && (
            <div>Contact: {call.contact.firstName} {call.contact.lastName}</div>
          )}
        </div>

        {/* Waveform Visualization */}
        {showWaveform && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Waveform</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWaveform(false)}
                className="text-xs"
              >
                Hide
              </Button>
            </div>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={60}
                className="w-full h-15 border rounded cursor-pointer"
                onClick={(e) => {
                  if (duration > 0) {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const clickTime = (x / canvas.width) * duration;
                    
                    if (audioRef.current) {
                      audioRef.current.currentTime = clickTime;
                      setCurrentTime(clickTime);
                    }
                  }
                }}
              />
              {waveformLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                  <div className="text-xs text-muted-foreground">Generating waveform...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {!showWaveform && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWaveform(true)}
              className="text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Show Waveform
            </Button>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayPause}
            disabled={loading}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={loading}
            />
          </div>

          <div className="text-sm font-mono min-w-[60px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            disabled={loading}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={loading}
          />
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Speed:</span>
          <select
            value={playbackRate}
            onChange={(e) => {
              const rate = parseFloat(e.target.value);
              setPlaybackRate(rate);
              if (audioRef.current) {
                audioRef.current.playbackRate = rate;
              }
            }}
            className="px-2 py-1 text-sm border rounded"
            disabled={loading}
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>

        {/* Download Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {loading && (
          <div className="text-center text-sm text-muted-foreground">
            Loading recording...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
