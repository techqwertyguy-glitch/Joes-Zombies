import React from 'react';
import { Play, RotateCcw, Home, ShoppingBag, Trophy, Skull } from 'lucide-react';

interface PauseModalProps {
  score: number;
  wave: number;
  coins: number;
  onResume: () => void;
  onRestart: () => void;
  onOpenArmory: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  wave,
  coins,
  onResume,
  onRestart,
  onOpenArmory,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/80 font-['Rajdhani']">
      <div className="w-full max-w-md bg-slate-950 border-4 border-slate-700 p-4 sm:p-6 shadow-[8px_8px_0px_#000000] text-center max-h-[95vh] overflow-y-auto">
        <h2 className="font-['Press_Start_2P'] text-lg sm:text-xl text-yellow-400 mb-4 sm:mb-6 tracking-wider">
          GAME PAUSED
        </h2>

        {/* Stat Tiles */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-900 border border-slate-800 p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              WAVE
            </span>
            <span className="font-mono text-lg font-bold text-white tabular-nums">
              {wave}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              SCORE
            </span>
            <span className="font-mono text-lg font-bold text-white tabular-nums">
              {score}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              COINS
            </span>
            <span className="font-mono text-lg font-bold text-yellow-300 tabular-nums">
              {coins}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-['Press_Start_2P'] text-xs border-2 border-yellow-200 shadow-[4px_4px_0px_#000] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>RESUME GAME</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border-2 border-emerald-500 font-bold text-sm tracking-wider shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>OPEN ARMORY</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border-2 border-slate-700 font-bold text-sm tracking-wider shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART MATCH</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 font-bold text-xs tracking-wider cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: {
    score: number;
    wave: number;
    kills: number;
    coins: number;
  };
  onTryAgain: () => void;
  onOpenArmory: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onTryAgain,
  onOpenArmory,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-red-950/80 font-['Rajdhani']">
      <div className="w-full max-w-md bg-slate-950 border-4 border-red-600 p-4 sm:p-6 shadow-[8px_8px_0px_#000000] text-center max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-center gap-2 text-red-500 mb-1 sm:mb-2">
          <Skull className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <h2 className="font-['Press_Start_2P'] text-lg sm:text-xl text-red-500 mb-4 sm:mb-6 tracking-wider">
          GAME OVER
        </h2>

        {/* Mastery / Progress Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900/90 border-2 border-slate-800 p-3 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              WAVE REACHED
            </span>
            <span className="font-mono text-2xl font-bold text-amber-400 tabular-nums">
              WAVE {stats.wave}
            </span>
          </div>

          <div className="bg-slate-900/90 border-2 border-slate-800 p-3 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              FINAL SCORE
            </span>
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {stats.score}
            </span>
          </div>

          <div className="bg-slate-900/90 border-2 border-slate-800 p-3 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              ENEMIES DEFEATED
            </span>
            <span className="font-mono text-2xl font-bold text-red-400 tabular-nums">
              {stats.kills}
            </span>
          </div>

          <div className="bg-slate-900/90 border-2 border-slate-800 p-3 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              COINS COLLECTED
            </span>
            <span className="font-mono text-2xl font-bold text-yellow-300 tabular-nums">
              ${stats.coins}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            data-start="true"
            onClick={onTryAgain}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-500 hover:to-rose-400 text-white font-['Press_Start_2P'] text-xs border-2 border-red-300 shadow-[4px_4px_0px_#000] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border-2 border-emerald-500 font-bold text-sm tracking-wider shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>UPGRADE IN ARMORY</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 font-bold text-xs tracking-wider cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
