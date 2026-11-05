// Comprehensive Institutional Analytics Dataset for CCMS Visualization Tool
// Completely isolated client-side mock data for Power BI style visualization dashboard.

export const CAMPUS_BUILDINGS = [
  {
    id: 'Sports Arena & Gymnasium',
    name: 'Sports Arena & Gymnasium',
    shortName: 'Sports Arena',
    zone: 'D',
    type: 'Sports',
    color: '#f43f5e', // Pink/Rose
    pos: { top: '34%', left: '26%' },
    count: 24
  },
  {
    id: 'Library & Reading Hall',
    name: 'Library & Reading Hall',
    shortName: 'Library',
    zone: 'A',
    type: 'Academic',
    color: '#10b981', // Emerald
    pos: { top: '53%', left: '24%' },
    count: 32
  },
  {
    id: 'Central Admin Block',
    name: 'Central Admin Block',
    shortName: 'Admin Block',
    zone: 'C',
    type: 'Facilities',
    color: '#10b981', // Emerald
    pos: { top: '69%', left: '33%' },
    count: 48
  },
  {
    id: 'Hostel Block C (Girls)',
    name: 'Hostel Block C (Girls)',
    shortName: 'Hostel Block C',
    zone: 'B',
    type: 'Hostels',
    color: '#f43f5e', // Pink
    pos: { top: '27%', left: '46%' },
    count: 42
  },
  {
    id: 'Academic Complex',
    name: 'Academic Complex',
    shortName: 'Academic Complex',
    zone: 'A',
    type: 'Academic',
    color: '#f59e0b', // Amber
    pos: { top: '45%', left: '50%' },
    count: 145
  },
  {
    id: 'Hostel Block B (Boys)',
    name: 'Hostel Block B (Boys)',
    shortName: 'Hostel Block B',
    zone: 'B',
    type: 'Hostels',
    color: '#f59e0b', // Amber
    pos: { top: '36%', left: '72%' },
    count: 38
  },
  {
    id: 'Student Mess & Cafeteria',
    name: 'Student Mess & Cafeteria',
    shortName: 'Mess & Cafeteria',
    zone: 'C',
    type: 'Dining',
    color: '#f59e0b', // Amber
    pos: { top: '57%', left: '69%' },
    count: 52
  },
  {
    id: 'Hostel Block A (Boys)',
    name: 'Hostel Block A (Boys)',
    shortName: 'Hostel Block A',
    zone: 'B',
    type: 'Hostels',
    color: '#f59e0b', // Amber
    pos: { top: '74%', left: '55%' },
    count: 44
  },
  {
    id: 'Maintenance & Utilities',
    name: 'Maintenance & Utilities',
    shortName: 'Maintenance',
    zone: 'D',
    type: 'Facilities',
    color: '#10b981', // Emerald
    pos: { top: '63%', left: '87%' },
    count: 55
  }
];

export const CATEGORIES = [
  { id: 'Infrastructure & Labs', label: 'Infrastructure & Labs', color: '#a855f7', icon: 'Wrench' },
  { id: 'Hostel & Living', label: 'Hostel & Living', color: '#3b82f6', icon: 'Home' },
  { id: 'IT & WiFi Services', label: 'IT & WiFi Services', color: '#06b6d4', icon: 'Wifi' },
  { id: 'Mess & Food Quality', label: 'Mess & Food Quality', color: '#f59e0b', icon: 'Utensils' },
  { id: 'Transport & Parking', label: 'Transport & Parking', color: '#ec4899', icon: 'Bus' },
  { id: 'Security & Safety', label: 'Security & Safety', color: '#ef4444', icon: 'ShieldAlert' },
  { id: 'Academic & Curriculum', label: 'Academic & Curriculum', color: '#8b5cf6', icon: 'BookOpen' },
  { id: 'Fee & Scholarships', label: 'Fee & Scholarships', color: '#6366f1', icon: 'CreditCard' },
];

