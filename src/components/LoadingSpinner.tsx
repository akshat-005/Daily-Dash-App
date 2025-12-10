import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'size-4',
        md: 'size-8',
        lg: 'size-12',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-4 border-surface-border border-t-primary rounded-full animate-spin`}
            />
        </div>
    );
};

export default LoadingSpinner;
