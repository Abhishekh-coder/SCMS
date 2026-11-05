import React, { useState, useMemo } from 'react';
import { 
  Map as MapIcon, 
  Layers, 
  Building, 
  Home, 
  Dumbbell, 
  UtensilsCrossed, 
  Wrench, 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  X, 
  Check, 
  AlertCircle, 
  ListFilter, 
  Navigation, 
  ChevronRight,
  Info
} from 'lucide-react';
import { CAMPUS_BUILDINGS } from '../analytics/data/ccmsAnalyticsData';
import campusMapUserImg from '../../assets/campus_map_user.jpg';

export default function CampusMapView({ onSelectBuildingComplaints, onRegisterForBuilding }) {
  const [viewMode, setViewMode] = useState('MAP'); // 'MAP' | 'LIST'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const typeFilters = [
    { id: 'All', label: 'All Facilities', icon: Layers },
    { id: 'Academic', label: 'Academic', icon: Building },
    { id: 'Hostels', label: 'Hostels', icon: Home },
    { id: 'Sports', label: 'Sports', icon: Dumbbell },
    { id: 'Dining', label: 'Dining', icon: UtensilsCrossed },
    { id: 'Facilities', label: 'Facilities', icon: Wrench },
  ];

  const zones = ['All', 'A', 'B', 'C', 'D'];

  const filteredBuildings = useMemo(() => {
    return CAMPUS_BUILDINGS.filter((b) => {
      if (selectedType !== 'All' && b.type !== selectedType) return false;
      if (selectedZone !== 'All' && b.zone !== selectedZone) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q) || b.type.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedType, selectedZone, searchQuery]);

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(0.8, prev + delta), 1.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setActiveBuilding(null);
    setSelectedType('All');
    setSelectedZone('All');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <MapIcon className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Map & Locations</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Navigate college facilities, check active maintenance cases, and identify building zones.
          </p>
        </div>

        {/* View Toggle: Visual Map vs Accessible List */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('MAP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'MAP'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('LIST')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Accessible List</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search building, hostel, or facility..."
            className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Facility Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {typeFilters.map((tf) => {
            const Icon = tf.icon;
            const isSelected = selectedType === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => setSelectedType(tf.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-semibold mr-1">Zone:</span>
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setSelectedZone(z)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedZone === z
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {z}
            </button>
          ))}
          {(selectedType !== 'All' || selectedZone !== 'All' || searchQuery || activeBuilding) && (
            <button
              type="button"
              onClick={handleReset}
              className="ml-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Reset All Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ── Main View Area: Interactive Map OR Accessible List ── */}
      {viewMode === 'MAP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Map Canvas Card (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 relative min-h-[500px] flex flex-col justify-between overflow-hidden shadow-xs">
            
            {/* Top Overlay Legend */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-white/95 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                Showing {filteredBuildings.length} of {CAMPUS_BUILDINGS.length} Buildings
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/95 p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleZoom(0.1)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(-0.1)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative my-4 flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-200 min-h-[420px]">
              <div 
                className="relative transition-transform duration-300 w-full h-full flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Background Map Graphic */}
                <img 
                  src={campusMapUserImg} 
                  alt="College Campus Aerial Layout" 
                  className="max-h-[420px] w-auto object-contain opacity-90 rounded-lg select-none pointer-events-none" 
                />

                {/* Building Markers */}
                {filteredBuildings.map((b) => {
                  const isSelected = activeBuilding?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveBuilding(isSelected ? null : b)}
                      style={{ top: b.pos.top, left: b.pos.left }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all cursor-pointer z-20 ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                      }`}
                      aria-label={`${b.name}, ${b.count} active complaints`}
                    >
                      <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-white ring-4 ring-blue-500/20'
                          : 'bg-white/95 text-slate-800 border-slate-300 hover:border-blue-500 hover:text-blue-600'
                      }`}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color || '#3b82f6' }} />
                        <span className="max-w-[120px] truncate">{b.shortName}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                          {b.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Click on any building marker to inspect details, floor levels, and complaints.
            </p>

          </div>

          {/* Building Details Sidebar Card (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
            {activeBuilding ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Zone {activeBuilding.zone} • {activeBuilding.type}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                      {activeBuilding.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveBuilding(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Close Details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Active Grievances</span>
                    <span className="font-bold text-slate-900 text-base">{activeBuilding.count}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Building Type</span>
                    <span className="font-semibold text-slate-800">{activeBuilding.type}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Campus Zone</span>
                    <span className="font-semibold text-slate-800">Zone {activeBuilding.zone}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Floor Guidelines</p>
                  <p className="text-[11px] text-slate-500">Floors G, 1, 2, and 3 are mapped for grievance routing.</p>
                </div>

                <div className="pt-2 space-y-2">
                  {onSelectBuildingComplaints && (
                    <button
                      type="button"
                      onClick={() => onSelectBuildingComplaints(activeBuilding)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inspect Building Complaints</span>
                    </button>
                  )}
                  {onRegisterForBuilding && (
                    <button
                      type="button"
                      onClick={() => onRegisterForBuilding(activeBuilding)}
                      className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Report Issue in this Building</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Building Selected</h4>
                <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                  Click any building on the map or search from the top toolbar to view complaints.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ── Accessible List Table Alternative ── */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Campus Facilities Directory ({filteredBuildings.length})</h3>
            <span className="text-xs text-slate-500">Accessible tabular view for keyboard and screen readers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Building Name</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Active Cases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredBuildings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color || '#3b82f6' }} />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      Zone {b.zone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.type}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {b.count} cases
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBuilding(b);
                          setViewMode('MAP');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                      >
                        <span>Focus on Map</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
