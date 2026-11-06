import React, { useState } from 'react';
import { WeaponStats } from '../game/rules';
import { X, Check, Lock, ChevronUp, Sparkles } from 'lucide-react';

interface ArmoryModalProps {
  weapons: Record<string, WeaponStats>;
  currentWeaponId: string;
  coins: number;
  onUpgradeWeapon: (id: string) => void;
  onUnlockWeapon: (id: string) => void;
  onEquipWeapon: (id: string) => void;
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  weapons,
  currentWeaponId,
  coins,
  onUpgradeWeapon,
  onUnlockWeapon,
  onEquipWeapon,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const weaponList = Object.values(weapons);

  const categories = [
    { id: 'all', label: 'ALL WEAPONS' },
    { id: 'primary', label: 'PRIMARY' },
    { id: 'backup', label: 'BACKUP' },
    { id: 'melee', label: 'MELEE' },
    { id: 'sniper', label: 'SNIPER' },
    { id: 'special', label: 'SPECIAL & HEAVY' },
  ];

  const filtered = selectedCategory === 'all'
    ? weaponList
    : weaponList.filter((w) => w.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-black/85 font-['Rajdhani']">
      <div className="relative w-full max-w-4xl bg-slate-950 border-4 border-slate-700 p-3 sm:p-6 shadow-[8px_8px_0px_#000000] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 sm:pb-4 border-b-2 border-slate-800 gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="font-['Press_Start_2P'] text-xs sm:text-base md:text-lg text-yellow-400">
              PIXEL ARMORY
            </h2>
            <span className="text-[10px] sm:text-xs font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 sm:py-1 text-slate-300">
              UPGRADES & UNLOCKS
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Coin balance */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border-2 border-yellow-500/80 px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#000]">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center font-bold text-[8px] sm:text-[9px] text-yellow-950">
                $
              </div>
              <span className="font-['Press_Start_2P'] text-[10px] sm:text-xs text-yellow-300 tabular-nums">
                {coins}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-2 border-slate-700 shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 sm:gap-2 py-2 sm:py-3 border-b border-slate-800 overflow-x-auto scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold tracking-wider border-2 cursor-pointer transition-colors ${
                selectedCategory === c.id
                  ? 'border-yellow-400 bg-yellow-950/60 text-yellow-300 shadow-[2px_2px_0px_#000]'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Weapon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-y-auto max-h-[60vh] pr-2">
          {filtered.map((w) => {
            const isEquipped = w.id === currentWeaponId;
            const upgradeCost = Math.round((w.cost || 100) * 0.5 * (w.level + 1) + 50);
            const canAffordUpgrade = coins >= upgradeCost;
            const canAffordUnlock = coins >= w.cost;

            return (
              <div
                key={w.id}
                className={`relative flex flex-col justify-between p-4 border-2 ${
                  isEquipped
                    ? 'border-yellow-400 bg-slate-900/90 shadow-[4px_4px_0px_#000]'
                    : w.unlocked
                    ? 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    : 'border-slate-800 bg-slate-950/80 opacity-80'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {w.category} · {w.isAutomatic ? 'AUTOMATIC' : 'SEMI-AUTO'}
                    </span>
                    <h3 className="font-['Press_Start_2P'] text-xs text-white mt-1">
                      {w.name}
                    </h3>
                  </div>

                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-600/60 px-2 py-0.5">
                    LVL {w.level}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 my-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">DAMAGE:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {w.damage} {w.pellets > 1 ? `x${w.pellets}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">FIRE RATE:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {w.fireRate}/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MAGAZINE:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {w.magSize === 1 && w.category === 'melee' ? '∞' : w.magSize}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">RANGE:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {w.range}m
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {w.unlocked ? (
                    <>
                      <button
                        onClick={() => onEquipWeapon(w.id)}
                        disabled={isEquipped}
                        className={`flex-1 py-1.5 text-xs font-bold tracking-wider border-2 cursor-pointer transition-colors ${
                          isEquipped
                            ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 cursor-default'
                            : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {isEquipped ? (
                          <span className="flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </span>
                        ) : (
                          'EQUIP'
                        )}
                      </button>

                      <button
                        onClick={() => onUpgradeWeapon(w.id)}
                        disabled={!canAffordUpgrade}
                        className={`flex-1 py-1.5 text-xs font-bold tracking-wider border-2 flex items-center justify-center gap-1 transition-colors ${
                          canAffordUpgrade
                            ? 'border-yellow-500 bg-yellow-950/60 hover:bg-yellow-900/80 text-yellow-300 cursor-pointer'
                            : 'border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed'
                        }`}
                        title="Upgrade weapon stats by 15%"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>UPGRADE (${upgradeCost})</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onUnlockWeapon(w.id)}
                      disabled={!canAffordUnlock}
                      className={`w-full py-2 text-xs font-['Press_Start_2P'] flex items-center justify-center gap-2 border-2 transition-colors ${
                        canAffordUnlock
                          ? 'border-yellow-400 bg-yellow-500 hover:bg-yellow-400 text-slate-950 cursor-pointer shadow-[3px_3px_0px_#000]'
                          : 'border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>UNLOCK (${w.cost})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-slate-800 text-center text-xs font-bold text-slate-400">
          Earn gold coins by eliminating enemies and clearing waves!
        </div>
      </div>
    </div>
  );
};
