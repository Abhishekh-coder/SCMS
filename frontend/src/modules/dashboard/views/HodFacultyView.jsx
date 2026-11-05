import React, { useState, useEffect } from 'react';
import { Users, Mail, UserCheck, Shield, Layers } from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function HodFacultyView({ user }) {
  const [divisionFaculty, setDivisionFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const deptCode = user?.departmentCode || user?.department || 'IT';

  useEffect(() => {
    fetchFacultyData();
  }, [user]);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/complaints/department-faculty');
      if (res && res.data) {
        setDivisionFaculty(res.data || []);
      }
    } catch (e) {
      console.error('Error fetching department faculty directory:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalFacultyCount = divisionFaculty.reduce(
    (acc, div) => acc + (div.faculty ? div.faculty.length : 0),
    0
  );

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Department of {deptCode} • Academic Directory
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty & Staff</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional assignment directory for Class Incharges and Teacher Guardians across all department divisions.
          </p>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
          {totalFacultyCount} {totalFacultyCount === 1 ? 'Faculty Member' : 'Faculty Members'}
        </span>
      </div>

      {/* ── Directory Content / Empty State ── */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading department faculty directory…</p>
        </div>
      ) : divisionFaculty.length === 0 || totalFacultyCount === 0 ? (
        <div className="py-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Faculty Records</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No faculty assignments are available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {divisionFaculty.map((div) => (
            <div 
              key={div.divisionCode}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Division Title */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 font-mono">Division {div.divisionCode}</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {div.faculty?.length || 0} Assigned
                  </span>
                </div>

                {/* Faculty List for this Division */}
                <div className="divide-y divide-slate-100 pt-1">
                  {div.faculty && div.faculty.length > 0 ? (
                    div.faculty.map((f, idx) => (
                      <div key={f.assignmentUuid || idx} className="py-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{f.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.assignmentType === 'CLASS_INCHARGE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {f.roleLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{f.email}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No assignments configured for this division yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
