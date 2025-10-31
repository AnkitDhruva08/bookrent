import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, DollarSign, BookOpen, Clock, Users, CheckSquare, XSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback'; 
import Swal from 'sweetalert2';

// --- 1. INTERFACES ---
interface Student {
  id: string; 
  name: string;
  student_id: string; 
  email: string;
}

interface Rental {
  id: string;
  start_date: string;
  free_month_ends: string | null; 
  end_date: string | null;
  status: string; 
  monthly_fee: string;
  total_fee: string;
  student: Student; 
  book: {
    title: string;
    author: string;
    pages: number;
    cover_url: string | null;
  };
}

// --- 2. UTILITY FUNCTIONS ---
const parseFee = (feeString: string): number => {
  if (!feeString) return 0;
  const match = feeString.match(/(\d+\.?\d*)/); 
  return match ? parseFloat(match[0]) : 0;
};

const formatDate = (dateString: string | null) =>
  dateString ? new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'N/A';

const getDaysRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const isOverdue = (endDate: string) => getDaysRemaining(endDate) < 0;

// --- 3. RENTALS MANAGER COMPONENT ---
export function RentalsManager() {
  const [rentals, setRentals] = useState<Rental[]>([]); 
  const [students, setStudents] = useState<Student[]>([]);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [isExtending, setIsExtending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : 'dummy-token';
  
  // --- API Fetching Functions ---
  const fetchRentals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/rentals/list/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Error fetching rentals: ${res.status}`);
      }
      const data = await res.json();
      console.log("📦 Rentals fetched:", data);
      
      const normalizedData = (data.rentals || []).map((r: any) => ({
          id: r.id,
          start_date: r.start_date,
          free_month_ends: r.free_month_ends || r.end_date, 
          end_date: r.end_date,
          status: r.status.toLowerCase().includes('active') ? 'active' : 'returned', 
          monthly_fee: r.monthly_fee,
          total_fee: r.total_fee,
          student: r.student,
          book: r.book,
      }));
      
      setRentals(normalizedData);
    } catch (error) {
      console.error("❌ Failed to fetch rentals:", error);
      setError('Failed to load rentals. Check API connection.');
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data.results || data || []); 
    } catch (error) {
      console.error('❌ Error fetching students for filter:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchRentals();
    fetchStudents();
  }, [fetchRentals, fetchStudents]);
  
  // --- API Action Handlers (UPDATED with SweetAlert) ---
  const extendRental = async () => {
    if (!selectedRental) return;
    setIsExtending(true);
    setError(null);

    const extraDays = extensionMonths * 30;

    try {
        const res = await fetch(`${API_BASE_URL}/rentals/extend/${selectedRental.id}/`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                extra_days: extraDays,
            }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || errorData.detail || `Extension failed: ${res.status}`);
        }
        
        // Show success alert
        await Swal.fire({
          title: 'Success!',
          text: `Rental extended by ${extensionMonths} month(s) successfully!`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3b82f6',
          background: '#f8fafc',
          iconColor: '#10b981',
        });
        
        setExtendDialogOpen(false);
        await fetchRentals();
    } catch (err: any) {
        console.error('❌ Extension failed:', err);
        
        // Show error alert
        await Swal.fire({
          title: 'Extension Failed',
          text: `Failed to extend rental: ${err.message}`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
          background: '#fef2f2',
          iconColor: '#dc2626',
        });
    } finally {
        setIsExtending(false);
    }
  };

  const returnRental = async (rentalId: string) => {
    // Show attractive confirmation dialog
    const result = await Swal.fire({
      title: 'Return Book?',
      text: 'Are you sure you want to mark this book as returned?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Return It!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      background: '#f8fafc',
      iconColor: '#3b82f6',
      reverseButtons: true,
      customClass: {
        confirmButton: 'mr-2',
        cancelButton: 'ml-2'
      }
    });

    if (!result.isConfirmed) return;

    setError(null);
    try {
        const res = await fetch(`${API_BASE_URL}/rentals/return/${rentalId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || `Return failed: ${res.status}`);
        }
        
        console.log(`✅ Rental ${rentalId} marked as returned.`);
        
        // Show success alert
        await Swal.fire({
          title: 'Book Returned!',
          text: 'The book has been successfully marked as returned.',
          icon: 'success',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#10b981',
          background: '#f0fdf4',
          iconColor: '#22c55e',
          timer: 3000,
          timerProgressBar: true,
        });
        
        await fetchRentals();
    } catch (err: any) {
        console.error('❌ Return failed:', err);
        
        // Show error alert
        await Swal.fire({
          title: 'Return Failed',
          text: `Failed to return rental: ${err.message}`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
          background: '#fef2f2',
          iconColor: '#dc2626',
        });
    }
  };

  const openExtendDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setExtensionMonths(1);
    setExtendDialogOpen(true);
  };

  const estimatedCharges = selectedRental
    ? (extensionMonths * parseFee(selectedRental.monthly_fee)).toFixed(2)
    : '0.00';
    
  // --- Filtering and Memoization ---
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      const studentMatch = selectedStudentId === 'all' || r.student.id === selectedStudentId;
      const searchMatch =
        r.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      return studentMatch && searchMatch;
    });
  }, [rentals, searchTerm, selectedStudentId]);

  console.log('filteredRentals:', filteredRentals);
  console.log('Filtered Rentals Count:', filteredRentals.length);

  const activeRentals = filteredRentals.filter((r) => r.status === 'active');
  const returnedRentals = filteredRentals.filter((r) => r.status === 'returned');
  const allRentals = filteredRentals;

  // --- Student-Specific Stats ---
  const studentStats = useMemo(() => {
    if (selectedStudentId === 'all' || !selectedStudentId) return null;
    const studentRentals = rentals.filter(r => r.student.id === selectedStudentId);
    if (studentRentals.length === 0) return null; 
    const total = studentRentals.length;
    const active = studentRentals.filter(r => r.status === 'active').length;
    const returned = studentRentals.filter(r => r.status === 'returned').length;
    const overdue = studentRentals.filter(r => r.status === 'active' && r.free_month_ends && isOverdue(r.free_month_ends)).length;
    const studentName = studentRentals[0]?.student.name || 'Student';
    return { total, active, returned, overdue, studentName };
  }, [rentals, selectedStudentId]);

  // --- Rendering Logic ---
  if (loading) {
    return (
      <Card className="p-8 text-center text-lg font-medium text-primary">
        <Clock className="animate-spin inline mr-2 h-6 w-6" /> Loading Rentals Data...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center border-red-500 bg-red-50">
        <p className="font-semibold text-red-700">Error Loading Data or Action Failed</p>
        <p className="text-sm text-red-600">{error}</p>
        <Button onClick={fetchRentals} className="mt-4">
          Try Reloading Rentals
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-primary" /> Rental Management Dashboard
      </h1>
      <hr />

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by book title, student name, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <hr className="mt-6" />

      {/* General/Filtered Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-indigo-500" />
              Total Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{allRentals.length}</div>
            <p className="text-sm text-muted-foreground">in current view</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-primary" />
              Active Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{activeRentals.length}</div>
            <p className="text-sm text-muted-foreground">currently checked out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-orange-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {activeRentals.filter((r) => r.free_month_ends && isOverdue(r.free_month_ends)).length}
            </div>
            <p className="text-sm text-muted-foreground">past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-green-500" />
              Total Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              ${rentals.reduce((sum, r) => sum + parseFee(r.total_fee), 0).toFixed(2)}
            </div> 
            <p className="text-sm text-muted-foreground">overall collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Student-Specific Card (Conditional) */}
      {studentStats && (
        <>
          <h2 className="text-2xl font-semibold flex items-center gap-2 mt-8">
            <Users className="h-6 w-6 text-indigo-500" /> Student Profile: **{studentStats.studentName}**
          </h2>
          <Card className="shadow-lg border-2 border-indigo-200">
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-indigo-600">{studentStats.total}</span>
                    <span className="text-sm text-muted-foreground">Total Rentals</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-primary">{studentStats.active}</span>
                    <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-green-600">{studentStats.returned}</span>
                    <span className="text-sm text-muted-foreground">Returned</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-orange-600">{studentStats.overdue}</span>
                    <span className="text-sm text-muted-foreground">Currently Overdue</span>
                </div>
            </CardContent>
          </Card>
          <hr className="mt-8" />
        </>
      )}

      {/* Active Rentals List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" /> Active Rentals <Badge className="ml-2">{activeRentals.length}</Badge>
        </h2>
        {activeRentals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active rentals found with current filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeRentals.map((rental) => {
              const dueDate = rental.free_month_ends; 
              const hasDueDate = !!dueDate; 
              const daysRemaining = hasDueDate ? getDaysRemaining(dueDate) : null;
              const overdue = hasDueDate ? isOverdue(dueDate) : false;
              
              return (
                <Card key={rental.id} className={`shadow-md transition-shadow duration-300 ${overdue ? 'border-l-4 border-l-orange-500 hover:shadow-lg' : 'hover:shadow-lg'}`}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Book Cover */}
                      <div className="flex-shrink-0">
                        {rental.book.cover_url ? (
                          <ImageWithFallback
                            src={rental.book.cover_url}
                            alt={rental.book.title}
                            className="w-16 h-24 object-cover rounded shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-muted rounded flex items-center justify-center shadow-sm">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Title and Actions */}
                        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold truncate">{rental.book.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">by {rental.book.author}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => openExtendDialog(rental)}>
                              Extend
                            </Button>
                            <Button size="sm" onClick={() => returnRental(rental.id)}>
                              Return
                            </Button>
                          </div>
                        </div>
                        {/* Rental Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-t pt-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Student</p>
                            <p className="text-sm font-semibold">{rental.student.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                                {rental.student.student_id ? `${rental.student.student_id.substring(0, 8)}...` : 'ID N/A'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Due Date</p>
                            <p className="text-sm font-semibold">{hasDueDate ? formatDate(dueDate) : 'TBD/N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                            <Badge variant={overdue ? 'destructive' : hasDueDate ? 'default' : 'secondary'} className="mt-1">
                              {hasDueDate
                                ? (overdue
                                    ? `Overdue ${Math.abs(daysRemaining || 0)} days`
                                    : `${daysRemaining} days left`)
                                : 'Active (No Due Date)'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Total Fee</p>
                            <p className="text-sm font-semibold text-green-600">{rental.total_fee}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <hr className="mt-8" />

      {/* Returned Rentals List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
            <XSquare className="h-6 w-6 text-gray-500" /> Returned Rentals <Badge variant="secondary" className="ml-2">{returnedRentals.length}</Badge>
        </h2>
        {returnedRentals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No returned rentals found with current filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {returnedRentals.map((rental) => (
                <Card key={rental.id} className="opacity-75 hover:opacity-100 transition-opacity duration-300">
                    <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center">
                        {/* Book Cover */}
                        <div className="flex-shrink-0">
                            {rental.book.cover_url ? (
                            <ImageWithFallback
                                src={rental.book.cover_url}
                                alt={rental.book.title}
                                className="w-12 h-16 object-cover rounded grayscale"
                            />
                            ) : (
                            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <div className="min-w-0">
                                    <h4 className="text-base font-semibold truncate">{rental.book.title}</h4>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {rental.student.name} ({rental.student.student_id ? `${rental.student.student_id.substring(0, 8)}...` : 'ID N/A'})
                                    </p>
                                </div>
                                <Badge variant="secondary" className="flex-shrink-0">Returned</Badge>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Returned On: **{formatDate(rental.end_date)}**</span>
                                <span>Total Paid: **{rental.total_fee}**</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
          </div>
        )}
      </section>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className='bg-white'>
          <DialogHeader>
            <DialogTitle>Extend Rental</DialogTitle>
            <DialogDescription>
                Extending: **{selectedRental?.book.title}** by **{selectedRental?.student.name}**
            </DialogDescription>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="extension-months">Extend By (months)</Label>
                <Input
                  id="extension-months"
                  type="number"
                  min="1"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(parseInt(e.target.value) || 1)}
                />
              </div>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Fee:</span>
                    <span className="font-medium">{selectedRental.monthly_fee}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-lg font-semibold">Estimated Extension Charges:</span>
                    <span className="text-xl font-bold text-primary">${estimatedCharges}</span>
                  </div>
                </CardContent>
              </Card>
              <Button
                onClick={extendRental}
                disabled={isExtending || extensionMonths < 1}
                className="w-full"
              >
                {isExtending ? 'Extending...' : `Confirm Extension for ${extensionMonths} Month${extensionMonths !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}