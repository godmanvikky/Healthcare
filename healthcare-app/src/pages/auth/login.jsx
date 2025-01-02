import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(''); // Clear error on typing
  };

  // ✅ Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear any previous error

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Login($email: String!, $password: String!) {
              login(email: $email, password: $password) {
                token
                user {
                  id
                  name
                  role
                }
              }
            }
          `,
          variables: {
            email: formData.email,
            password: formData.password,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result?.data?.login?.token) {
        // ✅ Store Token in Local Storage
        localStorage.setItem('token', result.data.login.token);
        localStorage.setItem('userRole', result.data.login.user.role);

        setIsLoading(false);

        // ✅ Redirect Based on Role
        if (result.data.login.user.role === 'Patient') {
          router.push('/dashboard/patient');
        } else if (result.data.login.user.role === 'Doctor') {
          router.push('/dashboard/doctor');
        }
      } else {
        throw new Error(
          result.errors?.[0]?.message || 'Invalid Email or Password'
        );
      }
    } catch (error) {
      console.error('❌ Login Error:', error.message);
      setError(error.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Login to Your Account</h2>

        {/* ✅ Error Message */}
        {error && (
          <p className="text-center text-red-500 font-medium mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`w-full px-4 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-400 outline-none`}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full px-4 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-400 outline-none`}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-2 rounded-lg text-white font-medium ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-all duration-300`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Redirect to Register */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <a href="/auth/register" className="text-blue-500 hover:underline">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
