import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getCategories } from '../api/productApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  getAdminProducts, createProduct, updateProduct, deleteProduct, toggleProductAvailability, createCategory,
  type CreateProductData,
} from '../api/adminApi';
import ProductCard from '../components/product/ProductCard';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  RefreshCw, Search, Plus, MoreHorizontal, Edit, Trash2,
  Package, AlertCircle, CheckCircle, XCircle, Filter, AlertTriangle, Star, ChevronDown, Upload,
} from 'lucide-react';

// ============================================================
// ADMIN CONSTANTS
// ============================================================
const adminStatusBadgeStyles: Record<string, string> = {
  true: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  false: 'bg-rose-100 text-rose-700 border-rose-200',
};

// ============================================================
// ADMIN STATS
// ============================================================
function ProductStats({ products }: { products: any[] }) {
  const total = products.length;
  const inStock = products.filter((p) => p.is_available).length;
  const outOfStock = products.filter((p) => !p.is_available).length;
  const lowStock = products.filter((p) => p.is_available && p.stock_quantity <= 5).length;
  const stats = [
    { label: 'Total Products', value: total, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'In Stock', value: inStock, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Out of Stock', value: outOfStock, icon: XCircle, color: 'bg-rose-50 text-rose-600' },
    { label: 'Low Stock (≤5)', value: lowStock, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-medium text-gray-500">{stat.label}</p><p className="text-xl font-bold text-slate-800">{stat.value}</p></div>
              <div className={`p-2 rounded-full ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// PRODUCT FORM (Reusable for Add/Edit)
// ============================================================
interface ProductFormProps {
  // Flat list of categories: top-level ones have parent_id = null,
  // subcategories point at their parent through parent_id.
  categories: any[];
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: CreateProductData) => void;
  isLoading: boolean;
}
function ProductForm({ categories, initialData, isEdit, onSubmit, isLoading }: ProductFormProps) {
  const queryClient = useQueryClient();
  const [imageMode, setImageMode] = useState<'url' | 'file'>(initialData?.image_url?.startsWith('data:') ? 'file' : 'url');

  // Two-level category picker: parent category → subcategory
  const initialCategory = initialData?.category;
  const [parentCategoryId, setParentCategoryId] = useState<string>(
    String(initialCategory?.parent_id ?? initialData?.category_id ?? '')
  );
  const [subcategoryId, setSubcategoryId] = useState<string>(
    initialCategory?.parent_id ? String(initialData?.category_id ?? '') : ''
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState<'category' | 'subcategory' | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [formData, setFormData] = useState<CreateProductData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    image_url: initialData?.image_url || '',
    category_id: initialData?.category_id || '',
    stock_quantity: initialData?.stock_quantity || 0,
    is_available: initialData?.is_available !== undefined ? initialData.is_available : true,
  });

  const topCategories = categories.filter((cat) => !cat.parent_id);
  const subcategories = parentCategoryId
    ? categories.filter((cat) => String(cat.parent_id) === parentCategoryId)
    : [];

  const handleParentChange = (value: string) => {
    setParentCategoryId(value);
    setSubcategoryId('');
  };

  const resetNewCategory = () => {
    setIsNewCategoryOpen(null);
    setNewCategoryName('');
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) { alert('Please enter a category name'); return; }

    try {
      setIsCreatingCategory(true);
      const isSubcategory = isNewCategoryOpen === 'subcategory';

      if (isSubcategory && !parentCategoryId) {
        alert('Please select a category first, then add a subcategory to it');
        setIsCreatingCategory(false);
        return;
      }

      const response = await createCategory({
        category_name: name,
        parent_id: isSubcategory ? parseInt(parentCategoryId) : undefined,
      });
      const created = response?.data;

      if (created?.id) {
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        if (isSubcategory) {
          setSubcategoryId(String(created.id));
        } else {
          setParentCategoryId(String(created.id));
          setSubcategoryId('');
        }
      }
      resetNewCategory();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, image_url: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Product name is required'); return; }
    if (formData.price <= 0) { alert('Price must be greater than 0'); return; }
    if (formData.stock_quantity < 0) { alert('Stock quantity cannot be negative'); return; }
    if (!parentCategoryId) { alert('Please select a category'); return; }

    // When the chosen category has subcategories, a subcategory must be chosen too.
    let finalCategoryId = parseInt(parentCategoryId);
    if (subcategories.length > 0) {
      if (!subcategoryId) { alert('Please select a category / subcategory'); return; }
      finalCategoryId = parseInt(subcategoryId);
    }
    const imageUrl = formData.image_url.trim();
    if (imageMode === 'url' && imageUrl && !/^(https?:\/\/|\/\/|\/|data:image\/)/i.test(imageUrl)) {
      alert('Please enter a valid image URL (it must start with http:// or https://)');
      return;
    }
    onSubmit({ ...formData, category_id: finalCategoryId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="name">Product Name *</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Sourdough Bread" className="border-gray-200 focus:ring-blue-500" required /></div>
        <div className="space-y-2"><Label htmlFor="category">Category *</Label>
          <div className="relative">
            <select
              value={parentCategoryId}
              onChange={(e) => handleParentChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">Select category</option>
              {topCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {isNewCategoryOpen === 'category' && (
            <div className="flex gap-2 mt-1">
              <Input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="h-9 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } if (e.key === 'Escape') resetNewCategory(); }}
              />
              <Button type="button" size="sm" className="h-9 bg-blue-600 hover:bg-blue-700" onClick={handleCreateCategory} disabled={isCreatingCategory}>
                {isCreatingCategory ? 'Adding...' : 'Add'}
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={resetNewCategory}>Cancel</Button>
            </div>
          )}
        </div>
        <div className="space-y-2"><Label htmlFor="subcategory">Subcategory {subcategories.length > 0 ? '*' : ''}</Label>
          <div className="relative">
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!parentCategoryId || subcategories.length === 0}
              className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {!parentCategoryId
                  ? 'Select a category first'
                  : subcategories.length === 0
                  ? 'No subcategories (uses the category)'
                  : 'Select subcategory'}
              </option>
              {subcategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={() => { setIsNewCategoryOpen(isNewCategoryOpen === 'subcategory' ? null : 'subcategory'); setNewCategoryName(''); }}
            disabled={!parentCategoryId}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            + New subcategory
          </button>
          {isNewCategoryOpen === 'subcategory' && (
            <div className="flex gap-2 mt-1">
              <Input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New subcategory name"
                className="h-9 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } if (e.key === 'Escape') resetNewCategory(); }}
              />
              <Button type="button" size="sm" className="h-9 bg-blue-600 hover:bg-blue-700" onClick={handleCreateCategory} disabled={isCreatingCategory}>
                {isCreatingCategory ? 'Adding...' : 'Add'}
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={resetNewCategory}>Cancel</Button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your product..." className="border-gray-200 focus:ring-blue-500 min-h-20" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="price">Price (birr) *</Label>
          <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="border-gray-200 focus:ring-blue-500" required /></div>
        <div className="space-y-2"><Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input id="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} className="border-gray-200 focus:ring-blue-500" required /></div>
        <div className="space-y-2"><Label htmlFor="is_available">Status</Label>
          <div className="relative">
            <select
              value={formData.is_available ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'true' })}
              className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setImageMode('url')} className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${imageMode === 'url' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Paste URL</button>
          <button type="button" onClick={() => setImageMode('file')} className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${imageMode === 'file' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Upload File</button>
        </div>
        {imageMode === 'url' ? (
          <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" className="border-gray-200 focus:ring-blue-500" />
        ) : (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Choose image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            {formData.image_url && (
              <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
        )}
        {formData.image_url && <div className="mt-2"><img src={formData.image_url} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================
// ADMIN PRODUCTS VIEW (used by /admin/products route)
// ============================================================
function AdminProductsView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Staff can adjust stock and edit details, but adding/deleting products stays with Admins
  const isAdmin = user?.role === 'Admin';
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filters, setFilters] = useState<{ category?: number }>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: productsData, isLoading, isFetching, refetch } = useQuery({ queryKey: ['admin-products', filters], queryFn: () => getAdminProducts(filters) });
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const allProducts = productsData?.data || [];
  const trimmedSearch = searchInput.trim().toLowerCase();
  const products = allProducts.filter((p: any) => {
    const matchesSearch = !trimmedSearch || p.name?.toLowerCase().includes(trimmedSearch) || p.description?.toLowerCase().includes(trimmedSearch);
    const matchesStock = stockFilter === 'all' || (stockFilter === 'in_stock' && p.stock_quantity > 0) || (stockFilter === 'out_of_stock' && p.stock_quantity === 0) || (stockFilter === 'low_stock' && p.stock_quantity > 0 && p.stock_quantity <= 5);
    return matchesSearch && matchesStock;
  });
  const categories = categoriesData || [];

  const createMutation = useMutation({ mutationFn: (data: CreateProductData) => createProduct(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setIsAddDialogOpen(false); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to create product'); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductData> }) => updateProduct(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setIsEditDialogOpen(false); setSelectedProduct(null); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to update product'); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteProduct(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setIsDeleteDialogOpen(false); setSelectedProduct(null); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to delete product'); } });
  const toggleAvailabilityMutation = useMutation({ mutationFn: (id: string) => toggleProductAvailability(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to toggle availability'); } });

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => { const c = categoryFilter ? parseInt(categoryFilter) : undefined; if (prev.category === c) return prev; return { category: c }; });
    }, 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [categoryFilter]);

  const handleClearFilters = () => { setSearchInput(''); setCategoryFilter(''); setStockFilter('all'); setFilters({}); };
  const handleEdit = (product: any) => { setSelectedProduct(product); setIsEditDialogOpen(true); };
  const handleDelete = (product: any) => { setSelectedProduct(product); setIsDeleteDialogOpen(true); };

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-4 md:p-6 rounded-2xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manage Products</h1><p className="text-xs sm:text-sm text-gray-500">View stock levels and manage your product catalog</p></div>
        <div className="flex items-center gap-2">
          {isFetching && <span className="flex items-center text-xs text-gray-500"><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Loading...</span>}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="border-blue-500 text-blue-600 hover:bg-blue-50 h-9"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          {isAdmin && <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>}
        </div>
      </div>

      {!isLoading && allProducts.length > 0 && <ProductStats products={allProducts} />}

      {/* SEARCH & FILTERS */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="text" placeholder="Search products..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-10 border-gray-200 focus:ring-blue-500 bg-white" /></div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock (≤5)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-10 shrink-0 border-blue-500 text-blue-600 hover:bg-blue-50"><Filter className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Clear</span></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && !productsData && <div className="space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>))}</div>}

      {/* MOBILE PRODUCT CARDS */}
      {!isLoading && products.length > 0 && (
        <div className="md:hidden space-y-3">
          {products.map((product: any) => {
            const statusKey = product.is_available ? 'true' : 'false';
            const badgeClass = adminStatusBadgeStyles[statusKey] || 'bg-gray-100 text-gray-700';
            return (
              <Card key={product.id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-400 text-lg">🍞</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate">{product.description || 'No description'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4 text-gray-400" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => toggleAvailabilityMutation.mutate(product.id)}>{product.is_available ? <><XCircle className="h-4 w-4 mr-2 text-rose-500" /> Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Activate</>}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(product)}><Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit</DropdownMenuItem>
                        {isAdmin && <DropdownMenuItem onClick={() => handleDelete(product)} className="text-rose-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-normal text-xs">{product.category ? (product.category.parent ? `${product.category.parent.category_name} / ${product.category.category_name}` : product.category.category_name) : 'Uncategorized'}</Badge>
                    <Badge className={`${badgeClass} border-0 text-xs`}>{product.is_available ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      Stock
                      {product.stock_quantity === 0 && <span className="ml-1 font-semibold text-rose-600">(Out)</span>}
                      {product.stock_quantity > 0 && product.stock_quantity <= 5 && <span className="ml-1 font-semibold text-amber-600">(Low)</span>}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{product.stock_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">${Number(product.price).toFixed(2)}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0})</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DESKTOP PRODUCTS TABLE */}
      {!isLoading && products.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  {['Product','Category','Price','Stock','Status','Rating','Actions'].map((h) => (<TableHead key={h} className={`text-xs font-semibold text-gray-600 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</TableHead>))}
                </TableRow></TableHeader>
                <TableBody>
                  {products.map((product: any) => {
                    const statusKey = product.is_available ? 'true' : 'false';
                    const badgeClass = adminStatusBadgeStyles[statusKey] || 'bg-gray-100 text-gray-700';
                    return (
                      <TableRow key={product.id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell><div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-400 text-lg">🍞</div>}</div>
                          <div><p className="font-medium text-slate-800">{product.name}</p><p className="text-xs text-gray-500 truncate max-w-xs">{product.description || 'No description'}</p></div>
                        </div></TableCell>
                        <TableCell><Badge variant="outline" className="font-normal text-xs">{product.category ? (product.category.parent ? `${product.category.parent.category_name} / ${product.category.category_name}` : product.category.category_name) : 'Uncategorized'}</Badge></TableCell>
                        <TableCell className="font-semibold text-slate-800">${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">{product.stock_quantity}</span>
                            {product.stock_quantity === 0 ? (
                              <span className="text-[10px] font-semibold text-rose-600">Out</span>
                            ) : product.stock_quantity <= 5 ? (
                              <span className="text-[10px] font-semibold text-amber-600">Low</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell><Badge className={`${badgeClass} border-0 px-3 py-1 font-medium`}>{product.is_available ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-600"><Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" /> {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0})</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4 text-gray-400" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => toggleAvailabilityMutation.mutate(product.id)}>{product.is_available ? <><XCircle className="h-4 w-4 mr-2 text-rose-500" /> Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Activate</>}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(product)}><Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit</DropdownMenuItem>
                              {isAdmin && <DropdownMenuItem onClick={() => handleDelete(product)} className="text-rose-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-gray-500">
          <Package className="h-16 w-16 text-gray-300" /><p className="text-lg font-medium text-gray-600">No products found</p><p className="text-sm text-gray-400">Add your first product to get started</p>
          {isAdmin && <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>}
        </div>
      )}

      {/* ADD PRODUCT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Product</DialogTitle><DialogDescription>Fill in the details to add a new product to your catalog.</DialogDescription></DialogHeader>
          <ProductForm categories={categories} onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle><DialogDescription>Update the product details below.</DialogDescription></DialogHeader>
          <ProductForm categories={categories} initialData={selectedProduct} isEdit onSubmit={(data) => { if (selectedProduct) updateMutation.mutate({ id: selectedProduct.id, data }); }} isLoading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{selectedProduct?.name}</strong>? It will be removed from the catalog for good.
              {selectedProduct?.orderItems?.length > 0 && <span className="block mt-2 text-amber-600"><AlertTriangle className="h-4 w-4 inline mr-1" /> This product appears in {selectedProduct.orderItems.length} past order(s). Those orders are kept — only the product link is removed from them.</span>}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(selectedProduct?.id)} className="bg-rose-600 hover:bg-rose-700">{deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// OCCASION CHIPS (shown for cake, bread & pastry categories)
// Styled like the status filter chips on the Orders page
// ============================================================
const OCCASIONS = [
  { value: 'all', label: 'All', color: 'bg-slate-100 text-slate-700 border-slate-200', activeColor: 'bg-slate-800 text-white border-slate-800' },
  { value: 'birthday', label: '🎈 Birthday', color: 'bg-rose-50 text-rose-700 border-rose-200', activeColor: 'bg-rose-500 text-white border-rose-500' },
  { value: 'wedding', label: '💍 For Wedding', color: 'bg-purple-50 text-purple-700 border-purple-200', activeColor: 'bg-purple-500 text-white border-purple-500' },
  { value: 'holiday', label: '🎄 Holiday', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'other', label: '✨ Other', color: 'bg-amber-50 text-amber-700 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500' },
];

const OCCASION_KEYWORDS: Record<string, string[]> = {
  birthday: ['birthday'],
  wedding: ['wedding', 'bridal', 'engagement', 'anniversary'],
  holiday: ['holiday', 'christmas', 'easter', 'halloween', 'new year'],
};

// Occasion chips appear for cake, bread AND pastry categories
const isOccasionCategoryName = (name: string) => {
  const n = (name || '').toLowerCase();
  return n.includes('cake') || n.includes('bread') || n.includes('pastr');
};

const occasionText = (product: any) =>
  `${product.name || ''} ${product.description || ''}`.toLowerCase();

// 'other' = items that match none of the named occasions
const matchesOccasion = (product: any, occasion: string) => {
  const text = occasionText(product);
  if (occasion === 'other') {
    return !Object.values(OCCASION_KEYWORDS).some((keywords) =>
      keywords.some((keyword) => text.includes(keyword))
    );
  }
  return (OCCASION_KEYWORDS[occasion] || []).some((keyword) =>
    text.includes(keyword)
  );
};

// ============================================================
// USER PRODUCTS VIEW (used by /products route - always public)
// ============================================================
function UserProductsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  // Active sub-category chip ('all' = every product of the selected main category)
  const [selectedSub, setSelectedSub] = useState('all');
  const [subFromLinkResolved, setSubFromLinkResolved] = useState(false);

  const { data: productsData, isLoading, isError, error, refetch } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { addItem } = useCart();

  const products = Array.isArray(productsData) ? productsData : [];
  const categories = categoriesData || [];

  // The dropdown lists main categories only — sub-categories show up as
  // sliding chips once a main category has been clicked.
  const mainCategories = categories.filter((cat: any) => !cat.parent_id);
  const subCategoryChips = selectedCategory
    ? categories.filter((cat: any) => String(cat.parent_id) === selectedCategory)
    : [];

  // Support links that point straight at a sub-category (e.g. old bookmarks):
  // switch to its main category and pre-select the sub-category chip.
  useEffect(() => {
    if (subFromLinkResolved || categories.length === 0) return;
    const paramCategory = searchParams.get('category') || '';
    const paramCat = categories.find((cat: any) => String(cat.id) === paramCategory);
    if (paramCat?.parent_id) {
      setSelectedCategory(String(paramCat.parent_id));
      setSelectedSub(String(paramCat.id));
    }
    setSubFromLinkResolved(true);
  }, [categories, searchParams, subFromLinkResolved]);

  // Occasion chips appear for cake, bread and pastry categories
  const selectedCategoryName =
    categories.find((cat: any) => String(cat.id) === selectedCategory)?.category_name || '';
  const showOccasionChips = isOccasionCategoryName(selectedCategoryName);

  // Every product of the selected main category, sub-categories included
  const mainCategoryIds = useMemo(() => {
    if (!selectedCategory) return null;
    const ids = new Set<string>([selectedCategory]);
    categories.forEach((cat: any) => {
      if (String(cat.parent_id) === selectedCategory) ids.add(String(cat.id));
    });
    return ids;
  }, [selectedCategory, categories]);

  // A selected sub-category chip narrows the products to that sub-category
  const selectedCategoryIds = useMemo(() => {
    if (!selectedCategory) return null;
    if (selectedSub !== 'all') return new Set<string>([selectedSub]);
    return mainCategoryIds;
  }, [selectedCategory, selectedSub, mainCategoryIds]);

  // Per-occasion counts over the products in the selected category (Orders-page style badges)
  const categoryProducts = useMemo(
    () => products.filter((product) => selectedCategoryIds?.has(String(product.category_id)) ?? true),
    [products, selectedCategoryIds]
  );
  const mainCategoryProductCount =
    products.filter((product) => mainCategoryIds?.has(String(product.category_id))).length;
  const subCategoryProductCount = (subCategoryId: string) =>
    products.filter((product) => String(product.category_id) === subCategoryId).length;
  const occasionCount = (value: string) => {
    if (value === 'all') return categoryProducts.length;
    return categoryProducts.filter((product) => matchesOccasion(product, value)).length;
  };

  // Filter products by search, category and occasion
  const filteredProducts = useMemo(() => {
    const bySearchAndCategory = products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategoryIds?.has(String(product.category_id)) ?? true;
      return matchesSearch && matchesCategory;
    });

    if (!showOccasionChips || selectedOccasion === 'all') return bySearchAndCategory;

    const occasionMatches = bySearchAndCategory.filter((product) =>
      matchesOccasion(product, selectedOccasion)
    );

    // Graceful fallback: if nothing mentions the occasion, keep showing all items
    return occasionMatches.length > 0 ? occasionMatches : bySearchAndCategory;
  }, [products, searchQuery, selectedCategoryIds, selectedOccasion, showOccasionChips]);

  if (isLoading) {
    return (<div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6 text-amber-800"> Our Fresh Baked Goods</h1><div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">{[...Array(8)].map((_, i) => (<div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>))}</div></div>);
  }
  if (isError) {
    return (<div className="container mx-auto px-4 py-16 text-center"><p className="text-red-500 text-xl">Failed to load products</p><p className="text-gray-600 mt-2">{error?.message || 'Please try again later.'}</p><Button onClick={() => refetch()} className="mt-4 bg-amber-700 hover:bg-amber-800">Retry</Button></div>);
  }
  if (products.length === 0) {
    return (<div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-semibold text-gray-600">No products available yet</h2><p className="text-gray-500 mt-2">Check back soon for fresh baked goods!</p></div>);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-amber-800">Our Fresh Baked Goods</h1>
        <Badge variant="outline" className="text-sm px-3 py-1 w-fit">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {/* Search & Category Filter */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('search', e.target.value);
              else params.delete('search');
              setSearchParams(params, { replace: true });
            }}
            className="pl-9 h-10 border-red-200 focus-visible:ring-red-500 focus-visible:border-red-400 bg-red-50/40 text-slate-800 placeholder:text-red-300"
          />
        </div>
        <div className="relative w-40 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCategory(val);
              setSelectedOccasion('all');
              setSelectedSub('all');
              const params = new URLSearchParams(searchParams);
              if (val) params.set('category', val);
              else params.delete('category');
              setSearchParams(params, { replace: true });
            }}
            className="w-full h-10 px-3 pr-8 rounded-lg border border-red-200 bg-red-50/40 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {mainCategories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400 pointer-events-none" />
        </div>
        {(searchQuery || selectedCategory) && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 shrink-0 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedOccasion('all');
              setSelectedSub('all');
              setSearchParams({}, { replace: true });
            }}
          >
            <Filter className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Sub-category chips — shown after a main category is clicked */}
      {selectedCategory && subCategoryChips.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedSub('all')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer
              ${
                selectedSub === 'all'
                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                  : 'bg-red-50 text-red-700 border-red-200 hover:shadow-sm'
              }
            `}
          >
            All {selectedCategoryName}
            <span
              className={`
                inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1
                ${selectedSub === 'all' ? 'bg-white/25 text-white' : 'bg-black/5 text-inherit'}
              `}
            >
              {mainCategoryProductCount}
            </span>
          </button>
          {subCategoryChips.map((sub) => {
            const isActive = selectedSub === String(sub.id);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSub(String(sub.id))}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer
                  ${
                    isActive
                      ? 'bg-red-500 text-white border-red-500 shadow-sm'
                      : 'bg-red-50 text-red-700 border-red-200 hover:shadow-sm'
                  }
                `}
              >
                {sub.category_name}
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1
                    ${isActive ? 'bg-white/25 text-white' : 'bg-black/5 text-inherit'}
                  `}
                >
                  {subCategoryProductCount(String(sub.id))}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Occasion Chips (Orders-page style) — for cake, bread & pastry categories
          that have no sub-categories */}
      {showOccasionChips && subCategoryChips.length === 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1 scrollbar-hide">
          {OCCASIONS.map((occasion) => {
            const count = occasionCount(occasion.value);
            const isActive = selectedOccasion === occasion.value;
            return (
              <button
                key={occasion.value}
                type="button"
                onClick={() => setSelectedOccasion(occasion.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer
                  ${
                    isActive
                      ? occasion.activeColor + ' shadow-sm'
                      : occasion.color + ' hover:shadow-sm'
                  }
                `}
              >
                {occasion.value === 'all' && selectedCategoryName
                  ? `All ${selectedCategoryName}`
                  : occasion.label}
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1
                    ${isActive ? 'bg-white/25 text-white' : 'bg-black/5 text-inherit'}
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No products found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="full"
              onAddToCart={(p) =>
                addItem({
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  image_url: p.image_url,
                  stock_quantity: p.stock_quantity,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// EXPORTS: route-based, not role-based
// Default = public product page (/products)
// AdminProducts = admin management page (/admin/products)
// ============================================================
export default function Products() {
  return <UserProductsView />;
}

export function AdminProducts() {
  return <AdminProductsView />;
}
