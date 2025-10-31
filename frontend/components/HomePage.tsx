import { useState, useEffect } from 'react';
import { BookOpen, LayoutDashboard, Users, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { NewRentalForm } from '../components/NewRentalForm';
import { RentalsManager } from '../components/RentalsManager';
import { StudentDashboard } from '../components/StudentDashboard';
import { Analytics } from '../components/Analytics';
import { Recommendations } from '../components/Recommendations';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
}

interface Rental {
  id: string;
  userId: string;
  bookId: string;
  startDate: string;
  freeEndDate: string;
  currentEndDate: string;
  status: string;
  monthlyFee: number;
  totalCharges: number;
  extendedMonths: number;
  book: {
    title: string;
    author: string;
    pages: number;
    coverUrl: string | null;
  };
  user: {
    name: string;
    studentId: string;
    email: string;
  };
}

const HomePage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rentals');

  // Load demo data for now (can replace with backend later)
  const loadDemoData = () => {
    const demoStudents: Student[] = [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com', studentId: 'STU001' },
      { id: '2', name: 'Bob Singh', email: 'bob@example.com', studentId: 'STU002' },
      { id: '3', name: 'Charlie Rao', email: 'charlie@example.com', studentId: 'STU003' },
    ];

    const demoRentals: Rental[] = [
      {
        id: 'R1',
        userId: '1',
        bookId: 'B1',
        startDate: '2025-09-10',
        freeEndDate: '2025-10-10',
        currentEndDate: '2025-10-30',
        status: 'Active',
        monthlyFee: 120,
        totalCharges: 240,
        extendedMonths: 1,
        book: {
          title: 'Python for Beginners',
          author: 'John Doe',
          pages: 320,
          coverUrl: 'https://covers.openlibrary.org/b/id/10523300-L.jpg',
        },
        user: {
          name: 'Alice Johnson',
          studentId: 'STU001',
          email: 'alice@example.com',
        },
      },
      {
        id: 'R2',
        userId: '2',
        bookId: 'B2',
        startDate: '2025-08-01',
        freeEndDate: '2025-09-01',
        currentEndDate: '2025-09-28',
        status: 'Completed',
        monthlyFee: 100,
        totalCharges: 200,
        extendedMonths: 1,
        book: {
          title: 'Learning JavaScript',
          author: 'Jane Smith',
          pages: 280,
          coverUrl: 'https://covers.openlibrary.org/b/id/9876543-L.jpg',
        },
        user: {
          name: 'Bob Singh',
          studentId: 'STU002',
          email: 'bob@example.com',
        },
      },
    ];

    setStudents(demoStudents);
    setRentals(demoRentals);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDemoData();
  }, []);

  const handleRefresh = () => {
    loadDemoData(); // Refresh just reloads demo data
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1661700738915-9dac561e21d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg"
            alt="Library"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
        </div>
        
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl mb-2">Rewardz Book Rentals</h1>
                <p className="text-white/90 text-lg">
                  Student Library Management System
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="secondary"
              size="lg"
              className="gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-white/20"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Rentals</p>
                  <p className="text-2xl">{rentals.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Students</p>
                  <p className="text-2xl">{students.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Free Month Policy</p>
                  <p className="text-lg">1st month free!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between gap-4">
            <TabsList className="bg-white shadow-sm border h-auto p-1.5">
              <TabsTrigger value="rentals" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <LayoutDashboard className="h-4 w-4" />
                Manage Rentals
              </TabsTrigger>
              <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="h-4 w-4" />
                Student History
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Sparkles className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            {activeTab === 'rentals' && (
              <NewRentalForm
                students={students}
                onRentalCreated={handleRefresh}
                onStudentAdded={handleRefresh}
              />
            )}
          </div>

          {/* Tab Content */}
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Loading demo data...
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="rentals" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <RentalsManager rentals={rentals} onRentalUpdated={handleRefresh} />
                </div>
              </TabsContent>

              <TabsContent value="students" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <StudentDashboard students={students} />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <Analytics />
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <Recommendations students={students} />
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="mb-1">Rewardz Technical Exercise</h4>
              <p className="text-sm text-muted-foreground">
                Book Rental Management System with OpenLibrary Integration
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">✓ OpenLibrary API</div>
              <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">✓ Free Month Policy</div>
              <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">✓ Analytics & Reporting</div>
              <div className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs">✓ Recommendations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;