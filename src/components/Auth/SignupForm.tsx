import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SignupFormProps {
    onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await signUp(email, password, fullName);

        if (error) {
            toast.error(error.message || 'Failed to sign up');
            setLoading(false);
        } else {
            toast.success('Account created! Please check your email to verify.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                    Full Name
                </label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="John Doe"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="your@email.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                />
                <p className="text-xs text-[#9db9a8] mt-1">
                    Must be at least 6 characters
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-black font-bold text-base hover:brightness-110 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p className="text-center text-sm text-[#9db9a8]">
                Already have an account?{' '}
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-primary hover:underline font-medium"
                >
                    Sign in
                </button>
            </p>
        </form>
    );
};

export default SignupForm;
