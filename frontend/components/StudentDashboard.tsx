import { useState, useEffect, useCallback } from 'react';
import { User, BookOpen, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';

// --- INTERFACES ---

interface Student {
  id: string; 
  name: string;
  student_id: string;
  email: string;
}

interface Rental {
    id: string;
    start_date: string;
    free_month_ends: string;
    end_date: string | null;
    status: string;
    monthly_fee: string;
    total_fee: string;
    book: {
        title: string;
        author: string;
        pages: number;
        cover_url: string | null;
    };
}


// --- Utility Functions ---

const parseFee = (feeString: string): number => {
    if (!feeString) return 0;
    const match = feeString.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[0]) : 0;
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
};


// --- StudentDashboard Component ---

export function StudentDashboard() {
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = "http://127.0.0.1:8000/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    // --- API Fetching Functions ---

    const fetchStudents = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/student/list/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            console.log('Fetched students:', data);
            
            const fetchedStudents = data.results || data || [];
            setStudents(fetchedStudents);
            
            if (fetchedStudents.length > 0 && !selectedStudentId) {
                setSelectedStudentId(fetchedStudents[0].id);
            }
        } catch (error) {
            console.error('❌ Error fetching students:', error);
            setError('Failed to load student list.');
        }
    }, [token, selectedStudentId]);

    const fetchStudentRentals = useCallback(async (studentPkId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/rentals/student/${studentPkId}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (!res.ok) {
                if (res.status === 404) {
                    setRentals([]);
                    return;
                }
                throw new Error(`Error fetching rentals: ${res.status}`);
            }
    
            const data = await res.json();
    
            const rentalsArray = data.rentals || data;

            const normalizedData: Rental[] = (rentalsArray || []).map((r: any) => ({
                id: r.id,
                start_date: r.start_date,
                free_month_ends: r.free_month_ends,
                end_date: r.end_date,
                status: r.status.toLowerCase().includes('active') ? 'active' : 'returned',
                monthly_fee: r.monthly_fee,
                total_fee: r.total_fee,
                book: r.book,
            }));
            
            setRentals(normalizedData);
    
        } catch (error) {
            console.error("❌ Failed to fetch rentals:", error);
            setError('Failed to load rental history for the selected student.');
            setRentals([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);


    // --- Effects ---

    useEffect(() => {
      fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        if (selectedStudentId) {
            fetchStudentRentals(selectedStudentId);
        } else {
            setRentals([]);
        }
    }, [selectedStudentId, fetchStudentRentals]);


    // --- Derived State and Calculations ---
    console.log('students:', students);
    const selectedStudent = students.find((s) => s.id === selectedStudentId);
    const activeRentals = rentals.filter((r) => r.status === 'active');
    
    const totalCharges = rentals.reduce((sum, r) => sum + parseFee(r.total_fee), 0);
    const booksRented = rentals.length;


    // --- Render ---

    if (error && !selectedStudentId) {
        return <div className="text-red-500 p-4 border rounded">Error: {error}</div>;
    }

    return (
        <div className="space-y-8 p-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                 <User className="h-7 w-7 text-indigo-600" /> Student Rental Dashboard
            </h1>
            <hr />

            {/* Student Selection (Improved Dropdown) */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Student</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className='w-full md:w-96'>
                        {/* Display the selected student's name in the trigger */}
                        <SelectValue placeholder="Choose a student to view their rental history..." >
                            {selectedStudent ? `${selectedStudent?.student_name} ` : "Choose a student..."}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                                {student?.student_name})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Student Info and Stats */}
            {selectedStudent && (
                <>
                    

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <BookOpen className="h-5 w-5 text-blue-500" />
                                    Total Books Rented
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{booksRented}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total rentals on record
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="h-5 w-5 text-purple-500" />
                                    Active Rentals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{activeRentals.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Currently checked out</p>
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
                                <div className="text-3xl font-bold">${totalCharges.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">All-time rental fees</p>
                            </CardContent>
                        </Card>
                    </div>

                    <hr />

                    {/* Rental History */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold">Rental History</h2>
                        {error && <div className="text-red-500">Error: {error}</div>}
                        {isLoading ? (
                            <Card>
                                <CardContent className="py-12 text-center text-primary font-medium">
                                    <User className="animate-bounce inline mr-2 h-5 w-5" /> Loading rentals...
                                </CardContent>
                            </Card>
                        ) : rentals.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    No rentals found for **{selectedStudent.name}**.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {rentals.map((rental) => (
                                    <Card key={rental.id} className="shadow-sm hover:shadow-lg transition-shadow">
                                        <CardContent className="p-4 md:p-6">
                                            <div className="flex gap-4 items-center">
                                                {/* Book Cover */}
                                                <div className="flex-shrink-0">
                                                    {rental.book.cover_url ? (
                                                        <ImageWithFallback
                                                            src={rental.book.cover_url}
                                                            alt={rental.book.title}
                                                            className="w-16 h-24 object-cover rounded shadow"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-24 bg-muted rounded flex items-center justify-center shadow">
                                                            <BookOpen className="h-7 w-7 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-lg font-semibold truncate">{rental.book.title}</h4>
                                                            <p className="text-sm text-muted-foreground truncate">by {rental.book.author}</p>
                                                        </div>
                                                        <Badge
                                                            variant={rental.status === 'active' ? 'default' : 'secondary'}
                                                            className='flex-shrink-0'
                                                        >
                                                            {rental.status === 'active' ? 'Active' : 'Returned'}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t pt-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase">Start Date</p>
                                                            <p className="text-sm font-medium">{formatDate(rental.start_date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase">
                                                                {rental.status === 'active' ? 'Due Date' : 'Returned'}
                                                            </p>
                                                            <p className="text-sm font-medium">
                                                                {rental.status === 'active' ? formatDate(rental.free_month_ends) : formatDate(rental.end_date)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase">Monthly Fee</p>
                                                            <p className="text-sm font-medium">{rental.monthly_fee}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase">Total Charged</p>
                                                            <p className="text-sm font-medium text-green-600">{rental.total_fee}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Initial Prompt */}
            {!selectedStudent && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Select a student from the dropdown above to view their rental history and charges.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}