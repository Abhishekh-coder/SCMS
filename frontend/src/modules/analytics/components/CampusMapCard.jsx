import React, { useState } from 'react';
import { 
  Map as MapIcon, Layers, Building, Home, 
  Dumbbell, UtensilsCrossed, Wrench, Plus, Minus, Crosshair, 
  Navigation2, RotateCcw 
} from 'lucide-react';
import campusMapUserImg from '../../../assets/campus_map_user.jpg';

export default function CampusMapCard({
  buildings = [],
  buildingStats = {},
  activeBuilding,
  onToggleBuilding,
  hoveredBuilding,
  onHoverBuilding,
  severityCounts = {},
  activeSeverity,
  onToggleSeverity,
  activeZone,
  onToggleZone,
  activeType,
  onToggleType,
  highlightedBuildingsFromOther = []
}) {
  const [mapMode, setMapMode] = useState('2D');
  const [zoomLevel, setZoomLevel] = useState(1);

  const zones = ['All', 'A', 'B', 'C', 'D'];

  const typeFilters = [
    { id: 'All', label: 'All', icon: Layers },
    { id: 'Academic', label: 'Academic', icon: Building },
    { id: 'Hostels', label: 'Hostels', icon: Home },
    { id: 'Sports', label: 'Sports', icon: Dumbbell },
    { id: 'Dining', label: 'Dining', icon: UtensilsCrossed },
    { id: 'Facilities', label: 'Facilities', icon: Wrench },
  ];

  const severities = [
    { id: 'Critical', label: 'Critical', color: '#f43f5e', count: severityCounts?.Critical ?? 22 },
    { id: 'High', label: 'High', color: '#f59e0b', count: severityCounts?.High ?? 28 },
    { id: 'Medium', label: 'Medium', color: '#38bdf8', count: severityCounts?.Medium ?? 18 },
    { id: 'Low', label: 'Low', color: '#10b981', count: severityCounts?.Low ?? 6 },
  ];

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(0.85, prev + delta), 1.4));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    if (activeBuilding) onToggleBuilding(null);
    if (activeZone) onToggleZone(null);
    if (activeType && activeType !== 'All') onToggleType('All');
  };

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 h-full flex flex-col justify-between select-none relative overflow-hidden">
      
      {/* 1. Header Bar with Category Filters & View Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-20">
        
        {/* Left Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Campus Map
            </h3>
            <p className="text-[11px] text-slate-500">
              Click on a building to view complaints
            </p>
          </div>
        </div>

        {/* Center Facility Type Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          {typeFilters.map((tf) => {
            const Icon = tf.icon;
            const isTypeActive = activeType === tf.id || (!activeType && tf.id === 'All');

            return (
              <button
                key={tf.id}
                onClick={() => onToggleType && onToggleType(tf.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isTypeActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Reset View & 2D / 3D Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset View</span>
          </button>

          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => setMapMode('2D')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                mapMode === '2D'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setMapMode('3D')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                mapMode === '3D'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3D
            </button>
          </div>
        </div>

      </div>

      {/* 2. Main Map Canvas Area */}
      <div className="relative w-full h-[460px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        
        {/* Render Map Background with Zoom scaling */}
        <div 
          className="w-full h-full relative transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={campusMapUserImg}
            alt="Campus Map"
            className="w-full h-full object-cover brightness-95 contrast-105"
          />

          {/* Compass Rose Indicator (Top Left) */}
          <div className="absolute top-4 left-16 z-20 flex flex-col items-center pointer-events-none opacity-80">
            <Navigation2 className="w-4 h-4 text-blue-600 -rotate-45" />
            <span className="text-[10px] font-bold text-slate-600 mt-0.5">N</span>
          </div>

          {/* Floating Interactive Building Markers (Circle Badge + Capsule Pill) */}
          {buildings.map((bldg) => {
            const stats = buildingStats[bldg.name] || { total: bldg.count, critical: 0, resolved: 0 };
            const isActive = activeBuilding === bldg.name;
            const isHovered = hoveredBuilding === bldg.name;
            const isCrossHighlighted = highlightedBuildingsFromOther.includes(bldg.name);

            if (activeZone && activeZone !== 'All' && bldg.zone !== activeZone) {
              return null;
            }

            if (activeType && activeType !== 'All' && bldg.type !== activeType) {
              return null;
            }

            return (
              <div
                key={bldg.id}
                style={{ top: bldg.pos.top, left: bldg.pos.left }}
                onClick={() => onToggleBuilding(isActive ? null : bldg.name)}
                onMouseEnter={() => onHoverBuilding && onHoverBuilding(bldg.name)}
                onMouseLeave={() => onHoverBuilding && onHoverBuilding(null)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-200 flex items-center ${
                  isActive || isHovered || isCrossHighlighted ? 'scale-110 z-30' : 'hover:scale-105'
                }`}
              >
                {/* Circular Number Count Pin */}
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md shrink-0 z-10"
                  style={{ backgroundColor: bldg.color }}
                >
                  {stats.total}
                </div>

                {/* Attached Light Capsule Pill Label */}
                <div 
                  className={`-ml-2 pl-3.5 pr-2.5 py-1 rounded-lg backdrop-blur-md text-left shadow-md transition-all border ${
                    isActive
                      ? 'bg-white text-blue-700 ring-2 ring-blue-500/30 border-blue-300'
                      : isHovered || isCrossHighlighted
                      ? 'bg-white text-slate-900 border-slate-300'
                      : 'bg-white/95 text-slate-800 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <p className="text-[10px] font-bold tracking-tight whitespace-nowrap leading-tight">
                    {bldg.name}
                  </p>
                </div>

                {/* Hover Tooltip Details */}
                {isHovered && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 text-left pointer-events-none animate-in fade-in">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900">{bldg.shortName}</span>
                      <span className="text-[10px] font-mono text-blue-600 font-bold">Zone {bldg.zone}</span>
                    </div>
                    <div className="mt-1.5 space-y-1 text-[10px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Complaints:</span>
                        <span className="font-bold text-slate-900">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical Priority:</span>
                        <span className="font-bold text-rose-600">{stats.critical || 2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Facility Type:</span>
                        <span className="font-bold text-blue-600">{bldg.type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Floating Left Vertical Zone Slider: [ All | A | B | C | D ] */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200">
          {zones.map((zone) => {
            const isZoneActive = activeZone === zone || (!activeZone && zone === 'All');

            return (
              <button
                key={zone}
                onClick={() => onToggleZone && onToggleZone(zone === 'All' ? null : zone)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isZoneActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {zone}
              </button>
            );
          })}
        </div>

        {/* 4. Floating Top-Right Severity Legend */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-slate-200 space-y-1.5 min-w-[105px]">
          {severities.map((item) => {
            const isSevActive = activeSeverity === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onToggleSeverity && onToggleSeverity(isSevActive ? null : item.id)}
                className={`flex items-center justify-between gap-3 text-xs cursor-pointer px-1.5 py-0.5 rounded-md transition-colors ${
                  isSevActive ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* 5. Floating Bottom-Right Map Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200">
          <button
            onClick={() => handleZoom(0.15)}
            className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition border-t border-slate-200 cursor-pointer"
            title="Recenter"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
