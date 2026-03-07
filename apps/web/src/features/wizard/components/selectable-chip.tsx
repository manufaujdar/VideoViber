'use client';

interface ChipOption {
  id: string;
  label: string;
  icon?: string;
}

interface SelectableChipGroupProps {
  options: readonly ChipOption[] | ChipOption[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label?: string;
}

export function SelectableChipGroup({
  options,
  selected,
  onChange,
  multiple = false,
  label,
}: SelectableChipGroupProps) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : [selected]);

  const handleClick = (id: string) => {
    if (multiple) {
      const current = Array.isArray(selected) ? selected : [selected].filter(Boolean);
      const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
      onChange(next);
    } else {
      onChange(selectedSet.has(id) ? '' : id);
    }
  };

  return (
    <div>
      {label && <label className="vv-label mb-2 block">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedSet.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleClick(opt.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_12px_rgba(82,222,255,0.15)]'
                  : 'border-white/10 bg-white/[0.03] text-vv-secondary hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              {opt.icon && <span className="text-base">{opt.icon}</span>}
              {opt.label}
              {isSelected && (
                <svg className="h-3.5 w-3.5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