// Engineering Academic Departments (IT, CSE, CE, EXTC, MECH, AI&DS)
export const DEPARTMENTS = [
  { 
    id: 'CSE', 
    name: 'Computer Science & Engineering', 
    code: 'CSE',
    color: '#38bdf8', // Sky Blue
    divisions: ['CSE - Div A', 'CSE - Div B', 'CSE - Div C']
  },
  { 
    id: 'IT', 
    name: 'Information Technology', 
    code: 'IT',
    color: '#06b6d4', // Cyan
    divisions: ['IT - Div A', 'IT - Div B']
  },
  { 
    id: 'EXTC', 
    name: 'Electronics & Telecommunication', 
    code: 'EXTC',
    color: '#a855f7', // Purple
    divisions: ['EXTC - Div A', 'EXTC - Div B']
  },
  { 
    id: 'CE', 
    name: 'Civil Engineering', 
    code: 'CE',
    color: '#10b981', // Emerald
    divisions: ['CE - Div A', 'CE - Div B']
  },
  { 
    id: 'MECH', 
    name: 'Mechanical Engineering', 
    code: 'MECH',
    color: '#f59e0b', // Amber
    divisions: ['MECH - Div A', 'MECH - Div B']
  },
  { 
    id: 'AIDS', 
    name: 'AI & Data Science', 
    code: 'AI&DS',
    color: '#f43f5e', // Rose
    divisions: ['AIDS - Div A', 'AIDS - Div B']
  },
];

