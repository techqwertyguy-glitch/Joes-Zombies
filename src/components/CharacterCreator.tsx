import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CharacterPartConfig,
  SavedCharacterDesign,
  DEFAULT_CHARACTER,
  CHARACTER_PRESETS,
  getSavedCharacters,
  saveCharacter,
  deleteSavedCharacter,
  getActiveSkin,
  setActiveSkin,
  exportCharacterToJSON,
  importCharacterFromJSON,
} from '../game/characterConfig';
import { buildCustomVoxelCharacter, BuiltVoxelCharacter } from '../game/voxelCharacterBuilder';
import {
  X,
  Save,
  RotateCw,
  Dices,
  Check,
  Trash2,
  Download,
  Upload,
  User,
  Shield,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  FolderOpen,
} from 'lucide-react';

interface CharacterCreatorProps {
  onClose: () => void;
  onSkinEquipped?: (config: CharacterPartConfig) => void;
}

const COLOR_PALETTES = {
  skin: ['#f5c6a5', '#fed7aa', '#e0a96d', '#b47742', '#784622', '#4d7c38', '#cbd5e1', '#1e293b'],
  hair: ['#4a2e18', '#1c1917', '#78350f', '#f59e0b', '#dc2626', '#7c3aed', '#0284c7', '#e2e8f0'],
  armor: ['#1e3a8a', '#2563eb', '#065f46', '#059669', '#dc2626', '#ea580c', '#7c3aed', '#09090b', '#18181b', '#475569', '#f8fafc'],
  accents: ['#f59e0b', '#fbbf24', '#06b6d4', '#38bdf8', '#ec4899', '#f43f5e', '#10b981', '#a855f7', '#f8fafc', '#0f172a'],
};

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onClose, onSkinEquipped }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Configuration state
  const [currentConfig, setCurrentConfig] = useState<CharacterPartConfig>(() => getActiveSkin());
  const [activeTab, setActiveTab] = useState<'head' | 'torso' | 'arms' | 'legs' | 'accessories' | 'saves'>('head');
  const [characterName, setCharacterName] = useState<string>('My Voxel Hero');
  const [savedDesigns, setSavedDesigns] = useState<SavedCharacterDesign[]>(() => getSavedCharacters());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isAutoSpinning, setIsAutoSpinning] = useState(true);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Three.js refs for live turntable
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const charModelRef = useRef<BuiltVoxelCharacter | null>(null);
  const turntableGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);
  const cameraDistanceRef = useRef(3.8);

  // Update 3D model whenever config changes
  const update3DCharacter = useCallback((config: CharacterPartConfig) => {
    if (!sceneRef.current || !turntableGroupRef.current) return;

    if (charModelRef.current) {
      turntableGroupRef.current.remove(charModelRef.current.group);
      charModelRef.current = null;
    }

    const newChar = buildCustomVoxelCharacter(config);
    charModelRef.current = newChar;
    turntableGroupRef.current.add(newChar.group);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, cameraDistanceRef.current);
    camera.lookAt(0, 1.25, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Studio Environment & Lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    const fillLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    scene.add(fillLight);

    // Contact shadow disc under character
    const shadowGeo = new THREE.CircleGeometry(0.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // Turntable pivot group
    const turntable = new THREE.Group();
    scene.add(turntable);
    turntableGroupRef.current = turntable;

    // Build initial character
    update3DCharacter(currentConfig);

    // Animation Loop
    let animId = 0;
    let clock = 0;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      clock += 0.016;

      if (turntableGroupRef.current) {
        if (isAutoSpinning && !isDraggingRef.current) {
          turntableGroupRef.current.rotation.y += 0.012;
        }

        // Idle breathing & gentle arm sway
        if (charModelRef.current) {
          const breath = Math.sin(clock * 2.5) * 0.02;
          charModelRef.current.headGroup.position.y = 1.95 + breath;
          charModelRef.current.torsoGroup.position.y = 1.25 + breath * 0.5;
          charModelRef.current.leftArmGroup.rotation.z = 0.08 + Math.cos(clock * 2.0) * 0.04;
          charModelRef.current.rightArmGroup.rotation.z = -0.08 - Math.cos(clock * 2.0) * 0.04;
        }
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    // Mouse & Touch drag handlers for 360 turntable rotation
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !turntableGroupRef.current) return;
      const deltaX = e.clientX - prevMouseXRef.current;
      prevMouseXRef.current = e.clientX;
      turntableGroupRef.current.rotation.y += deltaX * 0.015;
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDraggingRef.current = true;
        prevMouseXRef.current = e.touches[0].clientX;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !turntableGroupRef.current || e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const deltaX = clientX - prevMouseXRef.current;
      prevMouseXRef.current = clientX;
      turntableGroupRef.current.rotation.y += deltaX * 0.015;
    };
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    // Resize observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);

      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D mesh when currentConfig changes
  useEffect(() => {
    update3DCharacter(currentConfig);
  }, [currentConfig, update3DCharacter]);

  // Adjust zoom
  const handleZoom = (delta: number) => {
    cameraDistanceRef.current = Math.max(2.2, Math.min(5.5, cameraDistanceRef.current + delta));
    if (cameraRef.current) {
      cameraRef.current.position.z = cameraDistanceRef.current;
    }
  };

  // Preset Selection
  const applyPreset = (presetKey: string) => {
    const p = CHARACTER_PRESETS[presetKey];
    if (p) {
      setCurrentConfig({ ...p.config });
      setCharacterName(p.name);
    }
  };

  // Randomize all parts and colors
  const handleRandomize = () => {
    const headStyles: CharacterPartConfig['headStyle'][] = ['hero', 'helmet', 'cyborg', 'zombie', 'knight', 'wizard'];
    const torsoStyles: CharacterPartConfig['torsoStyle'][] = ['vest', 'cyber', 'hoodie', 'tunic', 'harness'];
    const armsStyles: CharacterPartConfig['armsStyle'][] = ['bionic', 'gauntlets', 'sleeved', 'muscular'];
    const legsStyles: CharacterPartConfig['legsStyle'][] = ['combat', 'cyber_boots', 'sabatons', 'sneakers'];
    const accessories: CharacterPartConfig['accessory'][] = ['none', 'jetpack', 'sword', 'cape'];

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const randomCfg: CharacterPartConfig = {
      headStyle: pick(headStyles),
      torsoStyle: pick(torsoStyles),
      armsStyle: pick(armsStyles),
      legsStyle: pick(legsStyles),
      accessory: pick(accessories),

      skinColor: pick(COLOR_PALETTES.skin),
      hairHelmetColor: pick(COLOR_PALETTES.hair),
      torsoPrimaryColor: pick(COLOR_PALETTES.armor),
      torsoSecondaryColor: pick(COLOR_PALETTES.accents),
      armsColor: pick(COLOR_PALETTES.armor),
      glovesColor: pick(COLOR_PALETTES.armor),
      legsColor: pick(COLOR_PALETTES.armor),
      bootsColor: pick(COLOR_PALETTES.armor),
      accentGlowColor: pick(COLOR_PALETTES.accents),
    };

    setCurrentConfig(randomCfg);
    setCharacterName('Custom Block Hero');
  };

  // Save design
  const handleSaveCurrentDesign = (existingId?: string) => {
    const saved = saveCharacter(characterName, currentConfig, existingId);
    setSavedDesigns(getSavedCharacters());
    setSaveSuccessMsg(`Saved "${saved.name}" successfully!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Load design
  const handleLoadDesign = (design: SavedCharacterDesign) => {
    setCurrentConfig({ ...design.config });
    setCharacterName(design.name);
    setSaveSuccessMsg(`Loaded "${design.name}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // Delete design
  const handleDeleteDesign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSavedCharacter(id);
    setSavedDesigns(updated);
  };

  // Equip active skin to game
  const handleEquipActiveSkin = () => {
    setActiveSkin(currentConfig);
    if (onSkinEquipped) {
      onSkinEquipped(currentConfig);
    }
    setSaveSuccessMsg(`Equipped "${characterName}" to game!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // Export JSON
  const handleExportJSON = () => {
    const json = exportCharacterToJSON(characterName, currentConfig);
    navigator.clipboard?.writeText(json);
    setSaveSuccessMsg('Character JSON copied to clipboard!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Import JSON
  const handleImportJSON = () => {
    const result = importCharacterFromJSON(importJsonText);
    if (result) {
      setCurrentConfig(result.config);
      setCharacterName(result.name);
      setShowImportModal(false);
      setImportJsonText('');
      setSaveSuccessMsg(`Imported "${result.name}" successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } else {
      alert('Invalid character JSON format!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-3 md:p-6 bg-black/85 font-['Rajdhani']">
      <div className="relative w-full max-w-6xl h-[94vh] sm:h-[92vh] bg-slate-950 border-4 border-slate-700 shadow-[8px_8px_0px_#000000] flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="flex items-center justify-between p-2.5 sm:p-4 border-b-2 border-slate-800 bg-slate-900/90 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="font-['Press_Start_2P'] text-xs sm:text-sm md:text-base text-yellow-400 truncate">
              CREATOR
            </h2>
            <span className="hidden sm:inline-block text-xs font-bold bg-slate-800 border border-slate-700 px-2.5 py-1 text-slate-300">
              VOXEL BODY BUILDER
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Equip Button */}
            <button
              onClick={handleEquipActiveSkin}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-slate-950 font-['Press_Start_2P'] text-[10px] sm:text-xs px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-emerald-300 shadow-[2px_2px_0px_#000] cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              <span>EQUIP</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-2 border-slate-700 shadow-[2px_2px_0px_#000] cursor-pointer shrink-0"
              title="Close [Esc]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {saveSuccessMsg && (
          <div className="bg-emerald-950/90 border-b-2 border-emerald-500 text-emerald-200 text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* MAIN BODY: 2 COLUMNS (Left: 3D Viewport, Right: Customizer) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT: 3D Turntable Preview (5 Cols) */}
          <div className="lg:col-span-5 relative bg-slate-900 flex flex-col min-h-[200px] h-[240px] sm:h-[280px] lg:h-auto border-b-2 lg:border-b-0 lg:border-r-2 border-slate-800">
            {/* Three.js Canvas Container */}
            <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing touch-none" />

            {/* Turntable Control Overlays */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 bg-slate-950/85 px-2 py-0.5 border border-slate-700">
                DRAG / SWIPE TO ROTATE
              </span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={() => setIsAutoSpinning((p) => !p)}
                className={`p-1.5 border-2 text-xs font-bold cursor-pointer ${
                  isAutoSpinning
                    ? 'border-yellow-400 bg-yellow-950/70 text-yellow-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
                title="Toggle Auto Spin"
              >
                <RotateCw className={`w-4 h-4 ${isAutoSpinning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleZoom(-0.5)}
                className="p-1.5 bg-slate-900 border-2 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(0.5)}
                className="p-1.5 bg-slate-900 border-2 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Preset & Randomize Strip */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>PRESET THEMES:</span>
                <button
                  onClick={handleRandomize}
                  className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 bg-yellow-950/40 border border-yellow-500/60 px-2 py-1 cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>RANDOMIZE</span>
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Object.entries(CHARACTER_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="whitespace-nowrap px-2.5 py-1 text-[11px] font-bold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Customizer Tabs & Body Part Selectors (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 overflow-hidden">
            {/* TAB NAVIGATION */}
            <div className="flex border-b-2 border-slate-800 bg-slate-900/60 overflow-x-auto">
              {[
                { id: 'head', label: '1. HEAD' },
                { id: 'torso', label: '2. TORSO' },
                { id: 'arms', label: '3. ARMS' },
                { id: 'legs', label: '4. LEGS' },
                { id: 'accessories', label: '5. ACCESSORIES' },
                { id: 'saves', label: '6. SAVED (SLOTS)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 min-w-[100px] py-3 px-2 text-xs font-bold tracking-wider border-b-2 cursor-pointer transition-colors ${
                    activeTab === tab.id
                      ? 'border-yellow-400 bg-slate-950 text-yellow-400 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              {/* ================================================= */}
              {/* TAB 1: HEAD */}
              {/* ================================================= */}
              {activeTab === 'head' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
                      VOXEL HEAD STYLE
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {[
                        { id: 'hero', label: 'Classic Hero', desc: 'Hair & Expressive Eyes' },
                        { id: 'helmet', label: 'Tactical Helmet', desc: 'Camo Helm & Visor' },
                        { id: 'cyborg', label: 'Cyborg Skull', desc: 'Cyber Plating & Optic' },
                        { id: 'zombie', label: 'Zombie Ghoul', desc: 'Bloodshot & Tooth' },
                        { id: 'knight', label: 'Knight Helm', desc: 'Iron Plated Visor' },
                        { id: 'wizard', label: 'Wizard Hat', desc: 'Pointed Brim & Beard' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() =>
                            setCurrentConfig((c) => ({
                              ...c,
                              headStyle: style.id as CharacterPartConfig['headStyle'],
                            }))
                          }
                          className={`p-3 text-left border-2 transition-all cursor-pointer ${
                            currentConfig.headStyle === style.id
                              ? 'border-yellow-400 bg-yellow-950/40 shadow-[2px_2px_0px_#000]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{style.label}</div>
                          <div className="text-[11px] text-slate-400">{style.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors: Skin & Hair/Helmet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-850">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Skin Tone
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {COLOR_PALETTES.skin.map((col) => (
                          <button
                            key={col}
                            onClick={() => setCurrentConfig((c) => ({ ...c, skinColor: col }))}
                            className={`w-7 h-7 border-2 cursor-pointer transition-transform ${
                              currentConfig.skinColor === col ? 'border-white scale-110' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={currentConfig.skinColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, skinColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Hair / Helmet Color
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {COLOR_PALETTES.hair.map((col) => (
                          <button
                            key={col}
                            onClick={() => setCurrentConfig((c) => ({ ...c, hairHelmetColor: col }))}
                            className={`w-7 h-7 border-2 cursor-pointer transition-transform ${
                              currentConfig.hairHelmetColor === col ? 'border-white scale-110' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={currentConfig.hairHelmetColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, hairHelmetColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 2: TORSO */}
              {/* ================================================= */}
              {activeTab === 'torso' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
                      VOXEL TORSO & ARMOR STYLE
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {[
                        { id: 'vest', label: 'Tactical Vest', desc: 'Plate Carrier & Pouches' },
                        { id: 'cyber', label: 'Cyber Core', desc: 'Glowing Arc Reactor' },
                        { id: 'hoodie', label: 'Casual Hoodie', desc: 'Zipper & Kangaroo Pouch' },
                        { id: 'tunic', label: 'Knight Tunic', desc: 'Belt & Heraldic Sash' },
                        { id: 'harness', label: 'Leather Harness', desc: 'Crossed Bandoliers' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() =>
                            setCurrentConfig((c) => ({
                              ...c,
                              torsoStyle: style.id as CharacterPartConfig['torsoStyle'],
                            }))
                          }
                          className={`p-3 text-left border-2 transition-all cursor-pointer ${
                            currentConfig.torsoStyle === style.id
                              ? 'border-yellow-400 bg-yellow-950/40 shadow-[2px_2px_0px_#000]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{style.label}</div>
                          <div className="text-[11px] text-slate-400">{style.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-850">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Torso Primary Color
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {COLOR_PALETTES.armor.slice(0, 8).map((col) => (
                          <button
                            key={col}
                            onClick={() => setCurrentConfig((c) => ({ ...c, torsoPrimaryColor: col }))}
                            className={`w-7 h-7 border-2 cursor-pointer transition-transform ${
                              currentConfig.torsoPrimaryColor === col ? 'border-white scale-110' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={currentConfig.torsoPrimaryColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, torsoPrimaryColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Torso Accent / Secondary Color
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {COLOR_PALETTES.accents.slice(0, 8).map((col) => (
                          <button
                            key={col}
                            onClick={() => setCurrentConfig((c) => ({ ...c, torsoSecondaryColor: col }))}
                            className={`w-7 h-7 border-2 cursor-pointer transition-transform ${
                              currentConfig.torsoSecondaryColor === col ? 'border-white scale-110' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={currentConfig.torsoSecondaryColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, torsoSecondaryColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 3: ARMS */}
              {/* ================================================= */}
              {activeTab === 'arms' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
                      VOXEL ARMS & GAUNTLETS
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'sleeved', label: 'Sleeved Shirt', desc: 'Fabric Sleeves & Gloves' },
                        { id: 'gauntlets', label: 'Armored Gauntlets', desc: 'Reinforced Knuckle Plating' },
                        { id: 'bionic', label: 'Bionic Cyber Arm', desc: 'Chrome & Joint Rings' },
                        { id: 'muscular', label: 'Bare Muscular', desc: 'Skin & Athletic Bands' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() =>
                            setCurrentConfig((c) => ({
                              ...c,
                              armsStyle: style.id as CharacterPartConfig['armsStyle'],
                            }))
                          }
                          className={`p-3 text-left border-2 transition-all cursor-pointer ${
                            currentConfig.armsStyle === style.id
                              ? 'border-yellow-400 bg-yellow-950/40 shadow-[2px_2px_0px_#000]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{style.label}</div>
                          <div className="text-[11px] text-slate-400">{style.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-850">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Arms Sleeve Color
                      </label>
                      <input
                        type="color"
                        value={currentConfig.armsColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, armsColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Gloves / Gauntlets Color
                      </label>
                      <input
                        type="color"
                        value={currentConfig.glovesColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, glovesColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 4: LEGS */}
              {/* ================================================= */}
              {activeTab === 'legs' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
                      VOXEL LEGS & FOOTWEAR
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'combat', label: 'Tactical Cargo', desc: 'Knee Pads & Combat Boots' },
                        { id: 'cyber_boots', label: 'Cyber Greaves', desc: 'Heel Thrusters & Plating' },
                        { id: 'sabatons', label: 'Knight Sabatons', desc: 'Iron Segmented Cops' },
                        { id: 'sneakers', label: 'Jeans & Sneakers', desc: 'Cuffed Denim & Rubber Soles' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() =>
                            setCurrentConfig((c) => ({
                              ...c,
                              legsStyle: style.id as CharacterPartConfig['legsStyle'],
                            }))
                          }
                          className={`p-3 text-left border-2 transition-all cursor-pointer ${
                            currentConfig.legsStyle === style.id
                              ? 'border-yellow-400 bg-yellow-950/40 shadow-[2px_2px_0px_#000]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{style.label}</div>
                          <div className="text-[11px] text-slate-400">{style.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-850">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Pants Color
                      </label>
                      <input
                        type="color"
                        value={currentConfig.legsColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, legsColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Boots Color
                      </label>
                      <input
                        type="color"
                        value={currentConfig.bootsColor}
                        onChange={(e) => setCurrentConfig((c) => ({ ...c, bootsColor: e.target.value }))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 5: ACCESSORIES */}
              {/* ================================================= */}
              {activeTab === 'accessories' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
                      BACK ACCESSORY & GLOW ACCENTS
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'none', label: 'None', desc: 'Clean Back' },
                        { id: 'jetpack', label: 'Dual Jetpack', desc: 'Twin Thrusters & Flame Exhaust' },
                        { id: 'sword', label: 'Sheathed Blade', desc: 'Diagonal Katana Across Back' },
                        { id: 'cape', label: 'Flowing Cape', desc: 'Hero / Royal Cape Drape' },
                      ].map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() =>
                            setCurrentConfig((c) => ({
                              ...c,
                              accessory: acc.id as CharacterPartConfig['accessory'],
                            }))
                          }
                          className={`p-3 text-left border-2 transition-all cursor-pointer ${
                            currentConfig.accessory === acc.id
                              ? 'border-yellow-400 bg-yellow-950/40 shadow-[2px_2px_0px_#000]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{acc.label}</div>
                          <div className="text-[11px] text-slate-400">{acc.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-850">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Glow / Energy Accent Hue (Visor, Arc Core, Jetpack Flames)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {COLOR_PALETTES.accents.map((col) => (
                        <button
                          key={col}
                          onClick={() => setCurrentConfig((c) => ({ ...c, accentGlowColor: col }))}
                          className={`w-7 h-7 border-2 cursor-pointer transition-transform ${
                            currentConfig.accentGlowColor === col ? 'border-white scale-110' : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={currentConfig.accentGlowColor}
                      onChange={(e) => setCurrentConfig((c) => ({ ...c, accentGlowColor: e.target.value }))}
                      className="w-full h-8 bg-slate-900 border border-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* TAB 6: SAVED DESIGNS (SLOTS) */}
              {/* ================================================= */}
              {activeTab === 'saves' && (
                <div className="space-y-6">
                  {/* Save current design card */}
                  <div className="bg-slate-900/80 border-2 border-slate-700 p-4">
                    <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
                      SAVE CURRENT DESIGN
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        placeholder="Hero Name..."
                        className="flex-1 bg-slate-950 border-2 border-slate-700 px-3 py-2 text-sm font-bold text-white focus:border-yellow-400 outline-none"
                      />
                      <button
                        onClick={() => handleSaveCurrentDesign()}
                        className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-['Press_Start_2P'] text-xs px-4 py-2 border-2 border-yellow-200 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>SAVE NEW SLOT</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                      <button
                        onClick={handleExportJSON}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>COPY JSON CODE</span>
                      </button>
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>IMPORT JSON CODE</span>
                      </button>
                    </div>
                  </div>

                  {/* Saved design slots list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      SAVED HERO SLOTS ({savedDesigns.length} / 12)
                    </h4>

                    {savedDesigns.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-800 text-slate-500 text-xs font-bold">
                        No custom character slots saved yet. Create a design and click Save above!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {savedDesigns.map((slot) => (
                          <div
                            key={slot.id}
                            onClick={() => handleLoadDesign(slot)}
                            className="group p-3 border-2 border-slate-700 bg-slate-900/60 hover:border-yellow-400 hover:bg-slate-900 cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div>
                              <div className="font-['Press_Start_2P'] text-xs text-white group-hover:text-yellow-400">
                                {slot.name}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {slot.config.headStyle} · {slot.config.torsoStyle} · {slot.config.accessory}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-700/60">
                                LOAD
                              </span>
                              <button
                                onClick={(e) => handleDeleteDesign(slot.id, e)}
                                className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="p-4 bg-slate-900 border-t-2 border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400">
                ACTIVE HERO:{' '}
                <span className="text-white font-['Press_Start_2P'] text-[10px] ml-1">
                  {characterName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSaveCurrentDesign()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 text-xs font-bold cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE DESIGN</span>
                </button>

                <button
                  onClick={handleEquipActiveSkin}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-slate-950 font-['Press_Start_2P'] text-xs border-2 border-emerald-300 shadow-[3px_3px_0px_#000] cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>EQUIP TO ARENA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
          <div className="w-full max-w-lg bg-slate-950 border-4 border-slate-700 p-5 shadow-[6px_6px_0px_#000]">
            <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-3">
              IMPORT CHARACTER JSON
            </h3>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste exported character JSON code here..."
              rows={8}
              className="w-full bg-slate-900 border-2 border-slate-700 p-3 text-xs font-mono text-slate-200 focus:border-yellow-400 outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleImportJSON}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-['Press_Start_2P'] text-xs cursor-pointer"
              >
                APPLY CODE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
