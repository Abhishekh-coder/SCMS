import React from 'react';

export default function ActionableInsightsCard({ complaints = [], role = 'TEACHER_GUARDIAN' }) {
  const total = complaints.length || 0;

  // 1. Category aggregation
  const categoryMap = {};
  complaints.forEach(c => {
    const raw = (c.categoryCode || 'ACADEMICS').replace(/_/g, ' ');
    const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    categoryMap[name] = (categoryMap[name] || 0) + 1;
  });

  const catEntries = Object.entries(categoryMap);
  const cat1 = catEntries[0] ? catEntries[0][0] : 'Academics';
  const val1 = catEntries[0] ? catEntries[0][1] : 4;

  const cat2 = catEntries[1] ? catEntries[1][0] : 'Category';
  const val2 = catEntries[1] ? catEntries[1][1] : 9;

  const cat3 = catEntries[2] ? catEntries[2][0] : '3 Months';
  const val3 = catEntries[2] ? catEntries[2][1] : 6;

  // 2. Priority breakdown
  const critical = complaints.filter(c => c.priority === 'CRITICAL').length;
  const high = complaints.filter(c => c.priority === 'HIGH' || c.priority === 'URGENT').length;
  const medLow = complaints.filter(c => ['MEDIUM', 'LOW'].includes(c.priority) || !c.priority).length;

  const pTotal = (critical + high + medLow) || 1;

  // Slices for Pie Chart
  // Slice 1: Teal (#6ec1b6)
  // Slice 2: Orange (#d98246)
  // Slice 3: Charcoal (#63484c)
  const slice1Percent = high > 0 ? high / pTotal : 0.25;
  const slice2Percent = medLow > 0 ? medLow / pTotal : 0.20;
  const slice3Percent = 1 - (slice1Percent + slice2Percent);

  // SVG Pie path calculation
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  let cumulativePercent = 0;
  const makeSlice = (percent, color) => {
    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
    cumulativePercent += percent;
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    const pathData = [
      `M 0 0`,
      `L ${startX * 40} ${startY * 40}`,
      `A 40 40 0 ${largeArcFlag} 1 ${endX * 40} ${endY * 40}`,
      `Z`
    ].join(' ');
    return <path d={pathData} fill={color} />;
  };

  cumulativePercent = 0;

  return (
    <div className="bg-[#faf8f5] rounded-[28px] p-5 sm:p-6 border border-[#ece6de] shadow-xs w-full h-full flex flex-col justify-between box-border">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Actionable Insights
        </h3>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pt-1 pb-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#6ec1b6] inline-block" />
            <span>Complaints</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#d98246] inline-block" />
            <span>by Category</span>
          </span>
        </div>
        <span className="font-semibold text-slate-800 mr-4">Priority</span>
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-12 gap-3 items-end pt-1 flex-1">
        
        {/* Bar Chart Section */}
        <div className="col-span-8 flex items-end">
          {/* Y-Axis numbers */}
          <div className="flex flex-col justify-between h-28 pr-2 text-[10px] font-mono text-slate-400 select-none pb-5">
            <span>9</span>
            <span>8</span>
            <span>7</span>
            <span>6</span>
            <span>5</span>
            <span>4</span>
            <span>3</span>
            <span>2</span>
            <span>1</span>
            <span>0</span>
          </div>

          {/* Bars Container */}
          <div className="flex-1 flex items-end justify-around h-28 border-b border-slate-200/80 pb-0.5">
            
            {/* Group 1 */}
            <div className="flex flex-col items-center justify-end h-full group">
              <div className="flex items-end gap-1 h-full pb-1">
                <div className="w-4 sm:w-5 bg-[#6ec1b6] rounded-t-xs" style={{ height: `${Math.min(val1 * 10, 90)}%` }} />
                <div className="w-4 sm:w-5 bg-[#63484c] rounded-t-xs" style={{ height: '80%' }} />
              </div>
              <span className="text-[10px] font-medium text-slate-700 truncate max-w-[50px] text-center mt-1">
                {cat1}
              </span>
            </div>

            {/* Group 2 */}
            <div className="flex flex-col items-center justify-end h-full group">
              <div className="flex items-end gap-1 h-full pb-1">
                <div className="w-4 sm:w-5 bg-[#6ec1b6] rounded-t-xs" style={{ height: `${Math.min(val2 * 10, 95)}%` }} />
                <div className="w-4 sm:w-5 bg-[#d98246] rounded-t-xs" style={{ height: '60%' }} />
              </div>
              <span className="text-[10px] font-medium text-slate-700 truncate max-w-[50px] text-center mt-1">
                {cat2}
              </span>
            </div>

            {/* Group 3 */}
            <div className="flex flex-col items-center justify-end h-full group">
              <div className="flex items-end gap-1 h-full pb-1">
                <div className="w-4 sm:w-5 bg-[#6ec1b6] rounded-t-xs" style={{ height: `${Math.min(val3 * 10, 65)}%` }} />
                <div className="w-4 sm:w-5 bg-[#63484c] rounded-t-xs" style={{ height: '50%' }} />
              </div>
              <span className="text-[10px] font-medium text-slate-700 truncate max-w-[50px] text-center mt-1">
                {cat3}
              </span>
            </div>

          </div>
        </div>

        {/* Priority Pie Chart Section */}
        <div className="col-span-4 flex flex-col items-center justify-center pb-2">
          <div className="w-20 h-20 sm:w-22 sm:h-22">
            <svg viewBox="-45 -45 90 90" className="w-full h-full transform -rotate-90">
              {makeSlice(slice1Percent, '#6ec1b6')}
              {makeSlice(slice2Percent, '#d98246')}
              {makeSlice(slice3Percent, '#63484c')}
            </svg>
          </div>
        </div>

      </div>

    </div>
  );
}
