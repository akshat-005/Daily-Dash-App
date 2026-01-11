import React, { useState, useRef } from 'react';
import { RevisitItem, DifficultyRating } from '../../types';
import { getRevisitTypeIcon, formatEstimatedTime } from '../utils/spacedRepetition';
import { useClickOutside } from '../utils/useClickOutside';

interface RevisitCardProps {
    revisit: RevisitItem;
    compact?: boolean;
    onComplete: (id: string, difficulty: DifficultyRating) => void;
    onSnooze: (id: string, days: number) => void;
    onEdit?: (revisit: RevisitItem) => void;
    onDelete?: (id: string) => void;
    onMarkDone?: (id: string) => void;
}

const RevisitCard: React.FC<RevisitCardProps> = ({
    revisit,
    compact = false,
    onComplete,
    onSnooze,
    onEdit,
    onDelete,
    onMarkDone,
}) => {
    const [showActions, setShowActions] = useState(false);
    const [showDifficultyRating, setShowDifficultyRating] = useState(false);
    const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

    // Refs for click-outside detection
    const actionsRef = useRef<HTMLDivElement>(null);
    const difficultyRef = useRef<HTMLDivElement>(null);
    const snoozeRef = useRef<HTMLDivElement>(null);

    // Click outside handlers
    useClickOutside(actionsRef, () => setShowActions(false), showActions);
    useClickOutside(difficultyRef, () => setShowDifficultyRating(false), showDifficultyRating);
    useClickOutside(snoozeRef, () => setShowSnoozeOptions(false), showSnoozeOptions);

    const handleStartRevisit = () => {
        if (revisit.resource_url) {
            window.open(revisit.resource_url, '_blank');
        }
    };

    const handleDifficultySelect = (difficulty: DifficultyRating) => {
        onComplete(revisit.id, difficulty);
        setShowDifficultyRating(false);
    };

    const handleSnooze = (days: number) => {
        onSnooze(revisit.id, days);
        setShowSnoozeOptions(false);
    };

    // Compact view for dashboard integration
    if (compact) {
        return (
            <div className="bg-[#111814] border border-[#2d4a38] rounded-xl p-3 mb-2 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base">{getRevisitTypeIcon(revisit.type)}</span>
                        <span className="text-white font-medium text-sm truncate">
                            {revisit.title}
                        </span>
                        <span className="text-white/40 text-xs shrink-0">
                            {formatEstimatedTime(revisit.estimated_time_min)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                        {revisit.resource_url && (
                            <button
                                onClick={handleStartRevisit}
                                className="size-7 rounded-lg bg-[#1a2d23] flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                                title="Open resource"
                            >
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowDifficultyRating(true)}
                            className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
                            title="Mark done"
                        >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                        </button>
                        <button
                            onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                            className="size-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
                            title="Snooze"
                        >
                            <span className="material-symbols-outlined text-[16px]">snooze</span>
                        </button>
                    </div>
                </div>

                {/* Snooze Options Dropdown */}
                {showSnoozeOptions && (
                    <div ref={snoozeRef} className="mt-2 flex gap-2 animate-fade-in">
                        <button
                            onClick={() => handleSnooze(1)}
                            className="px-2 py-1 rounded-lg bg-[#1a2d23] text-white/70 text-xs hover:bg-[#2d4a38]"
                        >
                            Tomorrow
                        </button>
                        <button
                            onClick={() => handleSnooze(3)}
                            className="px-2 py-1 rounded-lg bg-[#1a2d23] text-white/70 text-xs hover:bg-[#2d4a38]"
                        >
                            +3 days
                        </button>
                        <button
                            onClick={() => handleSnooze(7)}
                            className="px-2 py-1 rounded-lg bg-[#1a2d23] text-white/70 text-xs hover:bg-[#2d4a38]"
                        >
                            +1 week
                        </button>
                    </div>
                )}

                {/* Custom Date Picker */}
                {showDifficultyRating && (
                    <div ref={difficultyRef} className="mt-2 p-3 bg-[#1a2d23] rounded-xl animate-fade-in">
                        <p className="text-white/70 text-xs mb-2">When should you revisit this next?</p>

                        {/* Date Input */}
                        <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const selectedDate = new Date(e.target.value);
                                    const currentDate = new Date(revisit.next_review_at);
                                    const daysDiff = Math.ceil((selectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

                                    const spacingInfo = document.getElementById(`spacing-compact-${revisit.id}`);
                                    if (spacingInfo) {
                                        if (daysDiff > 0) {
                                            spacingInfo.textContent = `+${daysDiff} days from current`;
                                            spacingInfo.className = 'text-primary text-[10px] mt-1 text-center';
                                        } else if (daysDiff === 0) {
                                            spacingInfo.textContent = 'Same as current';
                                            spacingInfo.className = 'text-white/50 text-[10px] mt-1 text-center';
                                        } else {
                                            spacingInfo.textContent = `${daysDiff} days (earlier)`;
                                            spacingInfo.className = 'text-amber-400 text-[10px] mt-1 text-center';
                                        }
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                if (e.target.value) {
                                    handleDifficultySelect('medium');
                                }
                            }}
                            className="w-full bg-[#111814] border border-[#2d4a38] rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-primary text-xs"
                        />

                        <div id={`spacing-compact-${revisit.id}`} className="text-white/50 text-[10px] mt-1 text-center">
                            Select a date
                        </div>

                        {/* Quick Presets */}
                        <div className="flex gap-1 mt-2">
                            <button
                                onClick={() => handleDifficultySelect('hard')}
                                className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/30"
                            >
                                +2d
                            </button>
                            <button
                                onClick={() => handleDifficultySelect('medium')}
                                className="flex-1 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-medium hover:bg-amber-500/30"
                            >
                                +7d
                            </button>
                            <button
                                onClick={() => handleDifficultySelect('easy')}
                                className="flex-1 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/30"
                            >
                                +14d
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Full card view
    return (
        <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-xl p-4 hover:border-primary/50 transition-colors group">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getRevisitTypeIcon(revisit.type)}</span>
                    <div>
                        <h3 className="text-white font-semibold">{revisit.title}</h3>
                        {revisit.reason_to_return && (
                            <p className="text-white/50 text-sm line-clamp-1">
                                {revisit.reason_to_return}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#111814] text-white/60 text-xs">
                        {formatEstimatedTime(revisit.estimated_time_min)}
                    </span>
                    <div className="relative" ref={actionsRef}>
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="size-7 rounded-lg hover:bg-[#111814] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <span className="material-symbols-outlined text-white/60 text-[18px]">more_vert</span>
                        </button>

                        {/* Actions Dropdown */}
                        {showActions && (
                            <div className="absolute right-0 top-8 bg-[#111814] border border-[#2d4a38] rounded-xl py-1 min-w-[120px] shadow-lg z-10">
                                {onEdit && (
                                    <button
                                        onClick={() => {
                                            onEdit(revisit);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-[#1a2d23] flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit
                                    </button>
                                )}
                                {onMarkDone && (
                                    <button
                                        onClick={() => {
                                            onMarkDone(revisit.id);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-[#1a2d23] flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">done_all</span>
                                        Mastered
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            onDelete(revisit.id);
                                            setShowActions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#1a2d23] flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Resource Link */}
            {revisit.resource_url && (
                <a
                    href={revisit.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary text-sm hover:underline mb-3"
                >
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    <span className="truncate max-w-[200px]">
                        {new URL(revisit.resource_url).hostname}
                    </span>
                </a>
            )}

            {/* Notes */}
            {revisit.notes && (
                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                    {revisit.notes}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#2d4a38]">
                {revisit.resource_url && (
                    <button
                        onClick={handleStartRevisit}
                        className="flex-1 py-2 rounded-lg bg-primary text-black font-medium text-sm hover:brightness-110 transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        Start
                    </button>
                )}
                <button
                    onClick={() => setShowDifficultyRating(!showDifficultyRating)}
                    className={`${revisit.resource_url ? 'flex-1' : 'flex-[2]'} py-2 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium text-sm hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1`}
                >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Done
                </button>
                <button
                    onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                    className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 font-medium text-sm hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-1"
                >
                    <span className="material-symbols-outlined text-[16px]">snooze</span>
                    Snooze
                </button>
            </div>

            {/* Snooze Options */}
            {showSnoozeOptions && (
                <div ref={snoozeRef} className="mt-3 flex gap-2 animate-fade-in">
                    <button
                        onClick={() => handleSnooze(1)}
                        className="flex-1 py-2 rounded-lg bg-[#111814] text-white/70 text-sm hover:bg-[#2d4a38] transition-colors"
                    >
                        Tomorrow
                    </button>
                    <button
                        onClick={() => handleSnooze(3)}
                        className="flex-1 py-2 rounded-lg bg-[#111814] text-white/70 text-sm hover:bg-[#2d4a38] transition-colors"
                    >
                        +3 days
                    </button>
                    <button
                        onClick={() => handleSnooze(7)}
                        className="flex-1 py-2 rounded-lg bg-[#111814] text-white/70 text-sm hover:bg-[#2d4a38] transition-colors"
                    >
                        +1 week
                    </button>
                </div>
            )}

            {/* Custom Date Picker for Next Review */}
            {showDifficultyRating && (
                <div ref={difficultyRef} className="mt-3 p-3 bg-[#111814] rounded-xl animate-fade-in">
                    <p className="text-white/70 text-sm mb-3 text-center">When should you revisit this next?</p>

                    {/* Date Input */}
                    <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                            if (e.target.value) {
                                const selectedDate = new Date(e.target.value);
                                const currentDate = new Date(revisit.next_review_at);
                                const daysDiff = Math.ceil((selectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

                                // Show spacing info
                                const spacingInfo = document.getElementById(`spacing-${revisit.id}`);
                                if (spacingInfo) {
                                    if (daysDiff > 0) {
                                        spacingInfo.textContent = `+${daysDiff} days from current review`;
                                        spacingInfo.className = 'text-primary text-xs mt-2 text-center';
                                    } else if (daysDiff === 0) {
                                        spacingInfo.textContent = 'Same as current review date';
                                        spacingInfo.className = 'text-white/50 text-xs mt-2 text-center';
                                    } else {
                                        spacingInfo.textContent = `${daysDiff} days (earlier than current)`;
                                        spacingInfo.className = 'text-amber-400 text-xs mt-2 text-center';
                                    }
                                }
                            }
                        }}
                        onBlur={(e) => {
                            if (e.target.value) {
                                // Auto-complete with medium difficulty when date is selected
                                handleDifficultySelect('medium');
                            }
                        }}
                        className="w-full bg-[#1a2d23] border border-[#2d4a38] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />

                    {/* Spacing Info */}
                    <div id={`spacing-${revisit.id}`} className="text-white/50 text-xs mt-2 text-center">
                        Select a date to see spacing
                    </div>

                    {/* Quick Presets */}
                    <div className="mt-3 pt-3 border-t border-[#2d4a38]">
                        <p className="text-white/50 text-xs mb-2">Quick select:</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + 2);
                                    handleDifficultySelect('hard');
                                }}
                                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                                +2 days
                            </button>
                            <button
                                onClick={() => {
                                    handleDifficultySelect('medium');
                                }}
                                className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                            >
                                +7 days
                            </button>
                            <button
                                onClick={() => {
                                    handleDifficultySelect('easy');
                                }}
                                className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                            >
                                +14 days
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Count Badge */}
            {revisit.review_count > 0 && (
                <div className="mt-2 flex items-center gap-1 text-white/40 text-xs">
                    <span className="material-symbols-outlined text-[14px]">replay</span>
                    Reviewed {revisit.review_count} time{revisit.review_count > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default RevisitCard;
