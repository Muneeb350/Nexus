import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff,
  Phone, Wifi, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { entrepreneurs, investors } from '../../data/users';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Control button ────────────────────────────────────────────────────────────

type ControlVariant = 'default' | 'off' | 'highlight';

interface ControlBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: ControlVariant;
  disabled?: boolean;
}

const ControlBtn: React.FC<ControlBtnProps> = ({
  icon, label, onClick, variant = 'default', disabled = false,
}) => {
  const bgMap: Record<ControlVariant, string> = {
    default:   'bg-slate-700 hover:bg-slate-600',
    off:       'bg-red-500/80 hover:bg-red-500',
    highlight: 'bg-blue-500 hover:bg-blue-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 group disabled:opacity-40 disabled:cursor-not-allowed"
      title={label}
    >
      <div
        className={`p-3 rounded-full transition-colors text-white ${
          disabled ? 'bg-slate-700' : bgMap[variant]
        }`}
      >
        {icon}
      </div>
      <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors leading-none">
        {label}
      </span>
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const VideoCallPage: React.FC = () => {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isCallActive, setIsCallActive]       = useState(false);
  const [isVideoOn, setIsVideoOn]             = useState(false);
  const [isAudioOn, setIsAudioOn]             = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting]       = useState(false);
  const [callDuration, setCallDuration]       = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const localVideoRef   = useRef<HTMLVideoElement>(null);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Remote participant (always opposite role) ──────────────────────────────
  const remoteParticipant =
    user?.role === 'entrepreneur' ? investors[0] : entrepreneurs[0];

  // ── Sync local video element with the active stream ───────────────────────
  // This effect is the single source-of-truth for srcObject assignment so we
  // never race against React's async rendering when the <video> mounts/unmounts.
  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !isCallActive) return;
    el.srcObject =
      isScreenSharing && screenStreamRef.current
        ? screenStreamRef.current
        : localStreamRef.current;
  }, [isCallActive, isScreenSharing]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const startCall = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      // Simulated connection handshake delay
      await new Promise<void>(r => setTimeout(r, 1500));

      setIsCallActive(true);
      setIsVideoOn(true);
      setIsAudioOn(true);
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      toast.success(`Connected to ${remoteParticipant.name}!`);
    } catch (err) {
      const denied =
        err instanceof Error &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      toast.error(
        denied
          ? 'Camera / microphone access denied. Allow permissions in your browser and try again.'
          : 'Could not access camera or microphone. Check your device settings.',
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const endCall = useCallback(() => {
    // Clear srcObject before stopping tracks so the browser releases the camera LED
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current  = null;
    screenStreamRef.current = null;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setIsCallActive(false);
    setIsVideoOn(false);
    setIsAudioOn(false);
    setIsScreenSharing(false);
    setCallDuration(0);
    toast.success('Call ended.');
  }, []);

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const next = !isAudioOn;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = next; });
    setIsAudioOn(next);
    toast(next ? 'Microphone unmuted.' : 'Microphone muted.', {
      icon: next ? '🎤' : '🔇',
    });
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const next = !isVideoOn;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = next; });
    setIsVideoOn(next);
    toast(next ? 'Camera turned on.' : 'Camera turned off.', {
      icon: next ? '📹' : '📵',
    });
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false); // useEffect restores webcam stream
      toast('Screen sharing stopped.', { icon: '🖥️' });
    } else {
      try {
        // getDisplayMedia isn't on all TS lib versions — cast to any
        const screenStream = await (
          navigator.mediaDevices as MediaDevices & {
            getDisplayMedia(c?: object): Promise<MediaStream>;
          }
        ).getDisplayMedia({ video: true });

        screenStreamRef.current = screenStream;

        // Handle user stopping via the browser's native "Stop sharing" button
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          screenStreamRef.current = null;
          setIsScreenSharing(false);
          toast('Screen sharing stopped.', { icon: '🖥️' });
        });

        setIsScreenSharing(true); // useEffect switches video to screen stream
        toast('Screen sharing started.', { icon: '🖥️' });
      } catch {
        toast.error('Screen sharing was cancelled or is unavailable.');
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg shrink-0">
          <Video className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Calling Chamber</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect face-to-face with entrepreneurs and investors in real time.
          </p>
        </div>
      </div>

      {/* ── PRE-CALL: lobby ─────────────────────────────────────────────────── */}
      {!isCallActive && !isConnecting && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">

            <h2 className="text-center text-base font-semibold text-gray-700 mb-8">
              Ready to Connect
            </h2>

            {/* Participants row */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8 flex-wrap">

              {/* Self */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <img
                    src={user?.avatarUrl}
                    alt={user?.name ?? 'You'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 shadow-md"
                    onError={e =>
                      ((e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=random`)
                    }
                  />
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-success-500 border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-primary-50 text-primary-700 font-medium border border-primary-100">
                  You
                </span>
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-px bg-gray-200 sm:w-16" />
                  <div className="p-2.5 rounded-full bg-gray-100 border border-gray-200">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <div className="w-10 h-px bg-gray-200 sm:w-16" />
                </div>
                <p className="text-xs text-gray-400">ready to connect</p>
              </div>

              {/* Remote participant */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <img
                    src={remoteParticipant.avatarUrl}
                    alt={remoteParticipant.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-md"
                  />
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-success-500 border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{remoteParticipant.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{remoteParticipant.role}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-success-50 text-success-700 font-medium border border-success-100">
                  Available
                </span>
              </div>
            </div>

            {/* Permission hints */}
            <div className="flex items-center justify-center gap-6 mb-7 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Video size={13} className="text-primary-400" />
                Camera required
              </span>
              <span className="flex items-center gap-1.5">
                <Mic size={13} className="text-primary-400" />
                Microphone required
              </span>
              <span className="flex items-center gap-1.5">
                <Wifi size={13} className="text-primary-400" />
                Stable connection recommended
              </span>
            </div>

            {/* Start call CTA */}
            <div className="flex justify-center">
              <button
                onClick={startCall}
                className="flex items-center gap-2.5 px-8 py-3 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-semibold rounded-full shadow-lg shadow-primary-200/60 transition-all hover:scale-105"
              >
                <Phone size={18} />
                Start Video Call
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              {
                icon: <Video size={20} className="text-primary-600" />,
                title: 'HD Video',
                desc: 'Crystal-clear 1-on-1 calls — your webcam stream live in the browser.',
              },
              {
                icon: <Monitor size={20} className="text-primary-600" />,
                title: 'Screen Sharing',
                desc: 'Present pitch decks and financials directly from your screen.',
              },
              {
                icon: <Users size={20} className="text-primary-600" />,
                title: 'Real Participants',
                desc: 'Connects to your Meetings calendar — schedule and join from one place.',
              },
            ] as const).map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="p-2 bg-primary-50 rounded-lg w-fit">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CONNECTING: animated dial screen ────────────────────────────────── */}
      {isConnecting && (
        <div className="bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-7 py-24">
          <div className="relative flex items-center justify-center">
            {/* Outer pulsing rings */}
            <span className="absolute w-44 h-44 rounded-full border-2 border-primary-400/20 animate-ping" />
            <span className="absolute w-36 h-36 rounded-full border-2 border-primary-400/30 animate-ping [animation-delay:250ms]" />
            <span className="absolute w-28 h-28 rounded-full border-2 border-primary-400/40 animate-ping [animation-delay:500ms]" />
            <img
              src={remoteParticipant.avatarUrl}
              alt={remoteParticipant.name}
              className="relative w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">
              Connecting to {remoteParticipant.name}…
            </p>
            <p className="text-white/45 text-sm mt-1.5">
              Allow camera &amp; microphone access when prompted
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-primary-400 animate-bounce"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── IN-CALL: main chamber ────────────────────────────────────────────── */}
      {isCallActive && (
        <div className="relative rounded-xl overflow-hidden bg-slate-900 select-none"
          style={{ minHeight: 540 }}>

          {/* ─ Remote participant: full-bleed background + centered card ─ */}
          <div className="absolute inset-0">
            {/* Blurred avatar wash */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{
                backgroundImage: `url(${remoteParticipant.avatarUrl})`,
                filter: 'blur(48px) brightness(0.2) saturate(1.4)',
              }}
            />
            {/* Centered participant info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <img
                  src={remoteParticipant.avatarUrl}
                  alt={remoteParticipant.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                />
                {/* Speaking pulse */}
                <span className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-2xl tracking-tight drop-shadow-lg">
                  {remoteParticipant.name}
                </p>
                <p className="text-white/50 text-sm mt-1 capitalize">
                  {remoteParticipant.role}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-xs font-semibold tracking-wide">
                  Live — Connected
                </span>
              </div>
            </div>
          </div>

          {/* ─ Top info bar ─ */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-mono font-semibold tracking-wider">
                {formatDuration(callDuration)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isScreenSharing && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/30 border border-blue-400/40 backdrop-blur-sm">
                  <Monitor size={12} className="text-blue-300" />
                  <span className="text-blue-200 text-xs font-medium">Sharing screen</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <Wifi size={13} className="text-green-400" />
                <span className="text-white/70 text-xs">HD Quality</span>
              </div>
            </div>
          </div>

          {/* ─ PiP: local webcam / screen share preview ─ */}
          <div className="absolute bottom-[88px] right-4 z-10">
            <div className="relative w-44 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 ring-1 ring-black/30">

              {/* The real webcam / screen stream */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: !isScreenSharing ? 'scaleX(-1)' : undefined,
                  opacity: isVideoOn || isScreenSharing ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              />

              {/* Camera-off overlay */}
              {!isVideoOn && !isScreenSharing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 gap-1">
                  <VideoOff size={18} className="text-white/30" />
                  <span className="text-white/30 text-xs">Camera off</span>
                </div>
              )}

              {/* "You" label */}
              <div className="absolute bottom-1.5 left-2.5 z-10">
                <span className="text-white/70 text-xs font-medium drop-shadow">You</span>
              </div>

              {/* Audio-muted indicator */}
              {!isAudioOn && (
                <div className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-red-500/80">
                  <MicOff size={10} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* ─ Floating control bar ─ */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-end gap-2 sm:gap-3 px-5 py-3.5 rounded-2xl bg-slate-800/95 backdrop-blur-md border border-white/10 shadow-2xl">

            {/* Mic */}
            <ControlBtn
              icon={isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
              label={isAudioOn ? 'Mute' : 'Unmute'}
              onClick={toggleAudio}
              variant={isAudioOn ? 'default' : 'off'}
            />

            {/* Camera */}
            <ControlBtn
              icon={isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              label={isVideoOn ? 'Camera' : 'No Cam'}
              onClick={toggleVideo}
              variant={isVideoOn ? 'default' : 'off'}
            />

            {/* Screen share */}
            <ControlBtn
              icon={<Monitor size={20} />}
              label={isScreenSharing ? 'Stop Share' : 'Share'}
              onClick={toggleScreenShare}
              variant={isScreenSharing ? 'highlight' : 'default'}
            />

            {/* Divider */}
            <div className="self-stretch mx-1 w-px bg-white/10 my-0.5" />

            {/* End call */}
            <button
              onClick={endCall}
              className="flex flex-col items-center gap-1.5 group"
              title="End call"
            >
              <div className="p-3 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white shadow-lg shadow-red-900/40">
                <PhoneOff size={20} />
              </div>
              <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors leading-none">
                End Call
              </span>
            </button>
          </div>

          {/* ─ Remote audio-muted badge (mocked) ─ */}
          <div className="absolute bottom-[88px] left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            <Mic size={11} className="text-white/60" />
            <span className="text-white/60 text-xs">{remoteParticipant.name.split(' ')[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
};
