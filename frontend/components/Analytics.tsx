import { useState, useEffect } from 'react';
import {
  TrendingUp,
  BookOpen,
  Users,
  DollarSign,
  Award,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Demo interface
interface Analytics {
  totalRentals: number;
  activeRentals: number;
  totalRevenue: number;
  totalStudents: number;
  totalBooks: number;
  topBooks: Array<{
    id: string;
    title: string;
    author: string;
    pages: number;
    coverUrl: string | null;
    rentalCount: number;
  }>;
  revenueByMonth: Record<string, number>;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load mock analytics data
  useEffect(() => {
    setIsLoading(true);

    // Mock API delay
    setTimeout(() => {
      setAnalytics({
        totalRentals: 240,
        activeRentals: 65,
        totalRevenue: 3250.75,
        totalStudents: 85,
        totalBooks: 120,

        topBooks: [
          {
            id: '1',
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            pages: 218,
            coverUrl:
              'https://images.unsplash.com/photo-1544933281-7f44c7e0c437?auto=format&fit=crop&w=400&q=80',
            rentalCount: 32,
          },
          {
            id: '2',
            title: 'Atomic Habits',
            author: 'James Clear',
            pages: 320,
            coverUrl:
              'https://images.unsplash.com/photo-1553729784-e91953dec042?auto=format&fit=crop&w=400&q=80',
            rentalCount: 28,
          },
          {
            id: '3',
            title: '1984',
            author: 'George Orwell',
            pages: 328,
            coverUrl:
              'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80',
            rentalCount: 26,
          },
        ],

        revenueByMonth: {
          '2025-01': 450.0,
          '2025-02': 530.0,
          '2025-03': 580.25,
          '2025-04': 620.75,
          '2025-05': 710.5,
          '2025-06': 640.3,
        },
      });

      setIsLoading(false);
    }, 1200);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading analytics...
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load analytics
        </CardContent>
      </Card>
    );
  }

  const revenueEntries = Object.entries(analytics.revenueByMonth).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2>Analytics & Insights</h2>
          <p className="text-muted-foreground">
            Overview of rental statistics and performance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Total Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1">{analytics.totalRentals}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeRentals} currently active
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1">${analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all rentals</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-purple-500" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1">{analytics.totalBooks}</div>
            <p className="text-xs text-muted-foreground">In library</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Books */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Most Popular Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topBooks.map((book, index) => (
            <div
              key={book.id}
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <span className="font-semibold text-primary">#{index + 1}</span>
              </div>
              {book.coverUrl ? (
                <ImageWithFallback
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h5 className="truncate mb-1">{book.title}</h5>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-lg">
                  {book.rentalCount}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  rental{book.rentalCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Revenue by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Revenue by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueEntries.map(([month, revenue]) => {
            const maxRevenue = Math.max(...Object.values(analytics.revenueByMonth));
            const percentage = (revenue / maxRevenue) * 100;

            return (
              <div key={month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                  <span className="font-medium">${revenue.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Average revenue per rental:{' '}
            <span className="font-semibold">
              ${(analytics.totalRevenue / analytics.totalRentals).toFixed(2)}
            </span>
          </p>
          <p className="text-sm">
            Books per student:{' '}
            <span className="font-semibold">
              {(analytics.totalRentals / analytics.totalStudents).toFixed(1)}
            </span>
          </p>
          <p className="text-sm">
            Active rental rate:{' '}
            <span className="font-semibold">
              {Math.round((analytics.activeRentals / analytics.totalRentals) * 100)}%
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
