import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  PlusCircle, 
  Layers, 
  Home, 
  Dumbbell, 
  UtensilsCrossed, 
  Wrench,
  BookOpen,
  Info,
  CheckCircle2
} from 'lucide-react';
import { CAMPUS_BUILDINGS } from '../analytics/data/ccmsAnalyticsData';

export default function CampusInfoView({ onOpenRegisterForBuilding }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const zones = ['ALL', 'A', 'B', 'C', 'D'];
  const types = [
    { id: 'ALL', label: 'All Locations', icon: Layers },
    { id: 'Academic', label: 'Academic & Labs', icon: BookOpen },
    { id: 'Hostels', label: 'Student Residences', icon: Home },
    { id: 'Dining', label: 'Dining & Cafeteria', icon: UtensilsCrossed },
    { id: 'Sports', label: 'Sports & Fitness', icon: Dumbbell },
    { id: 'Facilities', label: 'Administrative & Admin', icon: Wrench },
  ];

  // Enrich building items with public campus info
  const enrichedBuildings = useMemo(() => {
    return CAMPUS_BUILDINGS.map(b => ({
      ...b,
      hours: b.type === 'Hostels' ? '24/7 Access' : b.type === 'Academic' ? '08:00 AM - 08:00 PM' : '07:00 AM - 10:00 PM',
      helpdesk: '+91 (022) 2800-4' + (Math.floor(Math.random() * 899) + 100),
      facilities: b.type === 'Academic'
        ? ['Smart Classrooms', 'High-Speed Wi-Fi', 'Faculty Cabins', 'Department Labs', 'Restrooms']
        : b.type === 'Hostels'
        ? ['Warden Office', 'Common Room', 'Laundry Room', 'Filtered Water Dispenser']
        : b.type === 'Dining'
        ? ['Main Dining Hall', 'Juice Bar', 'Hygienic Kitchen', 'Hand Wash Stations']
        : b.type === 'Sports'
        ? ['Indoor Badminton', 'Gymnasium', 'Locker Rooms', 'First Aid Station']
        : ['Administrative Office', 'Accounts Section', 'Registrar Desk', 'Visitor Lobby']
    }));
  }, []);

  const filtered = useMemo(() => {
    return enrichedBuildings.filter(b => {
      if (selectedZone !== 'ALL' && b.zone !== selectedZone) return false;
      if (selectedType !== 'ALL' && b.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q) || b.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [enrichedBuildings, selectedZone, selectedType, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* ── Header ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
              Campus Guide & Facilities
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              <Info className="w-3 h-3 text-blue-600" />
              Public Directory
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Campus Information & Locations</h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse campus buildings, service timings, contact points, and report location-based maintenance requests.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search building, block, or facility..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Zone Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Zone:</span>
          {zones.map(z => (
            <button
              key={z}
              type="button"
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedZone === z
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {z === 'ALL' ? 'All Zones' : `Zone ${z}`}
            </button>
          ))}
        </div>
      </div>

      {/* Type Pill Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {types.map(t => {
          const Icon = t.icon;
          const isSelected = selectedType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Building Directory Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(b => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Zone {b.zone} • {b.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {b.shortName}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                {b.name}
              </h3>

              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.hours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">{b.helpdesk}</span>
                </div>
              </div>

              {/* Amenities / Facilities */}
              <div className="mt-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Key Facilities:</p>
                <div className="flex flex-wrap gap-1.5">
                  {b.facilities.map((f, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action: Report Issue at Location */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Encountered an issue?</span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenRegisterForBuilding) {
                    onOpenRegisterForBuilding(b.name);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No facilities matching criteria</h4>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting "All Zones".</p>
        </div>
      )}

    </div>
  );
}
