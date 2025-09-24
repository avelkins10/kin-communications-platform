"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pause, Play, PhoneOff, PhoneForwarded } from "lucide-react";
import { Call } from "@/types/index";

interface CallControlsProps {
  call: Call;
  onMute: (call: Call) => void;
  onUnmute: (call: Call) => void;
  onHold: (call: Call) => void;
  onUnhold: (call: Call) => void;
  onHangup: (call: Call) => void;
  onTransfer: (call: Call, destination: string) => void;
  loading?: boolean;
}

export function CallControls({
  call,
  onMute,
  onUnmute,
  onHold,
  onUnhold,
  onHangup,
  onTransfer,
  loading = false,
}: CallControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [transferDestination, setTransferDestination] = useState("");

  const handleMute = () => {
    if (isMuted) {
      onUnmute(call);
      setIsMuted(false);
    } else {
      onMute(call);
      setIsMuted(true);
    }
  };

  const handleHold = () => {
    if (isOnHold) {
      onUnhold(call);
      setIsOnHold(false);
    } else {
      onHold(call);
      setIsOnHold(true);
    }
  };

  const handleTransfer = () => {
    if (transferDestination.trim()) {
      onTransfer(call, transferDestination.trim());
      setTransferDestination("");
    }
  };

  // Only show controls for active calls
  if (!['RINGING', 'IN_PROGRESS'].includes(call.status)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="sm"
          onClick={handleMute}
          disabled={loading}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <Button
          variant={isOnHold ? "destructive" : "outline"}
          size="sm"
          onClick={handleHold}
          disabled={loading}
          title={isOnHold ? "Resume" : "Hold"}
        >
          {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onHangup(call)}
          disabled={loading}
          title="Hang Up"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <input
          type="text"
          placeholder="Transfer to..."
          value={transferDestination}
          onChange={(e) => setTransferDestination(e.target.value)}
          className="px-3 py-1 text-sm border rounded-md"
          disabled={loading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleTransfer}
          disabled={loading || !transferDestination.trim()}
          title="Transfer Call"
        >
          <PhoneForwarded className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="ml-2 text-sm text-muted-foreground">
          Processing...
        </div>
      )}
    </div>
  );
}
