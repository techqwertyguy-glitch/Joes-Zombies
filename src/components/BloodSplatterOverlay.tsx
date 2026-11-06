import React, { useEffect, useState } from 'react';
import { calculateDirectionalDamageSplatter, DirectionalSplatterData } from '../game/rules';

interface BloodSplatterOverlayProps {
  damageFlashTime: number;
  damageAngle: number;
  hp: number;
  maxHp: number;
}

export const BloodSplatterOverlay: React.FC<BloodSplatterOverlayProps> = ({
  damageFlashTime,
  damageAngle,
  hp,
  maxHp,
}) => {
  const [elapsed, setElapsed] = useState(99999);
  const hpRatio = hp / maxHp;
  const isCriticalHp = hpRatio <= 0.3;

  useEffect(() => {
    if (!damageFlashTime || damageFlashTime <= 0) {
      setElapsed(99999);
      return;
    }

    let animId: number;
    const update = () => {
      const diff = performance.now() - damageFlashTime;
      setElapsed(diff);
      if (diff < 850) {
        animId = requestAnimationFrame(update);
      }
    };

    update();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [damageFlashTime]);

  const isSplatterActive = elapsed < 850;
  if (!isSplatterActive && !isCriticalHp) {
    return null;
  }

  const splatterData: DirectionalSplatterData = isSplatterActive
    ? calculateDirectionalDamageSplatter(damageAngle, elapsed, 850)
    : {
        focalX: 50,
        focalY: 50,
        dirX: 0,
        dirY: 0,
        intensity: 0,
        topIntensity: 0,
        rightIntensity: 0,
        bottomIntensity: 0,
        leftIntensity: 0,
        gradientCss: 'none',
      };

  const {
    focalX,
    focalY,
    intensity,
    topIntensity,
    rightIntensity,
    bottomIntensity,
    leftIntensity,
    gradientCss,
  } = splatterData;

  // Critical HP persistent vignette multiplier
  const critPulseOpacity = isCriticalHp ? Math.max(0.2, (0.3 - hpRatio) * 2.2) : 0;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-15 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Dynamic Directional Radial Impact Bleed (intensifies right at the incoming damage angle) */}
      {isSplatterActive && (
        <div
          className="absolute inset-0 transition-opacity duration-75"
          style={{
            background: gradientCss,
            opacity: Math.min(1, intensity * 1.1),
          }}
        />
      )}

      {/* 2. Top Edge Directional Blood Drips & Vignette */}
      <div
        className="absolute top-0 left-0 right-0 h-28 pointer-events-none transition-opacity duration-100"
        style={{
          opacity: Math.max(isCriticalHp ? critPulseOpacity * 0.5 : 0, topIntensity),
          background: 'linear-gradient(to bottom, rgba(185,28,28,0.85) 0%, rgba(127,29,29,0.4) 50%, transparent 100%)',
        }}
      >
        {/* Voxel dripping blocks from ceiling */}
        <svg className="w-full h-full text-red-700/80 fill-current" preserveAspectRatio="none" viewBox="0 0 1000 100">
          <rect x="40" y="0" width="28" height="45" rx="1" />
          <rect x="68" y="0" width="16" height="65" rx="1" />
          <rect x="84" y="0" width="24" height="30" rx="1" />
          <rect x="220" y="0" width="36" height="55" rx="1" />
          <rect x="256" y="0" width="20" height="80" rx="1" />
          <rect x="480" y="0" width="40" height="70" rx="1" />
          <rect x="520" y="0" width="22" height="92" rx="1" />
          <rect x="542" y="0" width="18" height="40" rx="1" />
          <rect x="740" y="0" width="30" height="60" rx="1" />
          <rect x="770" y="0" width="18" height="85" rx="1" />
          <rect x="910" y="0" width="35" height="50" rx="1" />
          <rect x="945" y="0" width="22" height="75" rx="1" />
        </svg>
      </div>

      {/* 3. Bottom Edge Directional Blood Pool & Splatter */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none transition-opacity duration-100"
        style={{
          opacity: Math.max(isCriticalHp ? critPulseOpacity * 0.7 : 0, bottomIntensity),
          background: 'linear-gradient(to top, rgba(185,28,28,0.9) 0%, rgba(127,29,29,0.5) 45%, transparent 100%)',
        }}
      >
        <svg className="w-full h-full text-red-900/90 fill-current" preserveAspectRatio="none" viewBox="0 0 1000 100">
          <rect x="80" y="40" width="35" height="60" rx="1" />
          <rect x="115" y="25" width="25" height="75" rx="1" />
          <rect x="310" y="30" width="45" height="70" rx="1" />
          <rect x="355" y="55" width="30" height="45" rx="1" />
          <rect x="460" y="20" width="30" height="80" rx="1" />
          <rect x="490" y="10" width="40" height="90" rx="1" />
          <rect x="530" y="45" width="35" height="55" rx="1" />
          <rect x="700" y="35" width="40" height="65" rx="1" />
          <rect x="840" y="25" width="30" height="75" rx="1" />
          <rect x="870" y="48" width="40" height="52" rx="1" />
        </svg>
      </div>

      {/* 4. Left Edge Directional Blood Bleed */}
      <div
        className="absolute top-0 bottom-0 left-0 w-28 pointer-events-none transition-opacity duration-100"
        style={{
          opacity: Math.max(isCriticalHp ? critPulseOpacity * 0.5 : 0, leftIntensity),
          background: 'linear-gradient(to right, rgba(185,28,28,0.9) 0%, rgba(127,29,29,0.45) 45%, transparent 100%)',
        }}
      >
        <svg className="w-full h-full text-red-800/85 fill-current" preserveAspectRatio="none" viewBox="0 0 100 1000">
          <rect x="0" y="120" width="60" height="30" rx="1" />
          <rect x="0" y="150" width="85" height="20" rx="1" />
          <rect x="0" y="320" width="55" height="40" rx="1" />
          <rect x="0" y="360" width="90" height="25" rx="1" />
          <rect x="0" y="540" width="70" height="35" rx="1" />
          <rect x="0" y="575" width="95" height="20" rx="1" />
          <rect x="0" y="760" width="65" height="30" rx="1" />
          <rect x="0" y="790" width="85" height="24" rx="1" />
        </svg>
      </div>

      {/* 5. Right Edge Directional Blood Bleed */}
      <div
        className="absolute top-0 bottom-0 right-0 w-28 pointer-events-none transition-opacity duration-100"
        style={{
          opacity: Math.max(isCriticalHp ? critPulseOpacity * 0.5 : 0, rightIntensity),
          background: 'linear-gradient(to left, rgba(185,28,28,0.9) 0%, rgba(127,29,29,0.45) 45%, transparent 100%)',
        }}
      >
        <svg className="w-full h-full text-red-800/85 fill-current" preserveAspectRatio="none" viewBox="0 0 100 1000">
          <rect x="40" y="100" width="60" height="32" rx="1" />
          <rect x="15" y="132" width="85" height="22" rx="1" />
          <rect x="35" y="300" width="65" height="38" rx="1" />
          <rect x="10" y="338" width="90" height="24" rx="1" />
          <rect x="25" y="520" width="75" height="35" rx="1" />
          <rect x="5" y="555" width="95" height="22" rx="1" />
          <rect x="30" y="740" width="70" height="30" rx="1" />
          <rect x="15" y="770" width="85" height="25" rx="1" />
        </svg>
      </div>

      {/* 6. Dynamic Focal Point Voxel Splatter Cluster (centered exactly at incoming damage angle) */}
      {isSplatterActive && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${focalX}%`,
            top: `${focalY}%`,
            opacity: intensity,
            transform: `translate(-50%, -50%) rotate(${damageAngle}deg) scale(${0.8 + intensity * 0.4})`,
            transition: 'transform 80ms ease-out',
          }}
        >
          {/* Authentic Voxel/Pixel Art Blood Burst Pattern */}
          <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-[0_0_12px_rgba(220,38,38,0.9)]">
            {/* Core impact blob (deep crimson) */}
            <rect x="95" y="95" width="30" height="30" fill="#7f1d1d" />
            <rect x="85" y="102" width="10" height="16" fill="#991b1b" />
            <rect x="125" y="102" width="10" height="16" fill="#991b1b" />
            <rect x="102" y="85" width="16" height="10" fill="#991b1b" />
            <rect x="102" y="125" width="16" height="10" fill="#991b1b" />

            {/* Bright arterial droplets flying inward into viewport */}
            <rect x="105" y="50" width="10" height="18" fill="#ef4444" />
            <rect x="107" y="30" width="6" height="12" fill="#f87171" />
            <rect x="108" y="15" width="4" height="8" fill="#dc2626" />

            <rect x="135" y="65" width="12" height="14" fill="#dc2626" />
            <rect x="155" y="50" width="8" height="10" fill="#ef4444" />
            <rect x="172" y="38" width="6" height="6" fill="#f87171" />

            <rect x="68" y="68" width="14" height="12" fill="#dc2626" />
            <rect x="50" y="55" width="10" height="8" fill="#ef4444" />
            <rect x="36" y="42" width="6" height="6" fill="#f87171" />

            <rect x="55" y="115" width="16" height="8" fill="#991b1b" />
            <rect x="35" y="120" width="10" height="6" fill="#dc2626" />

            <rect x="145" y="115" width="16" height="8" fill="#991b1b" />
            <rect x="175" y="120" width="10" height="6" fill="#dc2626" />

            <rect x="80" y="145" width="12" height="16" fill="#7f1d1d" />
            <rect x="128" y="145" width="12" height="16" fill="#7f1d1d" />
            <rect x="106" y="165" width="8" height="14" fill="#991b1b" />
          </svg>
        </div>
      )}

      {/* 7. Critical Low HP Persistent Pulsing Vein Perimeter */}
      {isCriticalHp && (
        <div
          className="absolute inset-0 pointer-events-none border-[12px] border-red-700/50 shadow-[inset_0_0_100px_rgba(185,28,28,0.7)] animate-pulse"
          style={{ opacity: critPulseOpacity }}
        />
      )}
    </div>
  );
};
