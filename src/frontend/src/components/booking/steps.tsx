import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = ['Chọn thời gian', 'Thông tin khách', 'Thanh toán'];

export function BookingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  done && 'bg-blue-600 border-blue-600 text-white',
                  active && 'bg-white border-blue-600 text-blue-600',
                  !done && !active && 'bg-white border-slate-200 text-slate-400',
                )}
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 font-medium whitespace-nowrap',
                  active ? 'text-blue-600' : done ? 'text-slate-500' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-14px]',
                  done ? 'bg-blue-600' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
