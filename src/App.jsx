import React, { useState, useEffect } from 'react';
import ThreeLamp from './components/ThreeLamp';
import LoginForm from './components/LoginForm';
import GlowParticles from './components/GlowParticles';
import { Volume2, VolumeX, Sparkles, Lightbulb, Info } from 'lucide-react';
import { soundManager } from './utils/soundEffects';

export default function App() {
  const [isLampOn, setIsLampOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Toggle Lamp ON / OFF
  const handleToggleLamp = () => {
    setIsLampOn((prev) => !prev);
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070709] text-white flex flex-col justify-between select-none">
      {/* Dynamic Background Atmosphere */}
      {/* 1. Deep cinematic darkness when off */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out ${
          isLampOn ? 'opacity-40' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 50%, #0e0e13 0%, #070709 75%, #030304 100%)',
        }}
      />

      {/* 2. Warm ambient illumination bloom when ON */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-1000 ease-out ${
          isLampOn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 28% 46%, rgba(250, 204, 21, 0.14) 0%, rgba(245, 158, 11, 0.05) 45%, transparent 75%),
            radial-gradient(circle at 75% 50%, rgba(250, 204, 21, 0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Floating Glowing Firefly / Dust Particles */}
      <GlowParticles isLampOn={isLampOn} />

      {/* Top Navigation Bar / Controls */}
      <header className="relative z-30 w-full px-6 py-5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${
              isLampOn
                ? 'bg-yellow-400 text-zinc-950 shadow-yellow-400/40'
                : 'bg-zinc-800/80 text-zinc-400 border border-white/5'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              HARSH
            </h2>
            <p className="text-[11px] text-zinc-500">
              {isLampOn ? 'Status: Illuminated' : 'Status: In Darkness'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Lamp Switch Button */}
          <button
            onClick={() => {
              handleToggleLamp();
              soundManager.playSwitchClick(!isLampOn);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-300 border ${
              isLampOn
                ? 'bg-yellow-400 text-zinc-950 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.35)]'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-white/10 hover:border-yellow-400/40'
            }`}
            title="Toggle Lamp Light"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLampOn ? 'bg-zinc-950' : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">{isLampOn ? 'Turn OFF Lamp' : 'Turn ON Lamp'}</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            className="w-9 h-9 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
          </button>

          {/* Help Info Toggle */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-9 h-9 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            title="Interaction Guide"
            aria-label="Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info Popover Modal */}
      {showHelp && (
        <div className="absolute top-20 right-6 z-40 max-w-sm p-5 rounded-2xl glass-panel text-xs text-zinc-300 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-400" /> How to Interact
            </span>
            <button
              onClick={() => setShowHelp(false)}
              className="text-zinc-400 hover:text-white text-sm font-mono"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">1.</span>
              <span><strong>Pull or Click the 3D String:</strong> Grab the hanging golden knob under the lamp and pull it down, or click it directly to trigger the switch.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">2.</span>
              <span><strong>Realistic 3D Physics:</strong> The lamp swings naturally when pulled and the chain springs back with mechanical click audio.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">3.</span>
              <span><strong>Light Reveal:</strong> Turning the lamp on lights up the room and smoothly reveals the glassmorphism login card.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">4.</span>
              <span><strong>Mouse Parallax:</strong> Move your cursor across the screen to experience subtle 3D camera depth.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative flex-1 w-full h-full flex flex-col md:flex-row items-center justify-center px-4 sm:px-8">
        {/* Fullscreen 3D Three.js Scene (Background + Interactive Lamp) */}
        <div className="absolute inset-0 z-10">
          <ThreeLamp
            isLampOn={isLampOn}
            onToggleLamp={handleToggleLamp}
          />
        </div>

        {/* Desktop / Tablet Layout: Login Card positioned on the right */}
        <div className="relative z-20 w-full h-full flex items-center justify-center md:justify-end md:pr-12 lg:pr-24 pointer-events-none">
          <LoginForm isLampOn={isLampOn} />
        </div>
      </main>
    </div>
  );
}
