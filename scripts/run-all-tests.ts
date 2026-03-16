import { runTest as runUS1 } from '../tests/integration/us1_perception.test';
import { runTest as runUS2 } from '../tests/integration/us2_analysis.test';
import { runTest as runUS3 } from '../tests/integration/us3_execution.test';
import { runTest as runUS4 } from '../tests/integration/us4_learning.test';

async function main() {
  console.log('Starting End-to-End System Test...\n');
  
  try {
    await runUS1();
    console.log('\n--- US1 Complete ---\n');
    
    await runUS2();
    console.log('\n--- US2 Complete ---\n');
    
    await runUS3();
    console.log('\n--- US3 Complete ---\n');
    
    await runUS4();
    console.log('\n--- US4 Complete ---\n');
    
    console.log('All tests completed successfully.');
  } catch (error) {
    console.error('System Test Failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
    main();
}
