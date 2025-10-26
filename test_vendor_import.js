import * as XLSX from 'xlsx';

// Sample vendor data matching your Excel format
const vendorData = [
  {
    'ID': 'V000001',
    'Vendor Connect ID': '871',
    'Vendor Name': '2Betties',
    'URL': 'https://2betties.com',
    'Logo': 'https://s3.amazonaws.com/cureate/vendors/profile_pics/000/000/871/medium/Screenshot_2025-07-21_at_4.32.08%E2%80%AFPM.jpeg?1753130451',
    'Phone': '(410) 336-2782',
    'Email': 'sallen@2betties.com',
    'Address': '',
    'State': '',
    'Territory': ''
  },
  {
    'ID': 'V000002',
    'Vendor Connect ID': '836',
    'Vendor Name': 'Absurd Snacks',
    'URL': 'http://absurdsnacks.com',
    'Logo': 'https://s3.amazonaws.com/cureate/vendors/profile_pics/000/000/836/medium/E0959B70-D5A9-4C1B-B64A-7E5ADA701AF9.jpeg?1679433134',
    'Phone': '(610) 392-3925',
    'Email': 'grace@absurdsnacks.com',
    'Address': '',
    'State': '',
    'Territory': ''
  },
  {
    'ID': 'V000003',
    'Vendor Connect ID': '10001',
    'Vendor Name': 'Accents',
    'URL': 'https://accentsgrill.com/',
    'Logo': 'https://img1.wsimg.com/isteam/ip/55d0c6ab-3301-41b6-967c-0a78781b7c76/unnamed-0001.png/:/rs=w:600,h:400,cg:true,m/cr=w:600,h:400/qt=q:95',
    'Phone': '(410) 653-3888',
    'Email': 'franks3restaurants@gmail.com',
    'Address': '',
    'State': '',
    'Territory': ''
  }
];

// Create Excel file
const ws = XLSX.utils.json_to_sheet(vendorData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
XLSX.writeFile(wb, 'test_vendor_import.xlsx');

console.log('✅ Test vendor import file created: test_vendor_import.xlsx');
console.log('📊 Contains 3 sample vendors from your data');
console.log('\nYou can now:');
console.log('1. Go to Admin > Manage Vendors');
console.log('2. Click "Import Vendors"');
console.log('3. Upload test_vendor_import.xlsx');
