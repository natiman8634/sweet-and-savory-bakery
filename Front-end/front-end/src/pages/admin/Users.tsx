import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateUserRole, deleteUser } from '../../api/adminApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import {
  RefreshCw,
  Search,
  Trash2,
  Users,
  UserCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'; // ✅ Removed unused imports

// ============================================================
// 🎨 CONSTANTS
// ============================================================

const roleColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700 border-purple-200',
  Staff: 'bg-blue-100 text-blue-700 border-blue-200',
  Customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Customer', label: 'Customer' },
];

// ============================================================
// 📊 STATS CARDS
// ============================================================

function UserStats({ users }: { users: any[] }) {
  const total = users.length;
  const admins = users.filter((u) => u.role?.role_name === 'Admin').length;
  const staff = users.filter((u) => u.role?.role_name === 'Staff').length;
  const customers = users.filter((u) => u.role?.role_name === 'Customer').length;

  const stats = [
    { label: 'Total Users', value: total, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Admins', value: admins, icon: UserCheck, color: 'bg-purple-50 text-purple-600' },
    { label: 'Staff', value: staff, icon: Users, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Customers', value: customers, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// 🏠 MAIN COMPONENT
// ============================================================

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{ role?: string; search?: string }>({});
  const [page, setPage] = useState(1);
  const limit = 10;

  // ============================================================
  // 📡 QUERIES
  // ============================================================

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', filters, page],
    queryFn: () =>
      getAdminUsers({
        role: filters.role,
        page,
        limit,
      }),
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // ============================================================
  // 🔄 MUTATIONS
  // ============================================================

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) =>
      updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete user');
    },
  });

  // ============================================================
  // 🎯 HANDLERS
  // ============================================================

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const trimmed = value.trim();
    if (trimmed) {
      setFilters((prev) => ({ ...prev, search: trimmed }));
    } else {
      setFilters((prev) => ({ ...prev, search: undefined }));
    }
    setPage(1);
  };

  // ✅ Fix: handle null value from Select
  const handleRoleFilter = (value: string | null) => {
    const val = value ?? '';
    setRoleFilter(val);
    setFilters((prev) => ({ ...prev, role: val || undefined }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setRoleFilter('');
    setFilters({});
    setPage(1);
  };

  const handleRoleChange = (userId: string, roleName: string) => {
    const roleMap: Record<string, number> = { Admin: 1, Staff: 2, Customer: 3 };
    const roleId = roleMap[roleName];
    if (roleId) {
      updateRoleMutation.mutate({ userId, roleId });
    }
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // ============================================================
  // 🖥️ RENDER
  // ============================================================

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-4 md:p-6 rounded-2xl">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👤 Manage Users</h1>
          <p className="text-sm text-gray-500">View and manage all registered users</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && (
            <span className="flex items-center text-xs text-gray-500">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* ========== STATS ========== */}
      {!isLoading && users.length > 0 && <UserStats users={users} />}

      {/* ========== SEARCH & FILTERS ========== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-10 border-gray-200 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-36 h-10 border-gray-200 focus:ring-blue-500 bg-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Filter className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== LOADING ========== */}
      {isLoading && !data && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      )}

      {/* ========== MOBILE USER CARDS ========== */}
      {!isLoading && users.length > 0 && (
        <div className="md:hidden space-y-3">
          {users.map((user: any) => {
            const roleName = user.role?.role_name || 'Customer';
            const badgeClass = roleColors[roleName] || 'bg-gray-100 text-gray-700';
            return (
              <Card key={user.id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                      {user.profile?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{user.profile?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Badge className={`${badgeClass} border-0 text-xs`}>{roleName}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={roleName}
                        onChange={(e) => { if (e.target.value !== roleName) handleRoleChange(user.id, e.target.value); }}
                        className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {roleOptions.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========== USERS TABLE (desktop) ========== */}
      {!isLoading && users.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => {
                    const roleName = user.role?.role_name || 'Customer';
                    const badgeClass = roleColors[roleName] || 'bg-gray-100 text-gray-700';

                    return (
                      <TableRow key={user.id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                              {user.profile?.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {user.profile?.full_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.profile?.phone || 'No phone'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${badgeClass} border-0 px-3 py-1 font-medium`}>
                            {roleName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={roleName}
                              onValueChange={(value) => {
                                if (value && value !== roleName) {
                                  handleRoleChange(user.id, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs border-gray-200 focus:ring-blue-500">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* ========== EMPTY STATE ========== */}
      {!isLoading && users.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-gray-500">
          <Users className="h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No users found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* ========== PAGINATION ========== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={i + 1 === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(i + 1)}
                className={
                  i + 1 === page
                    ? 'bg-blue-600 text-white hover:bg-blue-700 min-w-8'
                    : 'border-blue-500 text-blue-600 hover:bg-blue-50 min-w-8'
                }
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================
          🗑️ DELETE CONFIRMATION
          ============================================================ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.profile?.full_name}</strong>?
              This action cannot be undone. The user will be soft-deleted (hidden from the system).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(selectedUser?.id)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}