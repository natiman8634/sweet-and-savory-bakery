import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({
      ...product,
      stock_quantity: product.stock_quantity,
      is_available: product.is_available
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const { id, stock_quantity, is_available, name, description, price, category_id, image_url } = editingProduct;

      const updateData = {};
      if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
      if (is_available !== undefined) updateData.is_available = is_available;
      if (name !== undefined && name !== '') updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined && price > 0) updateData.price = price;
      if (category_id !== undefined) updateData.category_id = category_id;
      if (image_url !== undefined) updateData.image_url = image_url;

      const response = await axios.patch(
        `/api/admin/products/${id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update product in the list
      setProducts(products.map(p => 
        p.id === id ? response.data.data : p
      ));

      toast.success('Product updated successfully!');
      setShowModal(false);
      setEditingProduct(null);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
      console.error('Error updating product:', error);
    }
  };

  const toggleAvailability = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/admin/products/${productId}/toggle-availability`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(products.map(p => 
        p.id === productId ? response.data.data : p
      ));

      toast.success(`Product ${response.data.data.is_available ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to toggle availability');
      console.error('Error toggling availability:', error);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/admin/products/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
      console.error('Error deleting product:', error);
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const lowStockProducts = products.filter(p => p.stock_quantity < 10);
      
      if (lowStockProducts.length === 0) {
        toast.info('No low stock products found');
        return;
      }

      const updates = lowStockProducts.map(p => ({
        id: p.id,
        is_available: p.stock_quantity > 0,
        stock_quantity: p.stock_quantity > 0 ? p.stock_quantity : 0
      }));

      const response = await axios.post(
        '/api/admin/products/bulk-update',
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchProducts();
      toast.success(`Bulk update completed! Updated ${response.data.data.updated.length} products`);
    } catch (error) {
      toast.error('Failed to bulk update');
      console.error('Error in bulk update:', error);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = !filterCategory || product.category_id === parseInt(filterCategory);
    
    // Low stock filter
    const matchesLowStock = !showLowStock || product.stock_quantity < 10;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Product Table Component
  const ProductTable = () => (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredProducts.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48?text=No+Image';
                      }}
                    />
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {product.description?.substring(0, 60)}...
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {product.category?.category_name || 'Uncategorized'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${Number(product.price).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  product.stock_quantity === 0 ? 'bg-red-100 text-red-800' :
                  product.stock_quantity < 10 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {product.stock_quantity} units
                </span>
                {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                  <span className="ml-2 text-xs text-yellow-600">⚠️ Low stock</span>
                )}
                {product.stock_quantity === 0 && (
                  <span className="ml-2 text-xs text-red-600">🚫 Out of stock</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  product.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_available ? '🟢 Available' : '🔴 Unavailable'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleEdit(product)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => toggleAvailability(product.id, product.is_available)}
                  className={`mr-3 transition-colors ${
                    product.is_available ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                  }`}
                >
                  {product.is_available ? '🔴 Deactivate' : '🟢 Activate'}
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-red-600 hover:text-red-900 transition-colors"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Edit Modal Component
  const EditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Edit Product</h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 text-3xl transition-colors"
          >
            ×
          </button>
        </div>

        {editingProduct && (
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  name: e.target.value
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  description: e.target.value
                })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Price and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    price: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    category_id: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={editingProduct.stock_quantity}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  stock_quantity: parseInt(e.target.value) || 0
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {editingProduct.stock_quantity === 0 ? '⚠️ Product will be out of stock' : 
                 editingProduct.stock_quantity < 10 ? '⚠️ Low stock warning' : 
                 '✅ Adequate stock level'}
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={editingProduct.image_url}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  image_url: e.target.value
                })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Product Availability
                </label>
                <p className="text-xs text-gray-500">
                  {editingProduct.is_available 
                    ? '✅ Product is visible to customers' 
                    : '🔴 Product is hidden from customers'}
                </p>
              </div>
              <button
                onClick={() => setEditingProduct({
                  ...editingProduct,
                  is_available: !editingProduct.is_available
                })}
                className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors focus:outline-none ${
                  editingProduct.is_available ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform transition-transform bg-white rounded-full shadow-lg ${
                    editingProduct.is_available ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your bakery products, stock levels, and availability
          </p>
        </div>
        <div className="flex space-x-3 mt-2 sm:mt-0">
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleBulkUpdate}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center shadow-md hover:shadow-lg"
          >
            🚀 Auto-fix Low Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
          <h3 className="text-sm text-gray-500">Total Products</h3>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm text-gray-500">Available</h3>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.is_available).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-sm text-gray-500">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">
            {products.filter(p => p.stock_quantity === 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-sm text-gray-500">Low Stock (&lt;10)</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Show Low Stock Only</span>
            </label>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <ProductTable />
      )}

      {/* Edit Modal */}
      {showModal && <EditModal />}
    </div>
  );
};

export default ProductManagement;