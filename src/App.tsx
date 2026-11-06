/**
 * Pixel Gun 3D: Voxel Arena
 * Full-Viewport Game Shell Architecture
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VoxelGunEngine, GameEngineState } from './game/engine';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { ArmoryModal } from './components/ArmoryModal';
import { CharacterCreator } from './components/CharacterCreator';
import { MobileControls } from './components/MobileControls';
import { PauseModal, GameOverModal } from './components/StatusModals';
import { BASE_WEAPONS } from './game/rules';
import { CharacterPartConfig } from './game/characterConfig';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelGunEngine | null>(null);

  // High-level Game Shell State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isCharacterCreatorOpen, setIsCharacterCreatorOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Live HUD Engine State
  const [engineState, setEngineState] = useState<GameEngineState>({
    hp: 100,
    maxHp: 100,
    armor: 50,
    maxArmor: 100,
    score: 0,
    coins: 100,
    wave: 1,
    waveName: 'WAVE 1',
    enemiesRemaining: 0,
    totalWaveEnemies: 0,
    currentWeaponId: 'pixel_ak47',
    weapons: JSON.parse(JSON.stringify(BASE_WEAPONS)),
    ammoInClip: 30,
    reserveAmmo: 120,
    isReloading: false,
    isScoped: false,
    isMuted: false,
    isPointerLocked: false,
    hitmarkerTime: 0,
    isCritHit: false,
    damageFlashTime: 0,
    damageAngle: 0,
  });

  const [gameOverStats, setGameOverStats] = useState({
    score: 0,
    wave: 1,
    kills: 0,
    coins: 0,
  });

  // Sync document body state attribute
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Detect mobile touch screen capability
  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches);
    setIsTouchDevice(isTouch);
    setShowTouchControls(isTouch);
  }, []);

  // Initialize Three.js engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new VoxelGunEngine(canvasMountRef.current);
    engineRef.current = engine;

    engine.setCallbacks(
      (newState) => {
        setEngineState({ ...newState });
      },
      (won, stats) => {
        setGameOverStats(stats);
        setGameState('gameover');
        document.exitPointerLock?.();
      }
    );

    // Check ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
      engine.start();
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Global key bindings for Pause & Armory
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (gameState === 'playing') {
          setGameState('paused');
          document.exitPointerLock?.();
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      } else if (e.key.toLowerCase() === 'b') {
        if (gameState === 'playing' || gameState === 'paused' || gameState === 'title') {
          setIsArmoryOpen((prev) => !prev);
          if (gameState === 'playing') {
            document.exitPointerLock?.();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start Game CTA
  const handleStartGame = useCallback(() => {
    setGameState('playing');
    setIsArmoryOpen(false);
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  // Resume Game from Pause
  const handleResume = useCallback(() => {
    setGameState('playing');
    setIsArmoryOpen(false);
  }, []);

  // Restart Game Match
  const handleRestart = useCallback(() => {
    setGameState('playing');
    setIsArmoryOpen(false);
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  }, []);

  // Return to Main Menu
  const handleMainMenu = useCallback(() => {
    setGameState('title');
    setIsArmoryOpen(false);
    document.exitPointerLock?.();
    if (engineRef.current) {
      engineRef.current.stop();
    }
  }, []);

  // Weapon actions
  const handleSwitchWeapon = useCallback((id: string) => {
    if (engineRef.current) {
      engineRef.current.switchWeapon(id);
    }
  }, []);

  const handleToggleScope = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleScope();
    }
  }, []);

  const handleReload = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reload();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    // Mute toggle handled in engine via M key or button
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
  }, []);

  // Armory actions
  const handleUpgradeWeapon = useCallback((id: string) => {
    if (engineRef.current) {
      engineRef.current.upgradeWeapon(id);
    }
  }, []);

  const handleUnlockWeapon = useCallback((id: string) => {
    if (engineRef.current) {
      engineRef.current.unlockWeapon(id);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white select-none">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenArmory={() => setIsArmoryOpen(true)}
          onOpenCharacterCreator={() => setIsCharacterCreatorOpen(true)}
          coins={engineState.coins}
        />
      )}

      {/* Active Playing HUD */}
      {gameState === 'playing' && (
        <>
          <GameHUD
            state={engineState}
            onSwitchWeapon={handleSwitchWeapon}
            onToggleScope={handleToggleScope}
            onReload={handleReload}
            onToggleMute={handleToggleMute}
            onOpenPause={() => {
              setGameState('paused');
              document.exitPointerLock?.();
            }}
            onOpenArmory={() => {
              setIsArmoryOpen(true);
              document.exitPointerLock?.();
            }}
            onOpenCharacterCreator={() => {
              setIsCharacterCreatorOpen(true);
              document.exitPointerLock?.();
            }}
            isTouchDevice={isTouchDevice}
            showTouchControls={showTouchControls}
            onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          />

          {/* Virtual Mobile Joystick and Touch Action Buttons */}
          {showTouchControls && (
            <MobileControls
              onMove={(x, y) => engineRef.current?.setTouchMove(x, y)}
              onLook={(dyaw, dpitch) => engineRef.current?.setTouchLookDelta(dyaw, dpitch)}
              onShootStart={() => engineRef.current?.setShooting(true)}
              onShootEnd={() => engineRef.current?.setShooting(false)}
              onJump={() => engineRef.current?.triggerJump()}
              onReload={() => engineRef.current?.reload()}
              onToggleScope={() => engineRef.current?.toggleScope()}
              isScoped={engineState.isScoped}
              ammoInClip={engineState.ammoInClip}
              reserveAmmo={engineState.reserveAmmo}
              isReloading={engineState.isReloading}
              isMelee={engineState.weapons[engineState.currentWeaponId]?.category === 'melee'}
              weaponName={engineState.weapons[engineState.currentWeaponId]?.name || 'AK-47'}
            />
          )}
        </>
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && (
        <PauseModal
          score={engineState.score}
          wave={engineState.wave}
          coins={engineState.coins}
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenArmory={() => setIsArmoryOpen(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={gameOverStats}
          onTryAgain={handleRestart}
          onOpenArmory={() => setIsArmoryOpen(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Armory & Weapon Upgrades Modal */}
      {isArmoryOpen && (
        <ArmoryModal
          weapons={engineState.weapons}
          currentWeaponId={engineState.currentWeaponId}
          coins={engineState.coins}
          onUpgradeWeapon={handleUpgradeWeapon}
          onUnlockWeapon={handleUnlockWeapon}
          onEquipWeapon={handleSwitchWeapon}
          onClose={() => setIsArmoryOpen(false)}
        />
      )}

      {/* Voxel Character Creator Modal */}
      {isCharacterCreatorOpen && (
        <CharacterCreator
          onClose={() => setIsCharacterCreatorOpen(false)}
          onSkinEquipped={(newSkin: CharacterPartConfig) => {
            engineRef.current?.setPlayerSkin(newSkin);
          }}
        />
      )}
    </div>
  );
}
