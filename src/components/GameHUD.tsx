import React from 'react';
import { GameEngineState } from '../game/engine';
import { BloodSplatterOverlay } from './BloodSplatterOverlay';
import { Volume2, VolumeX, Pause, ShoppingBag, Shield, Heart, Crosshair, User, Smartphone } from 'lucide-react';

interface GameHUDProps {
  state: GameEngineState;
  onSwitchWeapon: (id: string) => void;
  onToggleScope: () => void;
  onReload: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onOpenArmory: () => void;
  onOpenCharacterCreator?: () => void;
  isTouchDevice?: boolean;
  showTouchControls?: boolean;
  onToggleTouchControls?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  onSwitchWeapon,
  onReload,
  onToggleMute,
  onOpenPause,
  onOpenArmory,
  onOpenCharacterCreator,
  isTouchDevice = false,
  showTouchControls = false,
  onToggleTouchControls,
}) => {
  const currentWeapon = state.weapons[state.currentWeaponId] || state.weapons.pixel_ak47;
  const isMelee = currentWeapon.category === 'melee';

  const hpPercent = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
  const armorPercent = Math.max(0, Math.min(100, (state.armor / state.maxArmor) * 100));
  const isLowHp = state.hp < 30;

  const weaponList = Object.values(state.weapons);
  const isHitActive = performance.now() - state.hitmarkerTime < 140;
  const isDamageActive = state.damageFlashTime > 0 && performance.now() - state.damageFlashTime < 650;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 font-['Rajdhani']">
      {/* Dynamic Blood Splatter & Directional Edge Damage Overlay */}
      <BloodSplatterOverlay
        damageFlashTime={state.damageFlashTime}
        damageAngle={state.damageAngle}
        hp={state.hp}
        maxHp={state.maxHp}
      />

      {/* Directional Threat Damage Indicator (points to attacker bearing) */}
      {isDamageActive && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-10">
          <div
            className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center transition-transform duration-75"
            style={{ transform: `rotate(${state.damageAngle}deg)` }}
          >
            {/* Pulsing red pointer at top of rotating ring */}
            <div className="absolute top-0 flex flex-col items-center">
              <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gradient-to-b from-red-500 to-transparent rounded-t opacity-90 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
              <div className="w-0 h-0 border-l-[10px] sm:border-l-[12px] border-l-transparent border-r-[10px] sm:border-r-[12px] border-r-transparent border-t-[12px] sm:border-t-[16px] border-t-red-600 drop-shadow-[0_0_10px_rgba(239,68,68,1)]" />
              <span className="font-['Press_Start_2P'] text-[7px] text-red-300 font-bold tracking-widest mt-0.5 select-none drop-shadow">
                HIT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Critical Low HP pulsing border */}
      {isLowHp && (
        <div className="fixed inset-0 pointer-events-none border-4 border-red-500/30 animate-pulse" />
      )}

      {/* Sniper Scope Vignette Overlay */}
      {state.isScoped && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center bg-black/85">
          <div className="relative w-[min(80vh,80vw)] h-[min(80vh,80vw)] rounded-full border-4 border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.4)] overflow-hidden flex items-center justify-center">
            {/* Scope crosshair reticle */}
            <div className="absolute w-full h-[2px] bg-cyan-400/70" />
            <div className="absolute h-full w-[2px] bg-cyan-400/70" />
            <div className="w-16 h-16 rounded-full border border-cyan-400/50" />
            <div className="w-36 h-36 rounded-full border border-dashed border-cyan-400/30" />
            <div className="absolute bottom-6 font-mono text-cyan-300 text-xs tracking-widest">
              [ SCOPE 4X · RANGE 120M ]
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: Vitality Cluster (Left), Wave Progress (Center), Utilities (Right) */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Health & Armor */}
        <div className="flex flex-col gap-1 sm:gap-2 bg-slate-950/85 border-2 border-slate-700 p-1.5 sm:p-3 shadow-[3px_3px_0px_#000000] w-28 sm:w-64 pointer-events-auto">
          {/* Health Bar */}
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-xs font-bold tracking-wider text-red-400 mb-0.5">
              <span className="flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-red-500 text-red-500" />
                <span className="hidden sm:inline">HEALTH</span>
                <span className="sm:hidden">HP</span>
              </span>
              <span className="font-mono text-[10px] sm:text-sm tabular-nums text-white">
                {Math.round(state.hp)}
              </span>
            </div>
            <div className="w-full h-2.5 sm:h-3.5 bg-slate-900 border border-slate-700 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-xs font-bold tracking-wider text-blue-400 mb-0.5">
              <span className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-blue-500 text-blue-500" />
                <span className="hidden sm:inline">ARMOR</span>
                <span className="sm:hidden">AP</span>
              </span>
              <span className="font-mono text-[10px] sm:text-sm tabular-nums text-white">
                {Math.round(state.armor)}
              </span>
            </div>
            <div className="w-full h-2 sm:h-3 bg-slate-900 border border-slate-700 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-150"
                style={{ width: `${armorPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Wave & Match Score */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/85 border-2 border-amber-500/80 px-3 sm:px-6 py-1 sm:py-2 shadow-[3px_3px_0px_#000000] text-center">
            <div className="font-['Press_Start_2P'] text-[9px] sm:text-xs text-amber-400 tracking-wider mb-0.5 sm:mb-1">
              {state.waveName}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold">
              <span className="text-slate-300">
                <span className="hidden sm:inline">ENEMIES: </span>
                <span className="text-amber-300 font-mono tabular-nums text-xs sm:text-base">
                  {state.enemiesRemaining}/{state.totalWaveEnemies}
                </span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">
                <span className="hidden sm:inline">SCORE: </span>
                <span className="text-white font-mono tabular-nums text-xs sm:text-base">
                  {state.score}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Currency & Utility Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Gold Coins */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border-2 border-yellow-500/80 px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#000000]">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center font-bold text-[9px] sm:text-[10px] text-yellow-950">
              $
            </div>
            <span className="font-['Press_Start_2P'] text-[10px] sm:text-xs text-yellow-300 tabular-nums">
              {state.coins}
            </span>
          </div>

          {/* Touch Controls Toggle button */}
          {onToggleTouchControls && (
            <button
              onClick={onToggleTouchControls}
              className={`p-1.5 sm:p-2 border-2 shadow-[2px_2px_0px_#000000] cursor-pointer ${
                showTouchControls
                  ? 'bg-amber-500 border-yellow-200 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Touch Controls"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Skin Creator button */}
          {onOpenCharacterCreator && (
            <button
              onClick={onOpenCharacterCreator}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-yellow-300 shadow-[2px_2px_0px_#000000] cursor-pointer"
              title="Customize Character Skin"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">SKIN</span>
            </button>
          )}

          {/* Armory button */}
          <button
            onClick={onOpenArmory}
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-emerald-400 shadow-[2px_2px_0px_#000000] cursor-pointer"
            title="Open Armory [B]"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">ARMORY</span>
          </button>

          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700 shadow-[2px_2px_0px_#000000] cursor-pointer"
            title="Toggle Mute [M]"
          >
            {state.isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* Pause button */}
          <button
            onClick={onOpenPause}
            className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700 shadow-[2px_2px_0px_#000000] cursor-pointer"
            title="Pause [Esc / P]"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* CENTER: Crosshair & Hitmarker */}
      {!state.isScoped && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Center dot */}
            <div className={`w-1.5 h-1.5 ${isHitActive ? 'bg-red-500 scale-150' : 'bg-white/90'} transition-transform`} />

            {/* 4 Crosshair lines */}
            <div className={`absolute -top-3 w-0.5 h-2 ${isHitActive ? 'bg-red-500' : 'bg-white/80'}`} />
            <div className={`absolute -bottom-3 w-0.5 h-2 ${isHitActive ? 'bg-red-500' : 'bg-white/80'}`} />
            <div className={`absolute -left-3 h-0.5 w-2 ${isHitActive ? 'bg-red-500' : 'bg-white/80'}`} />
            <div className={`absolute -right-3 h-0.5 w-2 ${isHitActive ? 'bg-red-500' : 'bg-white/80'}`} />

            {/* Hitmarker X indicator */}
            {isHitActive && (
              <div className="absolute text-red-500 font-black text-xl animate-ping select-none">
                ✕
              </div>
            )}
            {isHitActive && state.isCritHit && (
              <div className="absolute -top-6 text-yellow-400 font-['Press_Start_2P'] text-[9px] tracking-wider select-none">
                CRIT!
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE TOUCH DOCK: Placed neatly under the top status bar so center playfield remains unobstructed */}
      {showTouchControls && (
        <div className="fixed top-[62px] left-1/2 -translate-x-1/2 max-w-[95vw] z-30 flex items-center gap-1 bg-slate-950/90 border-2 border-slate-700 p-1 shadow-[3px_3px_0px_#000000] pointer-events-auto overflow-x-auto scrollbar-none">
          {weaponList.map((w, idx) => {
            const isSelected = w.id === state.currentWeaponId;
            const slotNum = idx + 1;
            return (
              <button
                key={w.id}
                onClick={() => w.unlocked && onSwitchWeapon(w.id)}
                disabled={!w.unlocked}
                className={`relative flex flex-col items-center justify-center min-w-[42px] h-11 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-950/70 scale-105 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                    : w.unlocked
                    ? 'border-slate-700 bg-slate-900/80 active:border-slate-500'
                    : 'border-slate-800 bg-slate-950/90 opacity-40 cursor-not-allowed'
                }`}
                title={`${w.name} [Slot ${slotNum}]`}
              >
                <span className="absolute top-0.5 left-1 font-mono text-[8px] font-bold text-slate-400">
                  {slotNum}
                </span>
                <span className={`font-['Press_Start_2P'] text-[7px] text-center px-0.5 ${isSelected ? 'text-yellow-300' : 'text-slate-200'}`}>
                  {w.id === 'combat_knife' ? 'KNIFE' : w.id === 'pixel_pistol' ? 'PISTOL' : w.id === 'pixel_ak47' ? 'AK47' : w.id === 'pixel_shotgun' ? 'SHOTGUN' : w.id === 'pixel_sniper' ? 'SNIPER' : w.id === 'rocket_jumper' ? 'ROCKET' : 'LASER'}
                </span>
                {w.unlocked && (
                  <span className="absolute bottom-0.5 right-1 font-mono text-[8px] text-slate-400">
                    v{w.level}
                  </span>
                )}
                {!w.unlocked && (
                  <span className="absolute bottom-0.5 text-[7px] text-amber-500 font-bold">
                    LOCK
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* DESKTOP BOTTOM SECTION: Pointer Notice, Weapon Dock (Center) & Active Weapon Card (Right) */}
      {!showTouchControls && (
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full gap-2 pb-1">
          {/* Left: Pointer Lock / Click to Aim Notice */}
          <div className="pointer-events-auto">
            {!state.isPointerLocked && !isTouchDevice && (
              <button
                onClick={() => document.querySelector('canvas')?.requestPointerLock?.()}
                className="hidden sm:block text-left bg-amber-950/90 hover:bg-amber-900 border-2 border-amber-500 p-2 text-xs text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_20px_rgba(245,158,11,0.7)] max-w-xs cursor-pointer active:scale-95 transition-all"
                title="Click to lock mouse cursor for 360° aim"
              >
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Crosshair className="w-4 h-4 text-amber-400" />
                  CLICK PLAYFIELD TO LOCK AIM
                </div>
                <p className="text-[11px] text-amber-300">
                  Move mouse to aim 360°, Left Click to shoot, Right Click for scope!
                </p>
              </button>
            )}
          </div>

          {/* Center: Quick Weapon Dock (Slots 1-7) */}
          <div className="flex items-center gap-1 bg-slate-950/85 border-2 border-slate-700 p-1 shadow-[3px_3px_0px_#000000] pointer-events-auto max-w-[96vw] overflow-x-auto scrollbar-none">
            {weaponList.map((w, idx) => {
              const isSelected = w.id === state.currentWeaponId;
              const slotNum = idx + 1;
              return (
                <button
                  key={w.id}
                  onClick={() => w.unlocked && onSwitchWeapon(w.id)}
                  disabled={!w.unlocked}
                  className={`relative flex flex-col items-center justify-center min-w-[46px] sm:w-14 h-13 sm:h-16 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-950/50 scale-105 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                      : w.unlocked
                      ? 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                      : 'border-slate-800 bg-slate-950/90 opacity-40 cursor-not-allowed'
                  }`}
                  title={`${w.name} [Slot ${slotNum}]`}
                >
                  <span className="absolute top-0.5 left-1 font-mono text-[9px] sm:text-[10px] font-bold text-slate-400">
                    {slotNum}
                  </span>
                  <span className={`font-['Press_Start_2P'] text-[8px] sm:text-[9px] text-center px-0.5 ${isSelected ? 'text-yellow-300' : 'text-slate-200'}`}>
                    {w.id === 'combat_knife' ? 'KNIFE' : w.id === 'pixel_pistol' ? 'PISTOL' : w.id === 'pixel_ak47' ? 'AK47' : w.id === 'pixel_shotgun' ? 'SHOTGUN' : w.id === 'pixel_sniper' ? 'SNIPER' : w.id === 'rocket_jumper' ? 'ROCKET' : 'LASER'}
                  </span>
                  {w.unlocked && (
                    <span className="absolute bottom-0.5 right-1 font-mono text-[8px] sm:text-[9px] text-slate-400">
                      v{w.level}
                    </span>
                  )}
                  {!w.unlocked && (
                    <span className="absolute bottom-0.5 text-[7px] sm:text-[8px] text-amber-500 font-bold">
                      LOCK
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Active Weapon Details & Ammo Counter */}
          <div className="flex flex-col items-end bg-slate-950/85 border-2 border-slate-700 p-2 sm:p-3 shadow-[3px_3px_0px_#000000] w-44 sm:w-60 pointer-events-auto">
            <div className="text-right mb-0.5">
              <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {currentWeapon.category} · LVL {currentWeapon.level}
              </span>
              <div className="font-['Press_Start_2P'] text-[10px] sm:text-xs text-white truncate max-w-[160px] sm:max-w-[210px]">
                {currentWeapon.name}
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
              {isMelee ? (
                <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                  READY
                </span>
              ) : state.isReloading ? (
                <span className="font-mono text-sm sm:text-lg font-bold text-yellow-400 animate-pulse">
                  RELOADING...
                </span>
              ) : (
                <>
                  <span className={`font-mono text-2xl sm:text-3xl font-extrabold tabular-nums ${state.ammoInClip <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {state.ammoInClip}
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums">
                    / {state.reserveAmmo}
                  </span>
                </>
              )}
            </div>

            {!isMelee && state.ammoInClip < currentWeapon.magSize && !state.isReloading && (
              <button
                onClick={onReload}
                className="mt-1 text-[9px] sm:text-[11px] font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-950/40 border border-yellow-600/60 px-2 py-0.5 cursor-pointer"
              >
                TAP [R] TO RELOAD
              </button>
            )}
          </div>
        </div>
      )}

      {/* Flat Control Hint Line (Bottom Safe Margin - hidden on touch screens) */}
      <div className="hidden sm:block w-full text-center text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400/90 pt-0.5">
        <span>WASD Move · Space Jump · Click Shoot · RMB Scope · 1-7 Weapons · R Reload · Esc Pause · B Armory</span>
      </div>
    </div>
  );
};
