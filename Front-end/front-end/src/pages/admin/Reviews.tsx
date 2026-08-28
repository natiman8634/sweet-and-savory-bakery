import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyReviews, deleteReview, type Review, getRatingStats } from '../../api/reviewApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
import { Input } from '../../components/ui/input';
import {
  RefreshCw,
  Search,
  Star,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';

// ============================================================
// 📊 STATS CARDS
// ============================================================

function ReviewStatsCards({ reviews }: { reviews: Review[] }) {
  const stats = getRatingStats(reviews);
  const verified = reviews.filter((r) => r.is_verified_purchase).length;

  const statItems = [
    { label: 'Total Reviews', value: stats.total, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'Average Rating', value: stats.average.toFixed(1), icon: Star, color: 'bg-amber-50 text-amber-600' },
    { label: 'Verified Purchases', value: verified, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: '5-Star Reviews', value: stats.distribution[5], icon: Star, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((stat, index) => (
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
// ⭐ STAR RATING DISPLAY
// ============================================================

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================
// 🏠 MAIN COMPONENT
// ============================================================

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // ============================================================
  // 📡 QUERIES
  // ============================================================

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-reviews', page],
    queryFn: () => getMyReviews(page, limit),
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 0;
  const totalItems = pagination?.totalItems || 0;

  // ============================================================
  // 🔄 MUTATIONS
  // ============================================================

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete review');
    },
  });

  // ============================================================
  // 🎯 HANDLERS
  // ============================================================

  const handleDelete = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const filteredReviews = searchInput
    ? reviews.filter(
        (r) =>
          r.comment?.toLowerCase().includes(searchInput.toLowerCase()) ||
          r.user?.profile?.full_name?.toLowerCase().includes(searchInput.toLowerCase()) ||
          r.product?.name?.toLowerCase().includes(searchInput.toLowerCase())
      )
    : reviews;

  // ============================================================
  // 🖥️ RENDER
  // ============================================================

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-4 md:p-6 rounded-2xl">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800"> Product Reviews</h1>
          <p className="text-sm text-gray-500">View and manage all customer reviews</p>
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
      {!isLoading && reviews.length > 0 && <ReviewStatsCards reviews={reviews} />}

      {/* ========== SEARCH ========== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer name, product, or review content..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-10 border-gray-200 focus:ring-blue-500 bg-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchInput('')}
              className="h-10 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Filter className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========== LOADING ========== */}
      {isLoading && !data && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      )}

      {/* ========== REVIEWS TABLE ========== */}
      {!isLoading && filteredReviews.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rating
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Review
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-gray-100 overflow-hidden shrink-0">
                            {review.product?.image_url ? (
                              <img
                                src={review.product.image_url}
                                alt={review.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                                🍞
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {review.product?.name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {review.user?.profile?.full_name || 'Anonymous'}
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {review.comment || 'No comment'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {review.is_verified_purchase ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review)}
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== EMPTY STATE ========== */}
      {!isLoading && filteredReviews.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-gray-500">
          <Star className="h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">
            {searchInput ? 'No reviews match your search' : 'No reviews yet'}
          </p>
          <p className="text-sm text-gray-400">
            {searchInput ? 'Try adjusting your search terms' : 'Customers will leave reviews for your products'}
          </p>
        </div>
      )}

      {/* ========== PAGINATION ========== */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} reviews
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
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
              disabled={!pagination.hasNextPage}
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
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review from{' '}
              <strong>{selectedReview?.user?.profile?.full_name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedReview?.id || '')}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}