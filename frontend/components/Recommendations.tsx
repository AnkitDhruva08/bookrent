import { useState, useEffect } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// --- Demo Data ---
const demoStudents = [
  { id: "1", name: "Ankit Mishra", studentId: "STU101" },
  { id: "2", name: "Riya Sharma", studentId: "STU102" },
  { id: "3", name: "Aarav Patel", studentId: "STU103" },
];

const demoRecommendations: Record<string, any[]> = {
  "1": [
    {
      id: "b1",
      title: "Python for Beginners",
      author: "John Doe",
      pages: 320,
      coverUrl:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    },
    {
      id: "b2",
      title: "Machine Learning 101",
      author: "Andrew Ng",
      pages: 480,
      coverUrl:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    },
  ],
  "2": [
    {
      id: "b3",
      title: "React in Action",
      author: "Mark Tielens Thomas",
      pages: 360,
      coverUrl:
        "https://images.unsplash.com/photo-1523473827532-86c81d7b6a79?w=400",
    },
  ],
  "3": [
    {
      id: "b4",
      title: "Django for Professionals",
      author: "William S. Vincent",
      pages: 280,
      coverUrl:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400",
    },
    {
      id: "b5",
      title: "Clean Code",
      author: "Robert C. Martin",
      pages: 464,
      coverUrl:
        "https://images.unsplash.com/photo-1553729784-e91953dec042?w=400",
    },
  ],
};

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  pages: number;
  coverUrl: string | null;
}

export function Recommendations() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedStudentId) {
      setIsLoading(true);
      setTimeout(() => {
        setRecommendations(demoRecommendations[selectedStudentId] || []);
        setIsLoading(false);
      }, 800); // simulate network delay
    }
  }, [selectedStudentId]);

  const selectedStudent = demoStudents.find(
    (s) => s.id === selectedStudentId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Book Recommendations</h2>
          <p className="text-muted-foreground">
            Personalized suggestions based on rental history
          </p>
        </div>
      </div>

      {/* Student Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Student</label>
        <Select
          value={selectedStudentId}
          onValueChange={setSelectedStudentId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a student..." />
          </SelectTrigger>
          <SelectContent>
            {demoStudents.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name} ({student.studentId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations */}
      {selectedStudent && (
        <>
          <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-lg">
                Recommendations for {selectedStudent.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                These books are available and haven't been rented by this
                student yet.
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading recommendations...
              </CardContent>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No new recommendations available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((book) => {
                const monthlyFee = (book.pages / 100).toFixed(2);
                return (
                  <Card
                    key={book.id}
                    className="hover:shadow-lg transition-shadow overflow-hidden group"
                  >
                    <div className="relative">
                      {book.coverUrl ? (
                        <ImageWithFallback
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-gray-900">
                          ${monthlyFee}/mo
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <h4 className="mb-2 line-clamp-2 min-h-[3rem]">
                        {book.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {book.author}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {book.pages} pages
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          1st month free
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {!selectedStudent && (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2 text-lg font-medium">Discover New Books</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a student above to see personalized book
              recommendations based on their reading history.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
