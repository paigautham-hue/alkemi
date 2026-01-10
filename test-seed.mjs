import * as db from './server/db.ts';

async function testSeed() {
  try {
    console.log('Testing createSupplier...');
    const supplierId = await db.createSupplier({
      organizationId: 'test-org',
      name: 'Test Supplier',
      code: 'TEST-001',
      country: 'US',
      qualificationStatus: 'qualified',
    });
    console.log('Supplier created:', supplierId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testSeed();
