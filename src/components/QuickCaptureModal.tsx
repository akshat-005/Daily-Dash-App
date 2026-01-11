import React, { useState, useEffect } from 'react';
import { CreateRevisitInput, RevisitType, EstimatedTime, RevisitItem } from '../../types';
import { getPresetDates } from '../utils/spacedRepetition';
import { formatDate } from '../utils/dateUtils';

interface QuickCaptureModalProps {
    isOpen: boolean;
    userId: string;
    editItem?: RevisitItem | null; // For editing/rescheduling existing item
    onSave: (input: CreateRevisitInput) => Promise<void>;
    onReschedule?: (id: string, nextReviewAt: string) => Promise<void>; // For rescheduling
    onClose: () => void;
}

const REVISIT_TYPES: { value: RevisitType; label: string; icon: string }[] = [
    { value: 'tech', label: 'Tech', icon: '💻' },
    { value: 'leetcode', label: 'LeetCode', icon: '🧩' },
    { value: 'math', label: 'Math', icon: '📐' },
    { value: 'college', label: 'College', icon: '🎓' },
    { value: 'book', label: 'Book', icon: '📚' },
    { value: 'misc', label: 'Misc', icon: '📌' },
];

const TIME_OPTIONS: EstimatedTime[] = [5, 15, 30, 60];

const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
    isOpen,
    userId,
    editItem,
    onSave,
    onReschedule,
    onClose,
}) => {
    const [title, setTitle] = useState('');
    const [resourceUrl, setResourceUrl] = useState('');
    const [reasonToReturn, setReasonToReturn] = useState('');
    const [type, setType] = useState<RevisitType>('misc');
    const [estimatedTime, setEstimatedTime] = useState<EstimatedTime>(15);
    const [selectedPreset, setSelectedPreset] = useState<number | null>(7); // Default to 1 week
    const [customDate, setCustomDate] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [saving, setSaving] = useState(false);

    const isRescheduling = !!editItem;

    // Pre-fill form when editing
    useEffect(() => {
        if (editItem) {
            setTitle(editItem.title);
            setResourceUrl(editItem.resource_url || '');
            setReasonToReturn(editItem.reason_to_return || '');
            setType(editItem.type || 'misc');
            setEstimatedTime(editItem.estimated_time_min || 15);
            setSelectedPreset(7); // Default to 1 week for reschedule
        }
    }, [editItem]);

    const presets = getPresetDates();

    const handleSave = async () => {
        if (!title.trim()) return;

        setSaving(true);
        try {
            let nextReviewAt: string;

            if (selectedPreset !== null) {
                const preset = presets.find(p => p.days === selectedPreset);
                nextReviewAt = preset ? formatDate(preset.date) : formatDate(new Date());
            } else if (customDate) {
                nextReviewAt = customDate;
            } else {
                nextReviewAt = formatDate(presets[2].date); // Default to 1 week
            }

            if (isRescheduling && editItem && onReschedule) {
                // Rescheduling existing item
                await onReschedule(editItem.id, nextReviewAt);
            } else {
                // Creating new item
                await onSave({
                    user_id: userId,
                    title: title.trim(),
                    type,
                    resource_url: resourceUrl.trim() || undefined,
                    reason_to_return: reasonToReturn.trim() || undefined,
                    estimated_time_min: estimatedTime,
                    next_review_at: nextReviewAt,
                });
            }

            // Reset form
            setTitle('');
            setResourceUrl('');
            setReasonToReturn('');
            setType('misc');
            setEstimatedTime(15);
            setSelectedPreset(7);
            setCustomDate('');
            setShowAdvanced(false);
            onClose();
        } catch (error) {
            console.error('Failed to save revisit:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2d4a38]">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{isRescheduling ? '🔄' : '📌'}</span>
                        <h2 className="text-lg font-bold text-white">
                            {isRescheduling ? 'Reschedule Revisit' : 'Quick Capture'}
                        </h2>
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
                    {/* Title - Most Important */}
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What do you want to revisit?"
                            className="w-full bg-[#111814] border border-[#2d4a38] rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary text-base"
                            autoFocus
                        />
                    </div>

                    {/* Resource URL - Optional */}
                    <div>
                        <input
                            type="url"
                            value={resourceUrl}
                            onChange={(e) => setResourceUrl(e.target.value)}
                            placeholder="Link (YouTube, blog, GitHub...)"
                            className="w-full bg-[#111814] border border-[#2d4a38] rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-primary text-sm"
                        />
                    </div>

                    {/* Reason to Return - Encouraged */}
                    <div>
                        <input
                            type="text"
                            value={reasonToReturn}
                            onChange={(e) => setReasonToReturn(e.target.value)}
                            placeholder="Why are you saving this? (helps you remember)"
                            className="w-full bg-[#111814] border border-[#2d4a38] rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-primary text-sm"
                        />
                    </div>

                    {/* When to Revisit - Presets */}
                    <div>
                        <label className="text-white/60 text-xs font-medium mb-2 block">
                            When to revisit?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.days}
                                    onClick={() => {
                                        setSelectedPreset(preset.days);
                                        setCustomDate('');
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPreset === preset.days
                                        ? 'bg-primary text-black'
                                        : 'bg-[#111814] text-white/70 hover:bg-[#2d4a38]'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setSelectedPreset(null);
                                    setShowAdvanced(true);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPreset === null
                                    ? 'bg-primary text-black'
                                    : 'bg-[#111814] text-white/70 hover:bg-[#2d4a38]'
                                    }`}
                            >
                                Custom
                            </button>
                        </div>

                        {/* Custom Date Picker */}
                        {selectedPreset === null && (
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                min={formatDate(new Date())}
                                className="mt-2 w-full bg-[#111814] border border-[#2d4a38] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary text-sm"
                            />
                        )}
                    </div>

                    {/* Advanced Options Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-white/50 text-xs flex items-center gap-1 hover:text-white/70 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            {showAdvanced ? 'expand_less' : 'expand_more'}
                        </span>
                        {showAdvanced ? 'Hide options' : 'More options'}
                    </button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-4 pt-2 border-t border-[#2d4a38]">
                            {/* Type Selection */}
                            <div>
                                <label className="text-white/60 text-xs font-medium mb-2 block">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {REVISIT_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setType(t.value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${type === t.value
                                                ? 'bg-primary text-black'
                                                : 'bg-[#111814] text-white/70 hover:bg-[#2d4a38]'
                                                }`}
                                        >
                                            <span>{t.icon}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Estimate */}
                            <div>
                                <label className="text-white/60 text-xs font-medium mb-2 block">
                                    Estimated time
                                </label>
                                <div className="flex gap-2">
                                    {TIME_OPTIONS.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setEstimatedTime(time)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${estimatedTime === time
                                                ? 'bg-primary text-black'
                                                : 'bg-[#111814] text-white/70 hover:bg-[#2d4a38]'
                                                }`}
                                        >
                                            {time < 60 ? `${time} min` : '1 hour'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-[#2d4a38]">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-[#111814] text-white font-medium hover:bg-[#2d4a38] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || saving}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                {isRescheduling ? 'Scheduling...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">
                                    {isRescheduling ? 'event' : 'add'}
                                </span>
                                {isRescheduling ? 'Schedule' : 'Save'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickCaptureModal;
