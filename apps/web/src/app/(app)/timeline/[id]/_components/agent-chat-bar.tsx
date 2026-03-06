import { Play } from 'lucide-react';
import type { AgentQuickCommand } from './timeline-editor-types';

interface AgentChatBarProps {
  agentInput: string;
  agentAutoApply: boolean;
  quickCommands: AgentQuickCommand[];
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onRunCommand: (command: string) => void;
}

export function AgentChatBar({
  agentInput,
  agentAutoApply,
  quickCommands,
  onInputChange,
  onSubmit,
  onRunCommand,
}: AgentChatBarProps) {
  return (
    <div className="vv-card shrink-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Agentic Chat Bar</p>
        <p className="text-vv-muted text-[11px]">
          Natural language timeline edits with {agentAutoApply ? 'auto-apply' : 'review mode'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={agentInput}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder='Try: "set in", "set out", "disable selected clip", "theme finishing", "seek 0:45"'
          className="vv-input h-10 min-w-[280px] flex-1 py-2 text-sm"
        />
        <button onClick={onSubmit} className="vv-btn-primary inline-flex items-center gap-1.5 px-4 py-2">
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickCommands.slice(0, 6).map((quick) => (
          <button
            key={`chat-${quick.command}`}
            onClick={() => onRunCommand(quick.command)}
            className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-vv-secondary hover:text-vv-primary"
          >
            {quick.command}
          </button>
        ))}
      </div>
    </div>
  );
}
