// Test the date conversion function
function toMySQLDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split('T')[0];
}

// Test cases
console.log('=== Date Conversion Tests ===');
console.log('');

// Test 1: Standard ISO datetime with Z
const test1 = "2026-03-30T00:00:00Z";
console.log(`Input: "${test1}"`);
console.log(`Output: "${toMySQLDate(test1)}"`);
console.log('Expected: "2026-03-30"');
console.log('');

// Test 2: ISO datetime with timezone offset
const test2 = "2026-04-15T14:30:00+05:30";
console.log(`Input: "${test2}"`);
console.log(`Output: "${toMySQLDate(test2)}"`);
console.log('Expected: "2026-04-15"');
console.log('');

// Test 3: Empty string
const test3 = "";
console.log(`Input: "${test3}"`);
console.log(`Output: ${toMySQLDate(test3)}`);
console.log('Expected: null');
console.log('');

// Test 4: Null value
const test4 = null;
console.log(`Input: ${test4}`);
console.log(`Output: ${toMySQLDate(test4)}`);
console.log('Expected: null');
console.log('');

// Test 5: Undefined
const test5 = undefined;
console.log(`Input: ${test5}`);
console.log(`Output: ${toMySQLDate(test5)}`);
console.log('Expected: null');
console.log('');

// Test 6: Regular date string
const test6 = "2026-12-25";
console.log(`Input: "${test6}"`);
console.log(`Output: "${toMySQLDate(test6)}"`);
console.log('Expected: "2026-12-25"');
console.log('');

console.log('=== All tests completed ===');
