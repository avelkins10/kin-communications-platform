'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  Volume2,
  Clock,
  Phone,
  User,
  MessageSquare
} from 'lucide-react';
import { Voicemail, VoicemailPriority } from '@/types/index';
import { cn } from '@/lib/utils';

interface VoicemailPlayerProps {
  voicemail: Voicemail;
  onCallback?: (voicemail: Voicemail) => void;
  onAssign?: (voicemail: Voicemail) => void;
  onMarkRead?: (voicemail: Voicemail) => void;
  onMarkUnread?: (voicemail: Voicemail) => void;
  onDelete?: (voicemail: Voicemail) => void;
  className?: string;
}

const priorityColors: Record<VoicemailPriority, string> = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export function VoicemailPlayer({
  voicemail,
  onCallback,
  onAssign,
  onMarkRead,
  onMarkUnread,
  onDelete,
  className,
}: VoicemailPlayerProps) {
  const isNew = !voicemail.readAt;
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isWaveformReady, setIsWaveformReady] = useState(false);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds?: number | null): string => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCallerName = (): string => {
    if (voicemail.contact) {
      return `${voicemail.contact.firstName} ${voicemail.contact.lastName}`;
    }
    return voicemail.fromNumber;
  };

  // Generate waveform data from audio
  const generateWaveform = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(voicemail.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of waveform bars
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }

      setWaveformData(waveform);
      setIsWaveformReady(true);
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Fallback: create a simple waveform
      const fallbackWaveform = Array.from({ length: 200 }, () => Math.random() * 0.5 + 0.1);
      setWaveformData(fallbackWaveform);
      setIsWaveformReady(true);
    }
  }, [voicemail.audioUrl]);

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isWaveformReady) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      const isPlayed = index / waveformData.length < progress;
      ctx.fillStyle = isPlayed ? '#3b82f6' : '#e5e7eb';
      
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });
  }, [waveformData, isWaveformReady, currentTime, duration]);

  // Handle waveform click for seeking
  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !duration) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPosition = x / canvas.width;
    const newTime = clickPosition * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkipBack = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const handleSkipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      duration,
      audioRef.current.currentTime + 10
    );
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = voicemail.audioUrl;
    link.download = `voicemail-${voicemail.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handlePlayPause();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      handleSkipBack();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      handleSkipForward();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Generate waveform when audio is loaded
      generateWaveform();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [generateWaveform]);

  // Draw waveform when data changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Voicemail Details
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isNew ? 'default' : 'secondary'}>
                {isNew ? 'New' : 'Read'}
              </Badge>
              <Badge className={priorityColors[voicemail.priority]}>
                {voicemail.priority}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCallback?.(voicemail)}
            >
              <Phone className="h-4 w-4 mr-1" />
              Callback
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAssign?.(voicemail)}
            >
              <User className="h-4 w-4 mr-1" />
              Assign
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => 
                isNew ? onMarkRead?.(voicemail) : onMarkUnread?.(voicemail)
              }
            >
              {isNew ? 'Mark Read' : 'Mark Unread'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(voicemail)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Caller Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Caller</h4>
            <p className="font-medium">{formatCallerName()}</p>
            <p className="text-sm text-muted-foreground">{voicemail.fromNumber}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Received</h4>
            <p className="font-medium">
              {format(new Date(voicemail.createdAt), 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(voicemail.createdAt), 'h:mm a')}
            </p>
          </div>
        </div>

        {/* Audio Player */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSkipBack}
              disabled={isLoading}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              onClick={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSkipForward}
              disabled={isLoading}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Waveform Visualization */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-12">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={80}
                  onClick={handleWaveformClick}
                  className="w-full h-20 cursor-pointer border rounded-lg bg-gray-50"
                  style={{ maxWidth: '100%' }}
                />
                {!isWaveformReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Loading waveform...</div>
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground w-12">
                {formatTime(duration)}
              </span>
            </div>
            {/* Fallback progress bar for accessibility */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading}
              aria-label="Audio progress"
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <div className="flex gap-1">
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <Button
                    key={rate}
                    size="sm"
                    variant={playbackRate === rate ? 'default' : 'outline'}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className="h-8 w-8 p-0"
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Transcription */}
        {voicemail.transcription && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Transcription</h4>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{voicemail.transcription}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {voicemail.notes && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{voicemail.notes}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Duration</h4>
            <p className="text-sm">{formatDuration(voicemail.duration)}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Assigned To</h4>
            <p className="text-sm">
              {voicemail.assignedTo 
                ? (voicemail.assignedTo.name || voicemail.assignedTo.email)
                : 'Unassigned'
              }
            </p>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={voicemail.audioUrl}
          preload="metadata"
        />
      </CardContent>
    </Card>
  );
}
