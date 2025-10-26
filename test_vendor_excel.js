import * as XLSX from 'xlsx';
import fs from 'fs';

// Test reading an Excel file to see column names
const testExcelParsing = () => {
  console.log('Testing Excel file parsing...\n');

  // You'll need to specify your Excel file path
  const filePath = './vendor_template.xlsx'; // Update this path

  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found. Please update the filePath variable in this script.');
    console.log('Current path:', filePath);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet);

  console.log('📊 Sheet Name:', workbook.SheetNames[0]);
  console.log('📝 Total Rows:', jsonData.length);
  console.log('\n');

  if (jsonData.length > 0) {
    console.log('🔑 Column Headers Found:');
    const headers = Object.keys(jsonData[0]);
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. "${header}"`);
    });

    console.log('\n📋 First Row Data:');
    console.log(JSON.stringify(jsonData[0], null, 2));

    console.log('\n🔍 Checking for "Vendor Name" mapping:');
    const firstRow = jsonData[0];

    // Test the exact mapping logic from the backend
    const vendorData = {
      name: firstRow['Vendor Name'] || firstRow.name
    };

    console.log('  Looking for: firstRow["Vendor Name"]');
    console.log('  Value found:', firstRow['Vendor Name']);
    console.log('  Looking for: firstRow.name');
    console.log('  Value found:', firstRow.name);
    console.log('  Final mapped name:', vendorData.name);

    if (!vendorData.name || vendorData.name.trim() === '') {
      console.log('\n❌ ISSUE DETECTED: Vendor Name is empty after mapping!');
      console.log('   This explains why import fails with "Vendor name is required"');
    } else {
      console.log('\n✅ Vendor Name successfully mapped:', vendorData.name);
    }
  }
};

testExcelParsing();
