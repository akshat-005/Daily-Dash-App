import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="size-12 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px]">dashboard</span>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">
                        Daily<span className="text-primary">Dash</span>
                    </h1>
                </div>

                {/* Auth Card */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl p-8 shadow-card">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-[#9db9a8] text-center mb-8">
                        {isLogin
                            ? 'Sign in to continue building momentum'
                            : 'Start tracking your productivity today'}
                    </p>

                    {isLogin ? (
                        <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
                    ) : (
                        <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-[#9db9a8] mt-6">
                    Build momentum. Track progress. Achieve goals.
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
