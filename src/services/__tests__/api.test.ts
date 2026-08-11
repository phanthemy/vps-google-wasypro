import { api } from '../api';
import assert from 'assert';

async function runTests() {
  console.log('Running API Tests...');

  try {
    // Test getProducts
    const allProducts = await api.getProducts();
    assert(allProducts.length > 0, 'Should return products');
    
    const hotProducts = await api.getProducts({ isHot: true });
    assert(hotProducts.every(p => p.isHot), 'Should return only hot products');

    // Test getProductBySlug
    const product = await api.getProductBySlug('may-tao-nuoc-hydrogen-water-king-pro-9');
    assert(product.title.includes('Water King Pro 9'), 'Should return correct product');

    // Test getCategories
    const categories = await api.getCategories();
    assert(categories.length > 0, 'Should return categories');

    // Test lookupWarranty
    const warranty = await api.lookupWarranty('0900000000');
    assert(warranty.customerName === 'Nguyễn Văn A', 'Should find warranty by phone');
    
    // Test submitContact
    const contactSuccess = await api.submitContact({
      name: 'Nguyen Van A',
      phone: '0901234567',
      message: 'Can tu van',
    });
    assert(contactSuccess.success, 'Should submit contact successfully');

    try {
      await api.submitContact({
        name: 'Nguyen Van A',
        phone: '123',
        message: 'Can tu van',
      });
      assert.fail('Should have thrown an error for invalid phone');
    } catch (e: unknown) {
      assert((e as Error).message === 'Invalid phone number format', 'Should throw correct validation error');
    }

    console.log('✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
