import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery } from '@apollo/client';

// ✅ GraphQL Query for Specializations
const GET_SPECIALIZATIONS = gql`
  query GetSpecializations {
    getSpecializations {
      id
      name
    }
  }
`;

export default function Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Patient',
    specialization: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ Fetch Specializations
  const {
    data: specializationData,
    loading: specializationLoading,
    error: specializationError,
  } = useQuery(GET_SPECIALIZATIONS);

  // ✅ Real-Time Validation
  const validate = (name, value) => {
    switch (name) {
      case 'name':
        return value.length >= 3 ? '' : 'Name must be at least 3 characters long';
      case 'email':
        return /^\S+@\S+\.\S+$/.test(value) ? '' : 'Invalid email format';
      case 'password':
        return value.length >= 6 ? '' : 'Password must be at least 6 characters long';
      case 'specialization':
        return value.trim() ? '' : 'Specialization is required for doctors';
      default:
        return '';
    }
  };

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: validate(name, value) });
  };

  // ✅ Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🛠️ Form Submission Initiated');

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({});

    // Validate fields
    const newErrors = {
      name: validate('name', formData.name),
      email: validate('email', formData.email),
      password: validate('password', formData.password),
    };

    if (formData.role === 'Doctor') {
      newErrors.specialization = validate('specialization', formData.specialization);
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      console.warn('⚠️ Validation Errors Detected:', newErrors);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔗 Sending GraphQL Mutation...');
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API || '/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Register(
              $name: String!,
              $email: String!,
              $password: String!,
              $role: String!,
              $specialization: String
            ) {
              register(
                name: $name,
                email: $email,
                password: $password,
                role: $role,
                specialization: $specialization
              ) {
                message
                user {
                  id
                  name
                  email
                  role
                  specialization
                }
              }
            }
          `,
          variables: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            specialization: formData.role === 'Doctor' ? formData.specialization : null,
          },
        }),
      });

      const result = await response.json();
      console.log('📥 GraphQL Response:', result);

      if (response.ok && result?.data?.register) {
        setIsLoading(false);
        setSuccessMessage(result.data.register.message || '✅ Registration Successful! Redirecting to login...');

        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        throw new Error(result.errors?.[0]?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      setErrors({ form: error.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Create Your Account</h2>

        {/* ✅ Success Message */}
        {successMessage && (
          <p className="text-center text-green-500 font-medium mb-4">{successMessage}</p>
        )}

        {/* ✅ Form Error */}
        {errors.form && (
          <p className="text-center text-red-500 font-medium mb-4">{errors.form}</p>
        )}

        {/* ✅ Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          {/* Role */}
          <div>
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
            >
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
            </select>
          </div>

          {/* Specialization */}
          {formData.role === 'Doctor' && (
            <div>
              <label>Specialization</label>
              {specializationLoading ? (
                <p>🔄 Loading specializations...</p>
              ) : (
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2"
                >
                  <option value="">-- Select Specialization --</option>
                  {specializationData?.getSpecializations?.map((spec) => (
                    <option key={spec.id} value={spec.name}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
