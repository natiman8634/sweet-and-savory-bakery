import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getCategories } from '../api/productApi';
import { useCart } from '../context/CartContext';
import {
  getAdminProducts, createProduct, updateProduct, deleteProduct, toggleProductAvailability,
  type CreateProductData,
} from '../api/adminApi';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
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
  Star, ShoppingCart, RefreshCw, Search, Plus, MoreHorizontal, Edit, Trash2,
  Package, AlertCircle, CheckCircle, XCircle, Filter, AlertTriangle,
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
  categories: any[];
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: CreateProductData) => void;
  isLoading: boolean;
}
function ProductForm({ categories, initialData, isEdit, onSubmit, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    image_url: initialData?.image_url || '',
    category_id: initialData?.category_id || (categories[0]?.id || 0),
    stock_quantity: initialData?.stock_quantity || 0,
    is_available: initialData?.is_available !== undefined ? initialData.is_available : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Product name is required'); return; }
    if (formData.price <= 0) { alert('Price must be greater than 0'); return; }
    if (formData.stock_quantity < 0) { alert('Stock quantity cannot be negative'); return; }
    if (!formData.category_id) { alert('Please select a category'); return; }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="name">Product Name *</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Sourdough Bread" className="border-gray-200 focus:ring-blue-500" required /></div>
        <div className="space-y-2"><Label htmlFor="category">Category *</Label>
          <Select value={String(formData.category_id)} onValueChange={(v) => { if (v) setFormData({ ...formData, category_id: parseInt(v) }); }}>
            <SelectTrigger className="border-gray-200 focus:ring-blue-500"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{categories.map((cat: any) => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.category_name}</SelectItem>))}</SelectContent>
          </Select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your product..." className="border-gray-200 focus:ring-blue-500 min-h-20" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="price">Price ($) *</Label>
          <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="border-gray-200 focus:ring-blue-500" required /></div>
        <div className="space-y-2"><Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input id="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} className="border-gray-200 focus:ring-blue-500" required /></div>
        <div className="space-y-2"><Label htmlFor="is_available">Status</Label>
          <Select value={formData.is_available ? 'true' : 'false'} onValueChange={(v) => setFormData({ ...formData, is_available: v === 'true' })}>
            <SelectTrigger className="border-gray-200 focus:ring-blue-500"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
          </Select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="image_url">Image URL</Label>
        <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" className="border-gray-200 focus:ring-blue-500" />
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
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filters, setFilters] = useState<{ category?: number; search?: string }>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: productsData, isLoading, isFetching, refetch } = useQuery({ queryKey: ['admin-products', filters], queryFn: () => getAdminProducts(filters) });
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const products = productsData?.data || [];
  const categories = categoriesData || [];

  const createMutation = useMutation({ mutationFn: (data: CreateProductData) => createProduct(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setIsAddDialogOpen(false); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to create product'); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductData> }) => updateProduct(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setIsEditDialogOpen(false); setSelectedProduct(null); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to update product'); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteProduct(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setIsDeleteDialogOpen(false); setSelectedProduct(null); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to delete product'); } });
  const toggleAvailabilityMutation = useMutation({ mutationFn: (id: string) => toggleProductAvailability(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); }, onError: (err: any) => { alert(err?.response?.data?.message || 'Failed to toggle availability'); } });

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => { const s = searchInput.trim() || undefined; const c = categoryFilter ? parseInt(categoryFilter) : undefined; if (prev.search === s && prev.category === c) return prev; return { search: s, category: c }; });
    }, 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchInput, categoryFilter]);

  const handleClearFilters = () => { setSearchInput(''); setCategoryFilter(''); setFilters({}); };
  const handleEdit = (product: any) => { setSelectedProduct(product); setIsEditDialogOpen(true); };
  const handleDelete = (product: any) => { setSelectedProduct(product); setIsDeleteDialogOpen(true); };

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-4 md:p-6 rounded-2xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Manage Products</h1><p className="text-sm text-gray-500">View, add, edit, and manage your product catalog</p></div>
        <div className="flex items-center gap-3">
          {isFetching && <span className="flex items-center text-xs text-gray-500"><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading...</span>}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="border-blue-500 text-blue-600 hover:bg-blue-50"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
        </div>
      </div>

      {!isLoading && products.length > 0 && <ProductStats products={products} />}

      {/* SEARCH & FILTERS */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="text" placeholder="Search by product name or description..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-10 border-gray-200 focus:ring-blue-500 bg-white" /></div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? '')}>
                <SelectTrigger className="w-40 h-10 border-gray-200 focus:ring-blue-500 bg-white"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent><SelectItem value="">All Categories</SelectItem>{categories.map((cat: any) => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.category_name}</SelectItem>))}</SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-10 border-blue-500 text-blue-600 hover:bg-blue-50"><Filter className="h-4 w-4 mr-1" /> Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && !productsData && <div className="space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>))}</div>}

      {/* PRODUCTS TABLE */}
      {!isLoading && products.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
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
                        <TableCell><Badge variant="outline" className="font-normal text-xs">{product.category?.category_name || 'Uncategorized'}</Badge></TableCell>
                        <TableCell className="font-semibold text-slate-800">${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.stock_quantity <= 5 && product.is_available ? 'bg-amber-100 text-amber-700' : product.stock_quantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{product.stock_quantity}</span></TableCell>
                        <TableCell><Badge className={`${badgeClass} border-0 px-3 py-1 font-medium`}>{product.is_available ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-600"><Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" /> {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0})</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4 text-gray-400" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => toggleAvailabilityMutation.mutate(product.id)}>{product.is_available ? <><XCircle className="h-4 w-4 mr-2 text-rose-500" /> Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Activate</>}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(product)}><Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(product)} className="text-rose-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
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
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
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
              Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
              {selectedProduct?.orderItems?.length > 0 && <span className="block mt-2 text-amber-600"><AlertTriangle className="h-4 w-4 inline mr-1" /> This product has {selectedProduct.orderItems.length} associated orders. It will be deactivated instead of permanently deleted.</span>}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(selectedProduct?.id)} className="bg-rose-600 hover:bg-rose-700">{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// USER PRODUCTS VIEW (used by /products route - always public)
// ============================================================
function UserProductsView() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { addItem } = useCart();

  if (isLoading) {
    return (<div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6 text-amber-800"> Our Fresh Baked Goods</h1><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => (<div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>))}</div></div>);
  }
  if (isError) {
    return (<div className="container mx-auto px-4 py-16 text-center"><p className="text-red-500 text-xl">❌ Failed to load products</p><p className="text-gray-600 mt-2">{error?.message || 'Please try again later.'}</p><Button onClick={() => refetch()} className="mt-4 bg-amber-700 hover:bg-amber-800">Retry</Button></div>);
  }
  if (!Array.isArray(data)) {
    return (<div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-semibold text-red-600">⚠️ Data Format Error</h2><p className="text-gray-600 mt-2">The product list is not available. Please try again.</p><Button onClick={() => refetch()} className="mt-4 bg-amber-700 hover:bg-amber-800">Retry</Button></div>);
  }
  if (data.length === 0) {
    return (<div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-semibold text-gray-600"> No products available yet</h2><p className="text-gray-500 mt-2">Check back soon for fresh baked goods!</p></div>);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-800"> Our Fresh Baked Goods</h1>
        <Badge variant="outline" className="text-sm px-3 py-1">{data.length} items</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <div className="relative h-48 bg-amber-50 overflow-hidden">
              {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-amber-200">🥖</div>}
              <div className="absolute top-2 right-2">{product.stock_quantity > 0 ? <Badge className="bg-green-600 hover:bg-green-700">In Stock</Badge> : <Badge variant="destructive">Out of Stock</Badge>}</div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-semibold line-clamp-1">{product.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-amber-600"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><span className="font-medium">{product.averageRating?.toFixed(1) || '0.0'}</span><span className="text-gray-400">({product.reviewsCount || 0} reviews)</span></div>
            </CardHeader>
            <CardContent className="grow"><p className="text-sm text-gray-600 line-clamp-2">{product.description || 'Freshly baked daily!'}</p></CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4">
              <span className="text-2xl font-bold text-amber-800">${Number(product.price).toFixed(2)}</span>
              <Button size="sm" className="bg-amber-700 hover:bg-amber-800 gap-2" disabled={product.stock_quantity === 0}
                onClick={() => addItem({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url, stock_quantity: product.stock_quantity })}>
                <ShoppingCart className="w-4 h-4" /> Add
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
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