// Rich, diverse complaint templates covering EVERY single category, department, and facility
const TEMPLATES = [
  // 1. Infrastructure & Labs
  { title: 'Compiler lab workstation GPU driver crash during lab session', cat: 'Infrastructure & Labs', bldg: 'Academic Complex', sev: 'High', status: 'Under Investigation', sla: 'Warning', deptId: 'CSE', divIdx: 0, rootCause: 'Outdated Nvidia proprietary display drivers causing kernel panic on batch compilation.' },
  { title: 'Concrete testing compression machine sensor calibration error', cat: 'Infrastructure & Labs', bldg: 'Maintenance & Utilities', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'CE', divIdx: 0, rootCause: 'Load cell strain gauge transducer zero-point drifting by 4.2%.' },
  { title: 'Thermal engineering engine test-bed coolant pipe minor leak', cat: 'Infrastructure & Labs', bldg: 'Maintenance & Utilities', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'MECH', divIdx: 0, rootCause: 'High-pressure rubber gasket micro-fracture under sustained thermal stress.' },
  { title: 'Embedded systems development kit power supply malfunction in EXTC lab', cat: 'Infrastructure & Labs', bldg: 'Academic Complex', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 0, rootCause: 'Voltage regulator IC overheating due to clogged ventilation fan.' },
  { title: 'Hydraulics flume water circulation pump motor humming noise', cat: 'Infrastructure & Labs', bldg: 'Maintenance & Utilities', sev: 'Medium', status: 'In Progress', sla: 'Within SLA', deptId: 'CE', divIdx: 1, rootCause: 'Impeller bearing cavitation and cavitation air pocket accumulation.' },
  { title: 'Microcontroller 8051 programmer interface USB recognition failure', cat: 'Infrastructure & Labs', bldg: 'Academic Complex', sev: 'Low', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 1, rootCause: 'USB UART bridge driver signature mismatch on lab Windows image.' },
  { title: 'CNC lathe machine hydraulic pressure drop warning during milling', cat: 'Infrastructure & Labs', bldg: 'Maintenance & Utilities', sev: 'Critical', status: 'Escalated', sla: 'Breached', deptId: 'MECH', divIdx: 1, rootCause: 'Hydraulic solenoid return valve seal perished causing bypass leakage.' },
  { title: 'Air conditioning refrigerant recharge needed in CAD/CAM design center', cat: 'Infrastructure & Labs', bldg: 'Academic Complex', sev: 'Medium', status: 'In Progress', sla: 'Warning', deptId: 'MECH', divIdx: 0, rootCause: 'Slow pinhole refrigerant leak at condenser copper flare joint.' },

  // 2. IT & WiFi Services
  { title: 'WiFi router gateway timeout in 3rd floor CSE project laboratory', cat: 'IT & WiFi Services', bldg: 'Academic Complex', sev: 'Critical', status: 'In Progress', sla: 'Warning', deptId: 'CSE', divIdx: 1, rootCause: 'DHCP IP pool exhaustion caused by high concurrent device connection.' },
  { title: 'Cloud computing virtual machine quota exhausted for semester practicals', cat: 'IT & WiFi Services', bldg: 'Academic Complex', sev: 'Medium', status: 'In Progress', sla: 'Warning', deptId: 'IT', divIdx: 0, rootCause: 'Automated student container pods not terminating on lab disconnect.' },
  { title: 'Deep learning GPU server CUDA memory out-of-bounds error on node 4', cat: 'IT & WiFi Services', bldg: 'Academic Complex', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'AIDS', divIdx: 0, rootCause: 'PyTorch shared memory segment allocation conflict between parallel jobs.' },
  { title: 'Software engineering UML design tool floating license server down', cat: 'IT & WiFi Services', bldg: 'Academic Complex', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 1, rootCause: 'FlexLM license daemon daemon crashed following scheduled NTP clock sync.' },
  { title: 'Database management oracle instance tablespace quota exceeded', cat: 'IT & WiFi Services', bldg: 'Academic Complex', sev: 'High', status: 'Escalated', sla: 'Breached', deptId: 'CSE', divIdx: 2, rootCause: 'Archive log disk volume filled by continuous index rebuilding script.' },
  { title: 'Campus WiFi access point packet loss in central reading hall', cat: 'IT & WiFi Services', bldg: 'Library & Reading Hall', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 0, rootCause: 'Channel interference between 5GHz access points AP-03 and AP-04.' },
  { title: 'High performance computing cluster job scheduler slurm queue hang', cat: 'IT & WiFi Services', bldg: 'Academic Complex', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'AIDS', divIdx: 1, rootCause: 'Zombie MPI process holding socket lock on head compute node.' },
  { title: 'Optical fiber link latency spike between admin block and academic server', cat: 'IT & WiFi Services', bldg: 'Central Admin Block', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 1, rootCause: 'Dirty LC optical transceiver connector in distribution rack switch.' },

  // 3. Hostel & Living
  { title: 'Hostel resident WiFi access point packet drop in wing B3', cat: 'Hostel & Living', bldg: 'Hostel Block B (Boys)', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 0, rootCause: 'PoE power injector fluctuating below 44V under peak evening traffic.' },
  { title: 'Solar water heater thermostat failure in 4th floor showers', cat: 'Hostel & Living', bldg: 'Hostel Block A (Boys)', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'CE', divIdx: 0, rootCause: 'Bimetallic temperature probe scale accumulation requiring descaling.' },
  { title: 'Ceiling fan regulator sparking in dorm room 214', cat: 'Hostel & Living', bldg: 'Hostel Block C (Girls)', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'MECH', divIdx: 0, rootCause: 'Step-down capacitor insulation dielectric breakdown.' },
  { title: 'Laundry room automatic washing machine drainage valve clogged', cat: 'Hostel & Living', bldg: 'Hostel Block A (Boys)', sev: 'Low', status: 'Resolved', sla: 'Within SLA', deptId: 'MECH', divIdx: 1, rootCause: 'Lint and coin entrapment inside the centrifugal drain pump chamber.' },
  { title: 'Water purifier reverse osmosis filter replacement signal blinking', cat: 'Hostel & Living', bldg: 'Hostel Block C (Girls)', sev: 'Medium', status: 'In Progress', sla: 'Within SLA', deptId: 'CE', divIdx: 1, rootCause: 'Sediment pre-filter differential pressure exceeding 2.5 bar threshold.' },
  { title: 'Corridor emergency exit door magnetic lock sensor disengaged', cat: 'Hostel & Living', bldg: 'Hostel Block B (Boys)', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 1, rootCause: 'Armature plate misalignment due to hinge wear on 2nd floor exit.' },

  // 4. Mess & Food Quality
  { title: 'Cafeteria drinking water cooler cooling coil temperature sensor faulty', cat: 'Mess & Food Quality', bldg: 'Student Mess & Cafeteria', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'MECH', divIdx: 0, rootCause: 'Thermostat contact chatter failing to trigger compressor relay.' },
  { title: 'Lunch buffet hot-counter bain-marie heating element electrical trip', cat: 'Mess & Food Quality', bldg: 'Student Mess & Cafeteria', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 0, rootCause: 'Immersion heating coil earth leakage tripped MCB breaker.' },
  { title: 'Food storage walk-in cold room digital thermometer reading high', cat: 'Mess & Food Quality', bldg: 'Student Mess & Cafeteria', sev: 'Critical', status: 'Escalated', sla: 'Breached', deptId: 'MECH', divIdx: 1, rootCause: 'Evaporator defrost heater timer stuck, ice buildup on cooling fins.' },
  { title: 'Exhaust hood grease filter steam ventilator vibration in main kitchen', cat: 'Mess & Food Quality', bldg: 'Student Mess & Cafeteria', sev: 'Medium', status: 'In Progress', sla: 'Warning', deptId: 'MECH', divIdx: 1, rootCause: 'Centrifugal blower fan belt slackness and dynamic unbalance.' },
  { title: 'Evening snacks beverage dispenser solenoid valve stuck open', cat: 'Mess & Food Quality', bldg: 'Student Mess & Cafeteria', sev: 'Low', status: 'Resolved', sla: 'Within SLA', deptId: 'CE', divIdx: 0, rootCause: 'Mineral scale particle trapped under plunger rubber seal.' },
  { title: 'Dining hall bio-waste composting shredder mechanical jam', cat: 'Mess & Food Quality', bldg: 'Student Mess & Cafeteria', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'CE', divIdx: 1, rootCause: 'Hard fibrous food waste wedged in twin-shaft cutting blades.' },

  // 5. Transport & Parking
  { title: 'Route 4 college transit bus alternator battery charging alert', cat: 'Transport & Parking', bldg: 'Maintenance & Utilities', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'MECH', divIdx: 0, rootCause: 'Alternator drive serpentine belt slip and carbon brush wear.' },
  { title: 'EV charging station connector lock pin sensor error in student parking', cat: 'Transport & Parking', bldg: 'Maintenance & Utilities', sev: 'Medium', status: 'In Progress', sla: 'Within SLA', deptId: 'EXTC', divIdx: 0, rootCause: 'Proximity pilot resistor contact oxidation on Type 2 charging gun.' },
  { title: 'South gate automated vehicle boom barrier motor limit switch failure', cat: 'Transport & Parking', bldg: 'Central Admin Block', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 1, rootCause: 'Optical encoder disc contaminated with roadside dust.' },
  { title: 'Campus shuttle bus timetable GPS tracker telemetry loss', cat: 'Transport & Parking', bldg: 'Central Admin Block', sev: 'Low', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 0, rootCause: 'SIM card cellular roaming registration failure on GPS dongle.' },
  { title: 'Bicycle sharing dock electronic RFID latch release failure at sports arena', cat: 'Transport & Parking', bldg: 'Sports Arena & Gymnasium', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'CSE', divIdx: 0, rootCause: 'Docking controller RS485 communication timeout with central kiosk.' },
  { title: 'Faculty parking lot perimeter solar floodlight LED ballast failure', cat: 'Transport & Parking', bldg: 'Academic Complex', sev: 'Low', status: 'In Progress', sla: 'Within SLA', deptId: 'EXTC', divIdx: 1, rootCause: 'Constant current driver surge protector triggered by lightning transient.' },

  // 6. Security & Safety
  { title: 'Turnstile gate student ID RFID reader failure at girls hostel entrance', cat: 'Security & Safety', bldg: 'Hostel Block C (Girls)', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'CSE', divIdx: 1, rootCause: 'Wiegand interface data wire loose in controller junction box.' },
  { title: 'Fire safety smoke detector optical chamber dust alarm in library stacks', cat: 'Security & Safety', bldg: 'Library & Reading Hall', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 0, rootCause: 'Particulate buildup inside infrared scattering photoelectric chamber.' },
  { title: 'Gymnasium CCTV IP camera PTZ pan-tilt-zoom motor unresponsive', cat: 'Security & Safety', bldg: 'Sports Arena & Gymnasium', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 1, rootCause: 'PTZ slip ring contact degradation causing telemetry command loss.' },
  { title: 'Emergency fire exit stairwell luminaire battery backup discharged', cat: 'Security & Safety', bldg: 'Academic Complex', sev: 'High', status: 'In Progress', sla: 'Warning', deptId: 'EXTC', divIdx: 0, rootCause: 'NiCd battery cell reversal after uninterrupted power outage drill.' },
  { title: 'Sports arena spectator gallery perimeter safety railing bolt loose', cat: 'Security & Safety', bldg: 'Sports Arena & Gymnasium', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'CE', divIdx: 0, rootCause: 'Anchor expansion bolt loose from concrete foundation under cyclic load.' },
  { title: 'Chemical waste hazardous storage cabinet ventilation suction drop', cat: 'Security & Safety', bldg: 'Maintenance & Utilities', sev: 'Critical', status: 'Escalated', sla: 'Breached', deptId: 'CE', divIdx: 1, rootCause: 'HEPA exhaust filter clogged exceeding rated static pressure.' },

  // 7. Academic & Curriculum
  { title: 'Semester exam timetable conflict between elective and core practicals', cat: 'Academic & Curriculum', bldg: 'Academic Complex', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'CSE', divIdx: 0, rootCause: 'Automated scheduling algorithm overlap on shared laboratory slot.' },
  { title: 'ERP portal elective subject registration credit cap mismatch for Div B', cat: 'Academic & Curriculum', bldg: 'Central Admin Block', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 1, rootCause: 'Student prerequisite validation database trigger calculating old credit rules.' },
  { title: 'Autonomous curriculum syllabus PDF link 404 error on department portal', cat: 'Academic & Curriculum', bldg: 'Library & Reading Hall', sev: 'Low', status: 'Resolved', sla: 'Within SLA', deptId: 'AIDS', divIdx: 0, rootCause: 'Web server symlink broken following syllabus versioning update.' },
  { title: 'Mid-semester internal mark submission portal session timeout for faculty', cat: 'Academic & Curriculum', bldg: 'Central Admin Block', sev: 'Medium', status: 'In Progress', sla: 'Within SLA', deptId: 'CSE', divIdx: 2, rootCause: 'Redis session cookie expiry set to 5 minutes instead of 60 minutes.' },
  { title: 'Lab manual digital repository version mismatch for fluid mechanics', cat: 'Academic & Curriculum', bldg: 'Academic Complex', sev: 'Low', status: 'Resolved', sla: 'Within SLA', deptId: 'MECH', divIdx: 0, rootCause: 'CDN cache header missing stale-while-revalidate directive.' },
  { title: 'Academic transcript digital verification signature certificate expiration', cat: 'Academic & Curriculum', bldg: 'Central Admin Block', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 0, rootCause: 'Public Key Infrastructure intermediate CA certificate expired.' },

  // 8. Fee & Scholarships
  { title: 'Online payment gateway transaction pending bank reconciliation discrepancy', cat: 'Fee & Scholarships', bldg: 'Central Admin Block', sev: 'Critical', status: 'Resolved', sla: 'Within SLA', deptId: 'CSE', divIdx: 1, rootCause: 'Payment gateway webhook retry timeout during bank server maintenance.' },
  { title: 'State scholarship portal document re-upload verification delay', cat: 'Fee & Scholarships', bldg: 'Central Admin Block', sev: 'Medium', status: 'In Progress', sla: 'Warning', deptId: 'CE', divIdx: 0, rootCause: 'OCR document parser failing to extract income certificate bar-code.' },
  { title: 'Semester tuition fee receipt generation payment webhook retry failure', cat: 'Fee & Scholarships', bldg: 'Central Admin Block', sev: 'High', status: 'Resolved', sla: 'Within SLA', deptId: 'IT', divIdx: 1, rootCause: 'PDF generator memory limit exceeded under concurrent student downloads.' },
  { title: 'Hostel caution deposit refund processing status not updating on ERP', cat: 'Fee & Scholarships', bldg: 'Central Admin Block', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'EXTC', divIdx: 0, rootCause: 'Account department clearance status batch job failed on duplicate record.' },
  { title: 'EBC concession fee waiver eligibility verification document clearance', cat: 'Fee & Scholarships', bldg: 'Central Admin Block', sev: 'Low', status: 'In Progress', sla: 'Within SLA', deptId: 'MECH', divIdx: 1, rootCause: 'Manual scrutiny backlog awaiting gazetted officer signature verification.' },
  { title: 'Merit scholarship installment credit acknowledgment receipt missing', cat: 'Fee & Scholarships', bldg: 'Central Admin Block', sev: 'Medium', status: 'Resolved', sla: 'Within SLA', deptId: 'AIDS', divIdx: 1, rootCause: 'National scholarship portal API response JSON schema changed.' },
];

