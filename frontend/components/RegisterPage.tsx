import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, BookOpen } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  const validateName = (name: string) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (touched[field as keyof typeof touched]) {
      let error = '';
      if (field === 'name') error = validateName(value);
      else if (field === 'email') error = validateEmail(value);
      else if (field === 'password') {
        error = validatePassword(value);
        if (formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
          }));
        }
      }
      else if (field === 'confirmPassword') error = validateConfirmPassword(value, formData.password);

      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };


// function for handling form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setTouched({
    name: true,
    email: true,
    password: true,
    confirmPassword: true,
  });

  const newErrors = {
    name: validateName(formData.name),
    email: validateEmail(formData.email),
    password: validatePassword(formData.password),
    confirmPassword: validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    ),
  };

  setErrors(newErrors);

  // ✅ Only submit if no validation errors
  if (Object.values(newErrors).every((error) => error === "")) {
    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      console.log("✅ Registration successful:", data);

      // ✅ Store JWT tokens in localStorage
      if (data.tokens && data.tokens.access) {
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
      }

      setIsSuccess(true);
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("❌ Registration error:", error.message);
      alert(error.message || "Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  }
};



  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Registration Successful!
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Welcome aboard, {formData.name}! Your account has been created successfully.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => alert('Redirecting to login...')}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
            >
              Go to Login
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                setTouched({ name: false, email: false, password: false, confirmPassword: false });
              }}
              className="w-full h-12 border-2 border-slate-300 dark:border-slate-600 hover:border-purple-400 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all duration-200"
            >
              Register Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 to-blue-700 p-12 flex-col justify-center items-center text-white">
          <div className="mb-8">
            <BookOpen className="h-20 w-20 mb-6" />
            <h2 className="text-4xl font-bold mb-4">Rewardz Book Rentals</h2>
            <p className="text-purple-100 text-lg">
              Join our community of readers and access thousands of books with our student-friendly rental system.
            </p>
          </div>
          <div className="space-y-4 w-full">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">First Month Free</h3>
                <p className="text-sm text-purple-100">No charges for the first month on all rentals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Flexible Rental Plans</h3>
                <p className="text-sm text-purple-100">Pay based on page count after free period</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Vast Library</h3>
                <p className="text-sm text-purple-100">Access to millions of books from OpenLibrary</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Register to start renting books today
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full h-12 px-4 pr-10 border-2 rounded-lg transition-all outline-none ${
                    errors.name && touched.name
                      ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950'
                      : formData.name && !errors.name
                  }`}
                />
                {touched.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.name ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : formData.name ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.name && touched.name && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@university.edu"
                  className={`w-full h-12 px-4 pr-10 border-2 rounded-lg transition-all outline-none ${
                    errors.email && touched.email
                      ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950'
                      : formData.email && !errors.email
                  }`}
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {errors.email ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : formData.email ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.email && touched.email && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter your password"
                     className={`w-full h-12 px-4 pr-10 border-2 rounded-lg transition-all outline-none ${
                    errors.password && touched.password
                      ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950'
                      : formData.password && !errors.password
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full transition-all ${
                          index < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Password strength: <span className="font-semibold">{strengthLabels[passwordStrength - 1] || 'Weak'}</span>
                  </p>
                </div>
              )}

              {errors.password && touched.password && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                     className={`w-full h-12 px-4 pr-10 border-2 rounded-lg transition-all outline-none ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950'
                      : formData.confirmPassword && !errors.confirmPassword
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && !errors.confirmPassword && touched.confirmPassword && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Passwords match!
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button onClick={() => alert('Navigate to login')} className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;