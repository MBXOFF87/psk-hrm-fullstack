require('dotenv').config();
const bcrypt = require('bcryptjs');
const { dbInsert, dbFind, dbRemove } = require('./db');

const BRANCH_CODES = {
  'MOJIDI':'MOJ','ALADE':'ALD','BANK A':'BKA','GRA':'GRA','AIRPORT':'APT',
  'RELIANCE':'REL','ONIRU':'ONR','RESIDENCE':'RES','FREEDOM':'FRD',
  'SIGNATURE':'SIG','V-ISLAND':'VIL','CASTLE':'CST','B-ISLAND':'BIS',
  'FAJODD-4':'FJD','WHITE HOUSE':'WHT','WATERS':'WTR','IKOYI':'IKY',
  'KURAMO':'KRM','AWOLOWO':'AWL','WUSE-2':'WS2','JABI':'JAB','HEAD OFFICE':'HQO'
};

const SEED_STAFF = [
  // MOJIDI
  {empId:'PSK/MOJ/001',name:'SAMUEL NWABUEZE',branch:'MOJIDI',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'3157802068',bank:'First Bank',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/002',name:'ESTHER ONI OMOBOLANLE',branch:'MOJIDI',dept:'BH',position:'Branch Head',department:'Management',gross:150000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:147500,accNum:'2211880730',bank:'Zenith Bank',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/003',name:'JACOB MARY FRIDAY',branch:'MOJIDI',dept:'F/O',position:'Receptionist',department:'Front Office',gross:80000,paye:2000,vaccine:0,loan:0,otherDeductions:0,net:78000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/004',name:'IFEOMA RUTH IWEDIKE',branch:'MOJIDI',dept:'F/O',position:'Receptionist',department:'Front Office',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/005',name:'BASIRAT IRETIOLA GANIYAT',branch:'MOJIDI',dept:'F/O',position:'Receptionist',department:'Front Office',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/006',name:'MICHEAL NGBEDE',branch:'MOJIDI',dept:'PORTER',position:'Porter',department:'Front Office',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/007',name:'GODWIN CLETUS EDET',branch:'MOJIDI',dept:'PORTER',position:'Porter',department:'Front Office',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/008',name:'FAVOUR OKORIE',branch:'MOJIDI',dept:'MNGR',position:'Manager',department:'Food & Beverage',gross:120000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:117500,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/009',name:'MOSES ADAMS',branch:'MOJIDI',dept:'WAITER',position:'Waiter',department:'Food & Beverage',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/010',name:'IBRAHIM ADEOLA',branch:'MOJIDI',dept:'WAITRESS',position:'Waitress',department:'Food & Beverage',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/011',name:'ENYERIBE QUEEN CHISOM',branch:'MOJIDI',dept:'WAITRESS',position:'Waitress',department:'Food & Beverage',gross:70000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/012',name:'PAUL ADEKPE',branch:'MOJIDI',dept:'MNGR',position:'Manager',department:'Housekeeping',gross:100000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:97500,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/013',name:'HOPE HARRY NDINWA',branch:'MOJIDI',dept:'SUPVR',position:'Supervisor',department:'Housekeeping',gross:80000,paye:2000,vaccine:0,loan:0,otherDeductions:0,net:78000,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/014',name:'SEUN ESUN JUSTIN',branch:'MOJIDI',dept:'CHEF',position:'Chef',department:'Kitchen',gross:120000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:117500,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/MOJ/015',name:'WASIU MOBOLAJI',branch:'MOJIDI',dept:'HEAD',position:'Staff',department:'Maintenance',gross:110000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:107500,accNum:'',bank:'',status:'active',resumption:'2024-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // HEAD OFFICE
  {empId:'PSK/HQO/001',name:'PIUS OBAJE',branch:'HEAD OFFICE',dept:'MD',position:'Managing Director',department:'Management',gross:700000,paye:9000,vaccine:0,loan:0,otherDeductions:0,net:691000,accNum:'1001414854',bank:'Zenith Bank',status:'active',resumption:'2020-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/002',name:'GLORIA NGOZI EZEIGWE',branch:'HEAD OFFICE',dept:'DMD',position:'Deputy Managing Director',department:'Management',gross:500000,paye:6000,vaccine:0,loan:0,otherDeductions:0,net:494000,accNum:'0006922499',bank:'Sterling Bank',status:'active',resumption:'2020-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/003',name:'PETER BUKOYE',branch:'HEAD OFFICE',dept:'DMD',position:'Deputy Managing Director',department:'Management',gross:500000,paye:6000,vaccine:0,loan:0,otherDeductions:0,net:494000,accNum:'0131690948',bank:'Guaranty Trust Bank (GTCO)',status:'active',resumption:'2020-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/004',name:'AKEEM OSENI',branch:'HEAD OFFICE',dept:'HEAD',position:'H.O.P.',department:'FC&SP',gross:400000,paye:5000,vaccine:0,loan:0,otherDeductions:0,net:395000,accNum:'2008523660',bank:'First Bank',status:'active',resumption:'2020-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/005',name:'OMONIYI KAYODE JAMES',branch:'HEAD OFFICE',dept:'FC&SP',position:'Manager',department:'FC&SP',gross:400000,paye:5000,vaccine:0,loan:0,otherDeductions:0,net:395000,accNum:'3048908785',bank:'First Bank',status:'active',resumption:'2020-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/006',name:'ADEYEMI NURAIN',branch:'HEAD OFFICE',dept:'HRM',position:'Manager',department:'HRM',gross:350000,paye:4500,vaccine:0,loan:0,otherDeductions:0,net:345500,accNum:'',bank:'',status:'active',resumption:'2020-06-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/007',name:'LAWRENCIA INALEGWU',branch:'HEAD OFFICE',dept:'HRM',position:'Staff',department:'HRM',gross:250000,paye:3000,vaccine:0,loan:50000,otherDeductions:0,net:197000,accNum:'',bank:'',status:'active',resumption:'2021-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/008',name:'DARE ONIPE OLANREWAJU',branch:'HEAD OFFICE',dept:'DRIVER',position:'Drivers',department:'Driver',gross:120000,paye:0,vaccine:0,loan:20000,otherDeductions:0,net:100000,accNum:'',bank:'',status:'active',resumption:'2021-03-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/009',name:'OLUSHOLA JULIUS',branch:'HEAD OFFICE',dept:'DRIVER',position:'Drivers',department:'Driver',gross:120000,paye:0,vaccine:0,loan:50000,otherDeductions:0,net:70000,accNum:'',bank:'',status:'active',resumption:'2020-09-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/010',name:'SUNDAY JOSEPH IDOKO',branch:'HEAD OFFICE',dept:'DRIVER',position:'Drivers',department:'Driver',gross:120000,paye:0,vaccine:0,loan:40000,otherDeductions:0,net:80000,accNum:'',bank:'',status:'active',resumption:'2021-06-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/011',name:'MERCY AGU',branch:'HEAD OFFICE',dept:'WADD',position:'Staff',department:'W.A.D.D',gross:200000,paye:2500,vaccine:0,loan:50000,otherDeductions:0,net:147500,accNum:'',bank:'',status:'active',resumption:'2021-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/012',name:'ABASS OLALERE',branch:'HEAD OFFICE',dept:'HSK',position:'Supervisor',department:'Housekeeping',gross:150000,paye:2000,vaccine:0,loan:20000,otherDeductions:0,net:128000,accNum:'',bank:'',status:'active',resumption:'2021-02-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/013',name:'YAKUBU GAFFAR',branch:'HEAD OFFICE',dept:'PROPERTY',position:'Staff',department:'Property',gross:180000,paye:2000,vaccine:0,loan:30000,otherDeductions:0,net:148000,accNum:'',bank:'',status:'active',resumption:'2020-11-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/014',name:'MRS TAIWO GEORGE',branch:'HEAD OFFICE',dept:'PROC',position:'Staff',department:'Procurement',gross:200000,paye:2500,vaccine:0,loan:30000,otherDeductions:0,net:167500,accNum:'',bank:'',status:'active',resumption:'2021-04-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/HQO/015',name:'GODWIN SUNDAY',branch:'HEAD OFFICE',dept:'HSK',position:'Housekeeper',department:'Housekeeping',gross:150000,paye:0,vaccine:0,loan:200000,otherDeductions:0,net:-50000,accNum:'',bank:'',status:'active',resumption:'2022-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // ALADE
  {empId:'PSK/ALD/001',name:'AKINWALE SODIQ',branch:'ALADE',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/ALD/002',name:'RAMSEY B. EDUGIE',branch:'ALADE',dept:'HSK MNGR',position:'Manager',department:'Housekeeping',gross:120000,paye:2500,vaccine:0,loan:50000,otherDeductions:0,net:67500,accNum:'',bank:'',status:'active',resumption:'2023-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/ALD/003',name:'ADEWALE BABATUNDE',branch:'ALADE',dept:'F/O',position:'Receptionist',department:'Front Office',gross:75000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:75000,accNum:'',bank:'',status:'active',resumption:'2023-02-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/ALD/004',name:'CHIOMA NKECHI OBI',branch:'ALADE',dept:'F&B',position:'Waitress',department:'Food & Beverage',gross:65000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:65000,accNum:'',bank:'',status:'active',resumption:'2023-03-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // BANK A
  {empId:'PSK/BKA/001',name:'LEKE BABATUNDE ADEYEMI',branch:'BANK A',dept:'GM',position:'General Manager',department:'Management',gross:220000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:217500,accNum:'',bank:'',status:'active',resumption:'2022-06-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/BKA/002',name:'MICHAEL ONYEKACHI',branch:'BANK A',dept:'F/O',position:'Receptionist',department:'Front Office',gross:75000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:75000,accNum:'',bank:'',status:'active',resumption:'2022-07-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/BKA/003',name:'FRANCISCA OJUKWU',branch:'BANK A',dept:'HSK',position:'Housekeeper',department:'Housekeeping',gross:65000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:65000,accNum:'',bank:'',status:'active',resumption:'2022-08-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // GRA
  {empId:'PSK/GRA/001',name:'THOMAS UGWU AJEGBA',branch:'GRA',dept:'MNTN',position:'Staff',department:'Maintenance',gross:100000,paye:2500,vaccine:0,loan:40000,otherDeductions:0,net:57500,accNum:'',bank:'',status:'active',resumption:'2022-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/GRA/002',name:'CHUKWUEMEKA OKAFOR',branch:'GRA',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2022-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/GRA/003',name:'ADAEZE PATRICIA NWOSU',branch:'GRA',dept:'KITCHEN',position:'Cook',department:'Kitchen',gross:80000,paye:0,vaccine:0,loan:0,otherDeductions:0,net:80000,accNum:'',bank:'',status:'active',resumption:'2022-03-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // AIRPORT
  {empId:'PSK/APT/001',name:'BISMARK OFORI',branch:'AIRPORT',dept:'HOP',position:'H.O.P.',department:'Management',gross:150000,paye:2500,vaccine:0,loan:50000,otherDeductions:0,net:97500,accNum:'',bank:'',status:'active',resumption:'2022-09-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/APT/002',name:'NGOZI BLESSING EZE',branch:'AIRPORT',dept:'F/O',position:'Receptionist',department:'Front Office',gross:80000,paye:2000,vaccine:0,loan:0,otherDeductions:0,net:78000,accNum:'',bank:'',status:'active',resumption:'2022-10-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // RELIANCE
  {empId:'PSK/REL/001',name:'ADEWOLE TIMOTHY',branch:'RELIANCE',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // ONIRU
  {empId:'PSK/ONR/001',name:'JUDITH CHINWE OKONKWO',branch:'ONIRU',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-04-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // RESIDENCE
  {empId:'PSK/RES/001',name:'ADEKUNLE FATAI',branch:'RESIDENCE',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-05-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // FREEDOM
  {empId:'PSK/FRD/001',name:'SAMUEL AKINTUNDE',branch:'FREEDOM',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-06-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // SIGNATURE
  {empId:'PSK/SIG/001',name:'KELECHI AMARA',branch:'SIGNATURE',dept:'GM',position:'General Manager',department:'Management',gross:220000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:217500,accNum:'',bank:'',status:'active',resumption:'2023-07-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // V-ISLAND
  {empId:'PSK/VIL/001',name:'BEATRICE OBIAGELI',branch:'V-ISLAND',dept:'GM',position:'General Manager',department:'Management',gross:220000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:217500,accNum:'',bank:'',status:'active',resumption:'2023-08-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // CASTLE
  {empId:'PSK/CST/001',name:'AFOLABI OLAITAN',branch:'CASTLE',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-09-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // B-ISLAND
  {empId:'PSK/BIS/001',name:'EMEKA OBIORA',branch:'B-ISLAND',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-10-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // FAJODD-4
  {empId:'PSK/FJD/001',name:'NDDUKA IFEOMA',branch:'FAJODD-4',dept:'COOK',position:'Cook',department:'Kitchen',gross:92000,paye:2000,vaccine:0,loan:30000,otherDeductions:0,net:60000,accNum:'',bank:'',status:'active',resumption:'2023-02-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/FJD/002',name:'IBRAHIM HASSAN',branch:'FAJODD-4',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2022-11-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // WHITE HOUSE
  {empId:'PSK/WHT/001',name:'TAIWO IYANDA',branch:'WHITE HOUSE',dept:'POOL GUARD',position:'Pool Guard',department:'Maintenance',gross:80000,paye:2000,vaccine:0,loan:40000,otherDeductions:0,net:38000,accNum:'',bank:'',status:'active',resumption:'2023-05-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/WHT/002',name:'OLAWALE RASHEED',branch:'WHITE HOUSE',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2022-07-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // WATERS
  {empId:'PSK/WTR/001',name:'DAMILOLA JOHNSON',branch:'WATERS',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2022-08-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // IKOYI
  {empId:'PSK/IKY/001',name:'ADAEZE NWACHUKWU',branch:'IKOYI',dept:'GM',position:'General Manager',department:'Management',gross:220000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:217500,accNum:'',bank:'',status:'active',resumption:'2022-09-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // KURAMO
  {empId:'PSK/KRM/001',name:'ADEMOLA IDOWU',branch:'KURAMO',dept:'GM',position:'General Manager',department:'Management',gross:350000,paye:5000,vaccine:0,loan:50000,otherDeductions:0,net:295000,accNum:'',bank:'',status:'active',resumption:'2022-06-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // AWOLOWO
  {empId:'PSK/AWL/001',name:'CHINWENDU OBIEZE',branch:'AWOLOWO',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2022-10-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // WUSE-2
  {empId:'PSK/WS2/001',name:'BELLO USMAN IBRAHIM',branch:'WUSE-2',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  // JABI
  {empId:'PSK/JAB/001',name:'KURORITIMI EMMANUEL DANIEL',branch:'JABI',dept:'L.GUARD',position:'Pool Guard',department:'Maintenance',gross:80000,paye:2000,vaccine:0,loan:50000,otherDeductions:0,net:28000,accNum:'',bank:'',status:'active',resumption:'2023-03-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
  {empId:'PSK/JAB/002',name:'HAUWA ABUBAKAR',branch:'JABI',dept:'GM',position:'General Manager',department:'Management',gross:200000,paye:2500,vaccine:0,loan:0,otherDeductions:0,net:197500,accNum:'',bank:'',status:'active',resumption:'2023-01-01',phone:'',address:'',dob:'',nin:'',kinName:'',kinPhone:'',kinRel:'',kinAddress:'',photo:null,daysAbsent:0},
];

const SEED_LOANS = [
  {name:'MERCY AGU',position:'WADD',branch:'HEAD OFFICE',loanAmount:700000,monthReq:'',monthlyRepayment:50000,balance:200000,monthPaid:"APR '26"},
  {name:'ABASS OLALERE',position:'HSK ADMIN',branch:'HEAD OFFICE',loanAmount:200000,monthReq:'NOV, 2025',monthlyRepayment:20000,balance:120000,monthPaid:"APR '26"},
  {name:'DARE ONIPE OLANREWAJU',position:'FC&SP DRIVER',branch:'HEAD OFFICE',loanAmount:200000,monthReq:'',monthlyRepayment:20000,balance:80000,monthPaid:"APR '26"},
  {name:'NDDUKA IFEOMA',position:'COOK',branch:'FAJODD-4',loanAmount:200000,monthReq:'',monthlyRepayment:30000,balance:80000,monthPaid:"APR '26"},
  {name:'MR NOBLE',position:'HEAD IC&A',branch:'HEAD OFFICE',loanAmount:1800000,monthReq:'',monthlyRepayment:100000,balance:600000,monthPaid:"APR '26"},
  {name:'ADEMOLA IDOWU',position:'GM',branch:'KURAMO',loanAmount:600000,monthReq:'NOV, 2025',monthlyRepayment:50000,balance:400000,monthPaid:"APR '26"},
  {name:'OLUSHOLA JULIUS',position:'MD DRIVER',branch:'HEAD OFFICE',loanAmount:800000,monthReq:'',monthlyRepayment:50000,balance:400000,monthPaid:"APR '26"},
  {name:'THOMAS UGWU AJEGBA',position:'MAINTENANCE',branch:'GRA',loanAmount:520000,monthReq:'',monthlyRepayment:40000,balance:340000,monthPaid:"APR '26"},
  {name:'MRS. TAIWO GEORGE',position:'PROCUREMENT',branch:'HEAD OFFICE',loanAmount:300000,monthReq:'DEC, 2025',monthlyRepayment:30000,balance:180000,monthPaid:"APR '26"},
  {name:'SUNDAY JOSEPH IDOKO',position:"MD'S DRIVER",branch:'HEAD OFFICE',loanAmount:400000,monthReq:'',monthlyRepayment:40000,balance:160000,monthPaid:"APR '26"},
  {name:'YAKUBU GAFFAR',position:'PROPERTY',branch:'HEAD OFFICE',loanAmount:300000,monthReq:'',monthlyRepayment:30000,balance:120000,monthPaid:"APR '26"},
  {name:'RAMSEY B. EDUGIE',position:'HSK MNGR',branch:'ALADE',loanAmount:500000,monthReq:'DEC, 2025',monthlyRepayment:50000,balance:300000,monthPaid:"APR '26"},
  {name:'KURORITIMI EMMANUEL DANIEL',position:'LIFE GUARD',branch:'JABI',loanAmount:300000,monthReq:'DEC, 2025',monthlyRepayment:50000,balance:100000,monthPaid:"APR '26"},
  {name:'BISMARK OFORI',position:'HOP',branch:'AIRPORT',loanAmount:350000,monthReq:'DEC, 2025',monthlyRepayment:50000,balance:150000,monthPaid:"APR '26"},
  {name:'LAWRENCIA INALEGWU',position:'HR',branch:'HEAD OFFICE',loanAmount:600000,monthReq:'JAN, 2026',monthlyRepayment:50000,balance:400000,monthPaid:"APR '26"},
  {name:'TAIWO IYANDA',position:'POOL GUARD',branch:'WHITE HOUSE',loanAmount:400000,monthReq:'FEB, 2026',monthlyRepayment:40000,balance:320000,monthPaid:"APR '26"},
  {name:'BRIGHT NWORIE UGOCHUKWU',position:'HSK',branch:'MOJIDI',loanAmount:100000,monthReq:'JAN, 2026',monthlyRepayment:25000,balance:25000,monthPaid:"APR '26"},
  {name:'GODWIN SUNDAY',position:'LINEN & HSK',branch:'HEAD OFFICE',loanAmount:1400000,monthReq:'APR, 2026',monthlyRepayment:200000,balance:1400000,monthPaid:''},
];

async function seed() {
  console.log('🌱 Starting seed...');

  // Clear existing
  await dbRemove('staff', {}, { multi: true });
  await dbRemove('loans', {}, { multi: true });
  await dbRemove('users', {}, { multi: true });
  await dbRemove('audit', {}, { multi: true });

  // Insert staff
  const now = new Date().toISOString();
  for (const s of SEED_STAFF) {
    s.net = Math.max(0, s.gross - s.paye - s.vaccine - s.loan - s.otherDeductions);
    s.createdAt = now;
    s.updatedAt = now;
    await dbInsert('staff', s);
  }
  console.log(`✅ Inserted ${SEED_STAFF.length} staff`);

  // Insert loans
  for (const l of SEED_LOANS) {
    l.createdAt = now;
    l.updatedAt = now;
    await dbInsert('loans', l);
  }
  console.log(`✅ Inserted ${SEED_LOANS.length} loans`);

  // Insert users
  const users = [
    { username: 'admin',        password: await bcrypt.hash('admin123',  10), name: 'System Administrator', role: 'superadmin',     branch: 'ALL',         active: true, createdAt: now },
    { username: 'hr_manager',   password: await bcrypt.hash('hrm2026',   10), name: 'HR Manager',           role: 'hr',            branch: 'ALL',         active: true, createdAt: now },
    { username: 'branch_head',  password: await bcrypt.hash('branch123', 10), name: 'Branch Head',          role: 'branch_manager', branch: 'MOJIDI',     active: true, createdAt: now },
    { username: 'accounts',     password: await bcrypt.hash('acc2026',   10), name: 'Accounts Officer',     role: 'accounts',      branch: 'ALL',         active: true, createdAt: now },
  ];
  for (const u of users) await dbInsert('users', u);
  console.log(`✅ Inserted ${users.length} users`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('  admin       / admin123   (Super Admin)');
  console.log('  hr_manager  / hrm2026    (HR Manager)');
  console.log('  branch_head / branch123  (Branch Manager - MOJIDI)');
  console.log('  accounts    / acc2026    (Accounts)');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
