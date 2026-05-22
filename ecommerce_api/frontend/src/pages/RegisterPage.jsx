import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', phone: '',
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      // Auto-login after registration
      await login(form.email, form.password);
      toast.success('Account created! Welcome to ShopAPI 🎉');
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') setErrors(data);
      else toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, type = 'text', placeholder, required = false }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}{required && ' *'}</label>
      <input type={type} required={required} className={`input ${errors[name] ? 'border-red-400' : ''}`}
        placeholder={placeholder} value={form[name]} onChange={update(name)} />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name][0] || errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-2xl">
            <Package size={28} /> ShopAPI
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Start shopping in seconds</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field name="first_name" label="First Name" placeholder="Ravi" />
              <Field name="last_name" label="Last Name" placeholder="Kumar" />
            </div>
            <Field name="username" label="Username" placeholder="ravikumar" required />
            <Field name="email" label="Email" type="email" placeholder="ravi@example.com" required />
            <Field name="phone" label="Phone" placeholder="+91 98765 43210" />
            <Field name="password" label="Password" type="password" placeholder="Min 8 characters" required />
            <Field name="password2" label="Confirm Password" type="password" placeholder="Repeat password" required />

            {errors.non_field_errors && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.non_field_errors[0]}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