export function generateVisualizationComplaints() {
  const records = [];
  const baseDate = new Date('2026-10-01T08:00:00Z');
  const totalDays = 31;
  const targetCount = 480; // Large, healthy dataset ensuring all categories, departments, and buildings have rich data

  for (let i = 0; i < targetCount; i++) {
    const tmpl = TEMPLATES[i % TEMPLATES.length];
    const bldgObj = CAMPUS_BUILDINGS.find(b => b.name === tmpl.bldg) || CAMPUS_BUILDINGS[i % CAMPUS_BUILDINGS.length];
    const deptObj = DEPARTMENTS.find(d => d.id === tmpl.deptId) || DEPARTMENTS[i % DEPARTMENTS.length];
    
    // Spread evenly across 31 days of October 2026
    const dayOffset = Math.floor((i * totalDays) / targetCount);
    const hourOffset = (i * 7) % 24;
    const minuteOffset = (i * 13) % 60;
    const createdDate = new Date(baseDate.getTime() + (dayOffset * 24 * 3600000) + (hourOffset * 3600000) + (minuteOffset * 60000));
    
    // Map to 8 week buckets: Wk 1 through Wk 8
    const weekNumber = Math.min(Math.floor(dayOffset / 4) + 1, 8);
    const weekLabel = `Wk ${weekNumber}`;

    let status = tmpl.status;
    let slaStatus = tmpl.sla;
    let severity = tmpl.sev;

    // Realistic status variance
    if (i % 11 === 0) status = 'Escalated';
    else if (i % 6 === 0) status = 'In Progress';
    else if (i % 7 === 0) status = 'Under Investigation';
    else if (i % 3 === 0) status = 'Closed';
    else status = 'Resolved';

    // Realistic SLA distribution
    if (status === 'Escalated') {
      slaStatus = (i % 3 === 0) ? 'Breached' : 'Warning';
    } else if (status === 'Resolved' || status === 'Closed') {
      slaStatus = (i % 8 === 0) ? 'Breached' : 'Within SLA';
    } else {
      slaStatus = (i % 4 === 0) ? 'Warning' : 'Within SLA';
    }

    // Varied severities
    if (i % 9 === 0) severity = 'Critical';
    else if (i % 4 === 0) severity = 'High';
    else if (i % 3 === 0) severity = 'Medium';
    else severity = 'Low';

    const divIndex = (tmpl.divIdx + Math.floor(i / TEMPLATES.length)) % deptObj.divisions.length;
    const divisionName = deptObj.divisions[divIndex] || deptObj.divisions[0];
    const isResolved = status === 'Resolved' || status === 'Closed';
    const resolutionHours = isResolved 
      ? Math.round(3 + ((i * 7) % 32)) 
      : Math.round(18 + ((i * 13) % 48));

    const reporters = [
      `Student #${1010 + (i % 140)} (${divisionName})`,
      `CR (${divisionName})`,
      `Lab Assistant (${deptObj.code})`,
      `Resident Student (${bldgObj.shortName})`,
      `Faculty Proctor (${deptObj.code})`
    ];
    const reporterName = reporters[i % reporters.length];

    records.push({
      id: `CMP-2026-${String(1001 + i).padStart(4, '0')}`,
      title: `${tmpl.title} - Batch ${(i % 4) + 1}`,
      category: tmpl.cat,
      departmentId: deptObj.id,
      departmentName: deptObj.name,
      departmentCode: deptObj.code,
      division: divisionName,
      building: bldgObj.name,
      buildingShort: bldgObj.shortName,
      zone: bldgObj.zone,
      buildingType: bldgObj.type,
      location: `${bldgObj.shortName} (Floor ${(i % 4) + 1}, Wing ${['A', 'B', 'C'][(i % 3)]})`,
      severity: severity,
      status: status,
      slaStatus: slaStatus,
      createdAt: createdDate.toISOString(),
      resolutionHours: resolutionHours,
      weekLabel: weekLabel,
      reporter: reporterName,
      assignedTo: `${deptObj.code} Response Team`,
      rootCause: tmpl.rootCause
    });
  }

  return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
