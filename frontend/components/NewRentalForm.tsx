import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  BookOpen,
  User,
  X,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "@radix-ui/react-label";
import { Card } from "./ui/card";
import { CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert } from "./ui/alert";

interface Student {
  id: number;
  student_name: string;
  email: string;
  stu_id: string;
}

interface Book {
  title: string;
  author: string;
  pages: number;
  coverUrl: string | null;
  olid: string;
  firstPublishYear?: number;
}

interface NewRentalFormProps {
  onRentalCreated?: () => void;
  onStudentAdded?: () => void;
}

export function NewRentalForm({
  onRentalCreated,
  onStudentAdded,
}: NewRentalFormProps) {
  const [open, setOpen] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [bookSearch, setBookSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  // Fetch students
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      console.log("✅ Fetched students:", data);
      setStudents(data.results || data || []);
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      setError("Failed to load students. Please refresh.");
    }
  };

  useEffect(() => {
    if (open) {
      fetchStudents();
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  // Add new student
  const addStudent = async () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      setError("⚠️ Please enter both name and email.");
      return;
    }

    setAddingStudent(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/students/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_name: newStudentName,
          email: newStudentEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add student");
      }

      console.log("✅ Student added successfully:", data);
      setSuccess(`🎓 Student "${newStudentName}" added successfully!`);
      setNewStudentName("");
      setNewStudentEmail("");
      setShowAddStudent(false);
      await fetchStudents();
      onStudentAdded?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("❌ Error adding student:", error);
      setError(error.message || "❌ Failed to add student.");
    } finally {
      setAddingStudent(false);
    }
  };

  // Search books
  const searchBooks = async () => {
    if (!bookSearch.trim()) return;
    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/books/search/?title=${encodeURIComponent(bookSearch)}`
      );

      if (!res.ok) throw new Error("Failed to search books");

      const data = await res.json();
      console.log("✅ Book search results:", data);

      if (!data.results || data.results.length === 0) {
        setError("No books found. Try a different search term.");
      }

      setSearchResults(data.results || data || []);
    } catch (error) {
      console.error("❌ Error searching books:", error);
      setError("❌ Error searching books. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Create rental - Updated to call backend API
  const createRental = async () => {
    if (!selectedStudent || !selectedBook) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/rentals/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          title: selectedBook.title,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create rental");
      }

      console.log("✅ Rental created:", data);

      setSuccess(
        `✅ Rental Created Successfully!\n\nStudent: ${selectedStudent.student_name}\nBook: ${selectedBook.title}\n\n🎉 First month is FREE!\nThen $${monthlyFee}/month`
      );

      // Reset form
      setTimeout(() => {
        setSelectedStudent(null);
        setSelectedBook(null);
        setBookSearch("");
        setSearchResults([]);
        setSuccess(null);
        setOpen(false);
        onRentalCreated?.();
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error creating rental:", error);
      setError(
        error.message || "❌ Failed to create rental. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const monthlyFee = selectedBook
    ? (selectedBook.pages / 100).toFixed(2)
    : "0.00";

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg"
      >
        <Plus className="h-5 w-5" />
        New Rental
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 px-6 py-5 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-7 w-7" />
                Create New Book Rental
              </h2>
              <p className="text-purple-100 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">🎉 First month FREE</span>
                <span className="mx-1">·</span>
                Then ${monthlyFee}/month based on page count
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Success/Error Messages */}
          {error && (
            <Alert variant="destructive" className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="flex items-start gap-3 border-green-600 bg-green-50 text-green-800"
            >
              <div className="p-1 bg-green-600 rounded-full">
                <svg
                  className="h-4 w-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 whitespace-pre-line">{success}</div>
            </Alert>
          )}

          {/* Student Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 rounded-xl shadow-sm border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <Label className="text-lg font-bold text-slate-900">
                Select Student
              </Label>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  className="w-full h-12 px-4 bg-white border-2 border-purple-300 hover:border-purple-400 rounded-lg flex items-center justify-between transition-colors shadow-sm"
                >
                  <span
                    className={
                      selectedStudent
                        ? "text-slate-900 font-medium"
                        : "text-slate-500"
                    }
                  >
                    {selectedStudent
                      ? `${
                          selectedStudent.student_name
                        } • ${selectedStudent.stu_id.slice(0, 8)}`
                      : "Choose a student..."}
                  </span>
                  <svg
                    className={`h-5 w-5 text-slate-500 transition-transform ${
                      showStudentDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showStudentDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-purple-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {students.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        No students found
                      </div>
                    ) : (
                      students.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowStudentDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                        >
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {student.student_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {student.email}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowAddStudent(!showAddStudent)}
                className="h-12 gap-2 px-6 border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>

            {selectedStudent && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {selectedStudent.student_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedStudent.email}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ID: {selectedStudent.stu_id.slice(0, 13)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                  className="h-8 w-8 p-0 hover:bg-purple-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Add Student Form */}
          {showAddStudent && (
            <Card className="border-2 border-purple-300 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="space-y-4">
                <h4 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                  <div className="p-1.5 bg-purple-600 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  Add New Student
                </h4>
                <div className="space-y-2">
                  <Label className="font-semibold">Student Name</Label>
                  <Input
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="John Doe"
                    className="border-2 focus:border-purple-400 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Email Address</Label>
                  <Input
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="john@university.edu"
                    className="border-2 focus:border-purple-400 bg-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={addStudent}
                    disabled={addingStudent}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md"
                  >
                    {addingStudent ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddStudent(false)}
                    className="h-12 px-6 border-2"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Search */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl shadow-sm border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <Label className="text-lg font-bold text-slate-900">
                Search for Book
              </Label>
            </div>
            <div className="flex gap-3">
              <Input
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                placeholder="Enter book title..."
                className="h-12 border-2 border-blue-300 hover:border-blue-400 focus:border-blue-400 bg-white shadow-sm"
              />
              <Button
                onClick={searchBooks}
                disabled={isSearching}
                className="h-12 px-8 gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {/* Selected Book */}
          {selectedBook && (
            <Card className="border-2 border-green-400 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent>
                <div className="flex items-start gap-2 mb-4">
                  <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                    ✓ Selected Book
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBook(null);
                      setSearchResults([]);
                    }}
                    className="ml-auto h-8 w-8 p-0 hover:bg-green-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-5">
                  {selectedBook.coverUrl ? (
                    <img
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      className="w-32 h-44 object-cover rounded-lg shadow-lg border-2 border-white"
                    />
                  ) : (
                    <div className="w-32 h-44 bg-white rounded-lg flex items-center justify-center shadow-lg border-2">
                      <BookOpen className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-2 text-slate-900">
                      {selectedBook.title}
                    </h4>
                    <p className="text-slate-700 mb-4 font-medium">
                      by {selectedBook.author}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-sm px-3 py-1.5 font-semibold"
                      >
                        📖 {selectedBook.pages} pages
                      </Badge>
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm px-3 py-1.5 font-semibold">
                        <DollarSign className="h-3.5 w-3.5 inline" />
                        {monthlyFee}/month (after free month)
                      </Badge>
                      {selectedBook.firstPublishYear && (
                        <Badge
                          variant="outline"
                          className="text-sm px-3 py-1.5 font-semibold"
                        >
                          📅 {selectedBook.firstPublishYear}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && !selectedBook && (
            <div className="space-y-3">
              <Label className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Search Results ({searchResults.length})
              </Label>
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {searchResults.map((book, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 border-2 hover:scale-[1.01]"
                    onClick={() => setSelectedBook(book)}
                  >
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-20 h-28 object-cover rounded-lg shadow-md border border-slate-200"
                          />
                        ) : (
                          <div className="w-20 h-28 bg-slate-100 rounded-lg flex items-center justify-center shadow-md border border-slate-200">
                            <BookOpen className="h-8 w-8 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-lg mb-1 text-slate-900">
                            {book.title}
                          </h5>
                          <p className="text-slate-600 text-sm mb-3 font-medium">
                            {book.author}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-1"
                            >
                              {book.pages} pages
                            </Badge>
                            {book.firstPublishYear && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-1"
                              >
                                {book.firstPublishYear}
                              </Badge>
                            )}
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1 font-semibold">
                              ${(book.pages / 100).toFixed(2)}/mo
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create Rental Button */}
          <div className="pt-4 border-t-2 border-slate-200">
            <Button
              onClick={createRental}
              disabled={!selectedStudent || !selectedBook || isCreating}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400"
              size="lg"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Rental...
                </span>
              ) : (
                <>
                  <Plus className="h-6 w-6 mr-2" />
                  Create Rental
                  {selectedBook && selectedStudent && (
                    <span className="ml-2 text-sm font-normal opacity-90">
                      (${monthlyFee}/month after free period)
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
