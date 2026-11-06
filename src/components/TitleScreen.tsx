import React, { useEffect } from 'react';
import { Play, ShoppingBag, ShieldAlert, Zap, Compass } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenArmory: () => void;
  onOpenCharacterCreator: () => void;
  coins: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenArmory,
  onOpenCharacterCreator,
  coins,
}) => {
  // Listen for Enter / Space keys to start game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-10 select-none bg-radial from-transparent via-slate-950/70 to-slate-950/95 font-['Rajdhani']">
      {/* Top Header info */}
      <div className="flex flex-wrap items-center justify-between w-full gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border-2 border-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#000000]">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-400 rounded-none inline-block" />
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-300">
            VOXEL ENGINE 3D · 60 FPS
          </span>
        </div>

        {/* Armory, Character Creator & Coins */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border-2 border-yellow-500/80 px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#000000]">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center font-bold text-[9px] sm:text-[10px] text-yellow-950">
              $
            </div>
            <span className="font-['Press_Start_2P'] text-[10px] sm:text-xs text-yellow-300 tabular-nums">
              {coins}
            </span>
          </div>

          <button
            onClick={onOpenCharacterCreator}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 border-2 border-yellow-300 px-2.5 sm:px-4 py-1.5 sm:py-2 font-['Press_Start_2P'] text-[9px] sm:text-[10px] tracking-wider shadow-[2px_2px_0px_#000000] cursor-pointer transition-transform"
          >
            <span>SKINS</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border-2 border-emerald-500/80 px-2.5 sm:px-4 py-1.5 sm:py-2 font-bold text-[10px] sm:text-xs tracking-wider shadow-[2px_2px_0px_#000000] cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ARMORY</span>
          </button>
        </div>
      </div>

      {/* Center Hero Title Lockup over Negative Space */}
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center my-auto">
        {/* Bespoke Pixel Gun 3D SVG Title Emblem */}
        <div className="mb-6 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          <svg
            viewBox="0 0 600 130"
            className="w-[min(90vw,540px)] h-auto overflow-visible"
          >
            <defs>
              <linearGradient id="pgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="gunGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Block 3D extruded shadow */}
            <text
              x="304"
              y="68"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="44"
              fontWeight="900"
              fill="#1e1b4b"
              letterSpacing="2"
            >
              PIXEL GUN
            </text>
            <text
              x="302"
              y="66"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="44"
              fontWeight="900"
              fill="#431407"
              letterSpacing="2"
            >
              PIXEL GUN
            </text>

            {/* Front title */}
            <text
              x="300"
              y="62"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="44"
              fontWeight="900"
              fill="url(#pgGradient)"
              stroke="#0f172a"
              strokeWidth="4"
              letterSpacing="2"
            >
              PIXEL GUN
            </text>

            {/* "3D: VOXEL ARENA" ribbon */}
            <rect
              x="140"
              y="78"
              width="320"
              height="36"
              fill="#0f172a"
              stroke="#0284c7"
              strokeWidth="3"
            />
            <text
              x="300"
              y="102"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="16"
              fontWeight="bold"
              fill="#38bdf8"
              letterSpacing="3"
            >
              3D · VOXEL ARENA
            </text>
          </svg>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1 shadow-[2px_2px_0px_#000]">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Jump Pads & Rocket Jumps
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1 shadow-[2px_2px_0px_#000]">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Pool Party Arena
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1 shadow-[2px_2px_0px_#000]">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Wave Survival Bots
          </span>
        </div>

        {/* PRIMARY START BUTTON (Enter / Space to start) */}
        <button
          data-start="true"
          onClick={onStartGame}
          className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-['Press_Start_2P'] text-sm md:text-base px-10 py-5 border-4 border-yellow-200 shadow-[6px_6px_0px_#000000] cursor-pointer transition-transform"
        >
          <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
          <span>ENTER THE ARENA</span>
        </button>

        <p className="mt-4 text-xs font-bold tracking-wider text-slate-400">
          PRESS <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 text-yellow-300 font-mono">ENTER</kbd> OR <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 text-yellow-300 font-mono">SPACE</kbd> TO PLAY
        </p>
      </div>

      {/* Flat Control Hint Line (Bottom Safe Margin) */}
      <div className="w-full text-center text-xs font-bold tracking-wider text-slate-400/90">
        WASD Move · Space Jump · Click Shoot · RMB Scope · 1-7 Weapons · R Reload · Esc Pause
      </div>
    </div>
  );
};
