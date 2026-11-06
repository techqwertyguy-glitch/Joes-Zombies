import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Crosshair, ArrowUp, Disc, RotateCcw } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onLook: (deltaYaw: number, deltaPitch: number) => void;
  onShootStart: () => void;
  onShootEnd: () => void;
  onJump: () => void;
  onReload: () => void;
  onToggleScope: () => void;
  isScoped: boolean;
  ammoInClip?: number;
  reserveAmmo?: number;
  isReloading?: boolean;
  isMelee?: boolean;
  weaponName?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onLook,
  onShootStart,
  onShootEnd,
  onJump,
  onReload,
  onToggleScope,
  isScoped,
  ammoInClip = 30,
  reserveAmmo = 120,
  isReloading = false,
  isMelee = false,
  weaponName = 'PISTOL',
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const prevLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isFiring, setIsFiring] = useState(false);

  const maxRadius = 45; // max joystick deflection radius in px
  const lookSensitivity = isScoped ? 0.004 : 0.009;

  // -------------------------------------------------------------
  // JOYSTICK TOUCH HANDLERS (Left Half of Screen)
  // -------------------------------------------------------------
  const handleJoystickTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (joystickTouchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      joystickTouchIdRef.current = touch.identifier;

      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      setKnobPos({ x: dx, y: dy });
      onMove(dx / maxRadius, dy / maxRadius);
    },
    [onMove]
  );

  const handleJoystickTouchMove = useCallback(
    (e: TouchEvent) => {
      if (joystickTouchIdRef.current === null || !joystickBaseRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchIdRef.current) {
          const rect = joystickBaseRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          let dx = touch.clientX - centerX;
          let dy = touch.clientY - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
          }

          setKnobPos({ x: dx, y: dy });
          onMove(dx / maxRadius, dy / maxRadius);
          break;
        }
      }
    },
    [onMove]
  );

  const handleJoystickTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (joystickTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          setKnobPos({ x: 0, y: 0 });
          onMove(0, 0);
          break;
        }
      }
    },
    [onMove]
  );

  // -------------------------------------------------------------
  // LOOK SURFACE HANDLERS (Right / Upper Half of Screen)
  // -------------------------------------------------------------
  const handleLookTouchStart = useCallback((e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    prevLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookTouchMove = useCallback(
    (e: TouchEvent) => {
      if (lookTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === lookTouchIdRef.current) {
          const deltaX = touch.clientX - prevLookPosRef.current.x;
          const deltaY = touch.clientY - prevLookPosRef.current.y;
          prevLookPosRef.current = { x: touch.clientX, y: touch.clientY };

          onLook(-deltaX * lookSensitivity, -deltaY * lookSensitivity);
          break;
        }
      }
    },
    [onLook, lookSensitivity]
  );

  const handleLookTouchEnd = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  // Window-level touchmove & touchend listeners for fluid multi-touch tracking
  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
    window.addEventListener('touchcancel', handleJoystickTouchEnd);

    window.addEventListener('touchmove', handleLookTouchMove, { passive: false });
    window.addEventListener('touchend', handleLookTouchEnd);
    window.addEventListener('touchcancel', handleLookTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleJoystickTouchMove);
      window.removeEventListener('touchend', handleJoystickTouchEnd);
      window.removeEventListener('touchcancel', handleJoystickTouchEnd);

      window.removeEventListener('touchmove', handleLookTouchMove);
      window.removeEventListener('touchend', handleLookTouchEnd);
      window.removeEventListener('touchcancel', handleLookTouchEnd);
    };
  }, [
    handleJoystickTouchMove,
    handleJoystickTouchEnd,
    handleLookTouchMove,
    handleLookTouchEnd,
  ]);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-25 overflow-hidden font-['Rajdhani']">
      {/* 1. FULL-SCREEN LOOK TRACKPAD (Swiping anywhere outside joystick/buttons aims the camera) */}
      <div
        onTouchStart={handleLookTouchStart}
        className="absolute inset-0 pointer-events-auto touch-none"
      />

      {/* 2. VIRTUAL JOYSTICK (Bottom Left) */}
      <div className="absolute bottom-6 left-6 pointer-events-auto touch-none">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          className="relative w-32 h-32 rounded-full bg-slate-950/60 border-2 border-white/40 shadow-[0_0_15px_rgba(0,0,0,0.6)] flex items-center justify-center"
        >
          {/* Subtle directional cross indicators */}
          <div className="absolute w-full h-[1px] bg-white/20 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-white/20 pointer-events-none" />

          {/* Moveable Knob */}
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-yellow-200 shadow-[0_0_12px_rgba(245,158,11,0.6)] pointer-events-none flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <Disc className="w-5 h-5 text-amber-950" />
          </div>
        </div>
      </div>

      {/* 3. ACTION BUTTONS CLUSTER (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Compact Ammo & Weapon Tag for Mobile */}
        <div className="bg-slate-950/85 border-2 border-slate-700 px-3 py-1 shadow-[2px_2px_0px_#000] text-right mr-1">
          <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest truncate max-w-[120px]">
            {weaponName}
          </div>
          <div className="flex items-baseline justify-end gap-1 font-mono">
            {isMelee ? (
              <span className="text-xs font-bold text-emerald-400">READY</span>
            ) : isReloading ? (
              <span className="text-xs font-bold text-yellow-400 animate-pulse">RELOAD...</span>
            ) : (
              <>
                <span className={`text-base font-extrabold tabular-nums ${ammoInClip <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {ammoInClip}
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums">/ {reserveAmmo}</span>
              </>
            )}
          </div>
        </div>

        {/* Upper mini action buttons row (Scope & Reload) */}
        <div className="flex items-center gap-3 mr-2">
          {/* Scope Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onToggleScope();
            }}
            onClick={onToggleScope}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer transition-transform active:scale-90 ${
              isScoped
                ? 'bg-cyan-500 border-cyan-200 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                : 'bg-slate-900/80 border-slate-600 text-cyan-400'
            }`}
            title="Toggle Scope"
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onReload();
            }}
            onClick={onReload}
            className="w-12 h-12 rounded-full bg-slate-900/80 active:bg-slate-800 border-2 border-slate-600 text-yellow-400 flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer transition-transform active:scale-90"
            title="Reload Weapon"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Buttons (Jump & Fire) */}
        <div className="flex items-center gap-4">
          {/* Jump Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onJump();
            }}
            onClick={onJump}
            className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-90 border-2 border-yellow-200 text-slate-950 flex flex-col items-center justify-center shadow-[3px_3px_0px_#000] cursor-pointer transition-transform"
            title="Jump"
          >
            <ArrowUp className="w-6 h-6 stroke-[3]" />
            <span className="font-['Press_Start_2P'] text-[8px] font-bold">JUMP</span>
          </button>

          {/* Primary FIRE Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              setIsFiring(true);
              onShootStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setIsFiring(false);
              onShootEnd();
            }}
            onMouseDown={() => {
              setIsFiring(true);
              onShootStart();
            }}
            onMouseUp={() => {
              setIsFiring(false);
              onShootEnd();
            }}
            className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-[4px_4px_0px_#000] cursor-pointer transition-all ${
              isFiring
                ? 'bg-red-500 border-red-200 scale-95 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                : 'bg-gradient-to-br from-red-600 to-rose-700 border-red-300 active:scale-95'
            }`}
            title="Fire Weapon"
          >
            <Crosshair className="w-7 h-7 text-white stroke-[2.5]" />
            <span className="font-['Press_Start_2P'] text-[9px] text-white tracking-widest mt-0.5">
              FIRE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
