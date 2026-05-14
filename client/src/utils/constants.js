export const BRANCHES = [
  'MOJIDI','ALADE','BANK A','GRA','AIRPORT','RELIANCE','ONIRU','RESIDENCE',
  'FREEDOM','SIGNATURE','V-ISLAND','CASTLE','B-ISLAND','FAJODD-4',
  'WHITE HOUSE','WATERS','IKOYI','KURAMO','AWOLOWO','WUSE-2','JABI','HEAD OFFICE'
];

export const BRANCH_CODES = {
  'MOJIDI':'MOJ','ALADE':'ALD','BANK A':'BKA','GRA':'GRA','AIRPORT':'APT',
  'RELIANCE':'REL','ONIRU':'ONR','RESIDENCE':'RES','FREEDOM':'FRD',
  'SIGNATURE':'SIG','V-ISLAND':'VIL','CASTLE':'CST','B-ISLAND':'BIS',
  'FAJODD-4':'FJD','WHITE HOUSE':'WHT','WATERS':'WTR','IKOYI':'IKY',
  'KURAMO':'KRM','AWOLOWO':'AWL','WUSE-2':'WS2','JABI':'JAB','HEAD OFFICE':'HQO'
};

export const DEPARTMENTS = [
  'Management','Front Office','Food & Beverage','Housekeeping','Kitchen',
  'Laundry','Public Area','Maintenance','Entertainment','FC&SP','IC&A',
  'HRM','Logistics','I.T','W.A.D.D','Customer Service','Driver',
  'Procurement','Property',"Chairman's Office",'Security'
];

export const DEPT_ORDER = [
  'Management','Front Office','Food & Beverage','Housekeeping','Kitchen',
  'Laundry','Public Area','Maintenance','Entertainment'
];

export const POSITIONS = [
  'Branch Head','H.O.P.','Manager','Supervisor','Waitress','Waiter',
  'Housekeeper','Staff','Laundryman','Plumber','Managing Director',
  'Deputy Managing Director','Zonal Head','General Manager','Receptionist',
  'Porter','Chef','Cook','Dish Handler','Mixologist','Barman','MC','DJ',
  'Personal Assistant','Electrician','Gardener','Tiler','Painter','Screeder',
  'BBQ','Griller','SuyaMan','Pool Guard','Drivers','C.S.O.'
];

export const NIGERIAN_BANKS = [
  'Access Bank','Citibank','Ecobank','Fidelity Bank','First Bank',
  'First City Monument Bank (FCMB)','Globus Bank','Guaranty Trust Bank (GTCO)',
  'Heritage Bank','Keystone Bank','Kuda Bank','Lotus Bank','Moniepoint Bank',
  'Opay','Palmpay','Parallex Bank','Polaris Bank','Premium Trust Bank',
  'Providus Bank','Stanbic IBTC Bank','Standard Chartered Bank','Sterling Bank',
  'SunTrust Bank','Taj Bank','Titan Trust Bank','Union Bank',
  'United Bank for Africa (UBA)','Unity Bank','VFD Microfinance Bank',
  'Wema Bank','Zenith Bank'
];

export const ROLES = {
  superadmin: { label: 'Super Admin',      color: '#7c3aed' },
  hr:         { label: 'HR Manager',       color: '#0ea5e9' },
  branch_manager: { label: 'Branch Manager', color: '#059669' },
  accounts:   { label: 'Accounts',         color: '#d97706' },
  viewer:     { label: 'Viewer',           color: '#64748b' },
};

export const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');
export const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
export const getInitials = (name) => (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';
export const avatarColor = (name) => {
  const colors = ['#7c3aed','#0ea5e9','#059669','#d97706','#dc2626','#0891b2','#4f46e5','#be185d'];
  let h = 0;
  for (const c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
