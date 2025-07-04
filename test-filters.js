// Test script to check filters API response structure
const testFiltersAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/attendance-monitor/filters');
    const data = await response.json();
    
    console.log('=== FILTERS API RESPONSE TEST ===');
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    console.log('Data structure:', Object.keys(data.data || {}));
    
    if (data.data?.departments) {
      console.log('Departments count:', data.data.departments.length);
      console.log('All departments with IDs:');
      data.data.departments.forEach((dept, index) => {
        console.log(`  ${index + 1}. ${dept.name} (${dept.abbreviation_depart}) - ID: ${dept.id}`);
      });
    } else {
      console.log('No departments found in response');
    }
    
  } catch (error) {
    console.error('Error testing filters API:', error);
  }
};

// Run the test
testFiltersAPI();
