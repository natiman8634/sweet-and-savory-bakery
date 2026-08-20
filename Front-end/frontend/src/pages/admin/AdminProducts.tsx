/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../../components/admin/common/LoadingSpinner';
import { formatCurrency } from '../../utils/orderUtils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock_quantity: number;
  is_available: boolean;
  category?: {
    id: number;
    category_name: string;
  };
  averageRating?: number;
  reviewsCount?: number;
  deleted_at?: string | null;
}

interface Category {
  id: number;
  category_name: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    is_available: true,
    image_url: '',
    category_id: 0
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Updated fetchCategories with correct API endpoint and error handling
  const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories...');
      const response = await axios.get('/api/categories');
      console.log('✅ Categories response:', response.data);

      let categoriesData = [];
      if (response.data.data) {
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      }

      setCategories(categoriesData);
      console.log('📂 Categories set:', categoriesData);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setCategories([]);
    }
  };

  // Filter products
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
    const matchesLowStock = !showLowStock || product.stock_quantity < 10;
    return matchesSearch && matchesCategory && matchesLowStock;
  }) : [];

 
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
     
      if (!newProduct.category_id || newProduct.category_id === 0) {
        setError('Please select a category');
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post(
        '/api/admin/products',
        {
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          stock_quantity: newProduct.stock_quantity,
          is_available: newProduct.is_available,
          category_id: newProduct.category_id,
          image_url: newProduct.image_url || ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts([response.data.data, ...products]);
      setShowAddModal(false);
      resetNewProductForm();
      setError(null);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

 
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      const response = await axios.patch(
        `/api/admin/products/${editingProduct.id}`,
        {
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          stock_quantity: editingProduct.stock_quantity,
          is_available: editingProduct.is_available,
          category_id: editingProduct.category_id,
          image_url: editingProduct.image_url
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(products.map(p =>
        p.id === editingProduct.id ? response.data.data : p
      ));
      setShowEditModal(false);
      setEditingProduct(null);
      setError(null);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteProduct = async (id: string) => {
    try {
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== id));
      setShowDeleteConfirm(null);
      setError(null);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };


  const handleToggleAvailability = async (id: string, _is_available: boolean) => {
    try {
      const response = await axios.patch(
        `/api/admin/products/${id}/toggle-availability`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(products.map(p =>
        p.id === id ? response.data.data : p
      ));
      setError(null);
    } catch (err: any) {
      console.error('Error toggling availability:', err);
      setError(err.response?.data?.message || 'Failed to toggle availability');
    }
  };

 
  const openEditModal = (product: Product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
    setError(null);
  };

 
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setError(null);
  };

  
  const openAddModal = () => {
    resetNewProductForm();
    setShowAddModal(true);
    setError(null);
  };

  
  const closeAddModal = () => {
    setShowAddModal(false);
    resetNewProductForm();
    setError(null);
  };

  
  const resetNewProductForm = () => {
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      is_available: true,
      image_url: '',
      category_id: 0
    });
  };

  // Stats
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const availableProducts = Array.isArray(products) ? products.filter(p => p.is_available).length : 0;
  const outOfStock = Array.isArray(products) ? products.filter(p => p.stock_quantity === 0).length : 0;
  const lowStock = Array.isArray(products) ? products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length : 0;

  if (loading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." fullPage />;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-sm text-gray-500">
            Manage your bakery products, stock levels, and availability
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          ➕ Add New Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm text-gray-500">Total Products</h3>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm text-gray-500">Available</h3>
          <p className="text-2xl font-bold text-green-600">{availableProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm text-gray-500">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-sm text-gray-500">Low Stock (&lt;10)</h3>
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg border transition-colors ${showLowStock
                ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {showLowStock ? '✅ Showing Low Stock' : '🔽 Filter Low Stock'}
          </button>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredProducts.length} of {totalProducts} products
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <p className="font-medium">⚠️ Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={product.image_url || '/placeholder.png'}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
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
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.stock_quantity === 0 ? 'bg-red-100 text-red-800' :
                        product.stock_quantity < 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                      {product.stock_quantity} units
                    </span>
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <span className="ml-2 text-xs text-yellow-600">⚠️ Low</span>
                    )}
                    {product.stock_quantity === 0 && (
                      <span className="ml-2 text-xs text-red-600">🚫 Out</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {product.is_available ? '🟢 Available' : '🔴 Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="text-gray-400 text-xs">
                        ({product.reviewsCount || 0})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(product.id, product.is_available)}
                        className={`${product.is_available ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                      >
                        {product.is_available ? '🔴' : '🟢'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/*  Add Product Modal with Category Dropdown Fix */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add New Product</h2>
              <button
                onClick={closeAddModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/*  Debug info for categories */}
            <div className="text-xs text-gray-400 mb-4">
              Categories loaded: {categories.length}
              {categories.length === 0 && " (Check console for errors)"}
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Price and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct({ ...newProduct, category_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>-- Select Category --</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ No categories found. Please check database.
                      </p>
                    )}
                  </div>
                </div>

                {/* Stock and Image */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Product Availability
                    </label>
                    <p className="text-xs text-gray-500">
                      {newProduct.is_available
                        ? '✅ Product will be visible to customers'
                        : '🔴 Product will be hidden from customers'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, is_available: !newProduct.is_available })}
                    className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors focus:outline-none ${newProduct.is_available ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform transition-transform bg-white rounded-full shadow-lg ${newProduct.is_available ? 'translate-x-9' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : '➕ Add Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Product</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              {/* ... same as before ... */}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;