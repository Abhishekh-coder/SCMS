import React, { useState, useEffect } from 'react';
import { Search, Command, X, ArrowRight, FileText, User, Building, Home } from 'lucide-react';

export function GlobalSearch({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search modal
          window.dispatchEvent(new CustomEvent('ccms:open-search'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockCategories = [
    { type: 'Complaint', title: 'CMP-2026-089: Water leakage in Boys Hostel B2', icon: FileText, route: '/workspace/complaints/CMP-2026-089' },
    { type: 'Student', title: 'Abhishek Sharma (2024-IT-A-059-STD)', icon: User, route: '/workspace/users/2024-IT-A-059-STD' },
    { type: 'Department', title: 'Department of Information Technology (IT)', icon: Building, route: '/workspace/dept/IT' },
    { type: 'Hostel', title: 'Boys Hostel Block A - Room 401', icon: Home, route: '/workspace/hostel/BOYS-BLOCK-A' },
  ];

  const filtered = query.trim() === '' ? mockCategories : mockCategories.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden glass-card">
        
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-blue-500 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search complaints, students, faculty, departments... (CTRL + K)"
            className="w-full bg-transparent text-slate-900 text-sm placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No results found matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={index}
                  onClick={() => {
                    if (onSelect) onSelect(item);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</p>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.type}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Command className="w-3 h-3 text-slate-500" />
            <span>Navigation Palette</span>
          </div>
          <span>Press ESC to exit</span>
        </div>

      </div>
    </div>
  );
}

export default GlobalSearch;
