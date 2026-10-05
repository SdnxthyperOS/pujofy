import React, { useState } from 'react';
import { CrowdLevel } from '@pujofy/types';
import { submitCrowdReport } from '../services/api';
import { X, Users, CheckCircle, Send } from 'lucide-react';

interface CrowdReportModalProps {
  pandalId: string | null;
  pandalName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const CrowdReportModal: React.FC<CrowdReportModalProps> = ({
  pandalId,
  pandalName = 'Pandal',
  onClose,
  onSubmitted,
}) => {
  if (!pandalId) return null;

  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('MEDIUM');
  const [queueMinutes, setQueueMinutes] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await submitCrowdReport({
      pandalId,
      crowdLevel,
      queueMinutes,
    });
    setIsSubmitting(false);

    setFeedback(res.message);
    setTimeout(() => {
      onSubmitted();
      onClose();
    }, 1200);
  };

  const crowdOptions: { level: CrowdLevel; label: string; desc: string; color: string }[] = [
    { level: 'LOW', label: 'Low Crowd 🌿', desc: '< 15 mins queue', color: 'border-[#C59A62] bg-[#FAF7F2]' },
    { level: 'MEDIUM', label: 'Moderate 🟡', desc: '15-30 mins queue', color: 'border-[#B87352] bg-[#FFFDF9]' },
    { level: 'HIGH', label: 'Heavy 🟠', desc: '30-60 mins queue', color: 'border-[#5A3426] bg-[#E9DED2]/40' },
    { level: 'VERY_HIGH', label: 'Very Heavy 🔴', desc: '60+ mins queue', color: 'border-[#3A2118] bg-[#3A2118] text-[#FFFDF9]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3A2118]/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] p-5 shadow-warm-lg z-10 animate-slideUp">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9DED2]">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#B87352]" />
            <h3 className="font-serif text-lg font-bold text-[#3A2118]">Report Live Crowd</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#7A665B] hover:text-[#3A2118]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#7A665B] mt-2 mb-3">
          Help fellow hoppers at <span className="font-semibold text-[#3A2118]">{pandalName}</span> by reporting real-time crowd status.
        </p>

        {feedback ? (
          <div className="py-8 text-center space-y-2 animate-fadeIn">
            <CheckCircle className="w-12 h-12 text-[#B87352] mx-auto animate-bounce" />
            <p className="text-sm font-bold text-[#3A2118]">Thank You!</p>
            <p className="text-xs text-[#7A665B]">{feedback}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A665B] block mb-2">
                Crowd Density
              </label>
              <div className="grid grid-cols-2 gap-2">
                {crowdOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.level}
                    onClick={() => setCrowdLevel(opt.level)}
                    className={`p-2.5 rounded-xl border text-left transition ${opt.color} ${
                      crowdLevel === opt.level
                        ? 'ring-2 ring-[#B87352] shadow-warm-sm scale-[1.02]'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#3A2118]">{opt.label}</p>
                    <p className="text-[10px] text-[#7A665B]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A665B]">
                  Queue Wait Time
                </label>
                <span className="text-xs font-bold text-[#B87352]">{queueMinutes} mins</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={queueMinutes}
                onChange={(e) => setQueueMinutes(Number(e.target.value))}
                className="w-full accent-[#B87352] bg-[#E9DED2] rounded-lg cursor-pointer h-2"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#3A2118] hover:bg-[#5A3426] text-[#FFFDF9] rounded-2xl text-xs font-bold shadow-warm-md flex items-center justify-center space-x-2 transition"
            >
              <Send className="w-4 h-4 text-[#C59A62]" />
              <span>{isSubmitting ? 'Submitting...' : 'SUBMIT LIVE REPORT'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
