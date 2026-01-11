import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import toast from 'react-hot-toast';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            // Update user metadata
            const { error } = await supabase.auth.updateUser({
                data: { name }
            });

            if (error) throw error;

            toast.success('Profile updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-dark border border-surface-border rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">settings</span>
                        <h2 className="text-lg font-bold text-white">Account Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-[#111814] flex items-center justify-center hover:bg-[#2d4a38] transition-colors"
                    >
                        <span className="material-symbols-outlined text-white/60">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Email Field (Read-only) */}
                    <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-2.5 text-white/50 cursor-not-allowed"
                        />
                        <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-surface-border">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-[#111814] text-white font-medium hover:bg-[#2d4a38] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserSettingsModal;
