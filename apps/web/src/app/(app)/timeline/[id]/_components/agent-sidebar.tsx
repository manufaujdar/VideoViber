import { Trash2 } from 'lucide-react';
import type { AgentMessage, AgentQuickCommand } from './timeline-editor-types';

interface AgentSidebarProps {
  agentMessages: AgentMessage[];
  agentAutoApply: boolean;
  agentSafeMode: boolean;
  pendingSafeCommand: string | null;
  quickCommands: AgentQuickCommand[];
  onClearHistory: () => void;
  onToggleAutoApply: () => void;
  onToggleSafeMode: () => void;
  onRunCommand: (command: string) => void;
  formatMessageTime: (timestamp: number) => string;
  containerSpanClass: string;
}

export function AgentSidebar({
  agentMessages,
  agentAutoApply,
  agentSafeMode,
  pendingSafeCommand,
  quickCommands,
  onClearHistory,
  onToggleAutoApply,
  onToggleSafeMode,
  onRunCommand,
  formatMessageTime,
  containerSpanClass,
}: AgentSidebarProps) {
  return (
    <div className={`vv-card min-h-0 overflow-hidden ${containerSpanClass}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Timeline Agent</p>
          <p className="text-vv-muted text-[11px]">Command history and quick actions</p>
        </div>
        <button
          onClick={onClearHistory}
          className="vv-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-xs"
          title="Keep latest assistant message"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="mb-3 max-h-[38vh] space-y-2 overflow-y-auto pr-1">
        {agentMessages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border px-2 py-2 text-xs ${
              message.role === 'assistant'
                ? 'border-cyan-300/25 bg-cyan-400/10 text-cyan-50'
                : 'border-white/15 bg-white/[0.03] text-vv-primary'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {message.role === 'assistant' ? 'Agent' : 'You'}
              </span>
              <span className="text-[10px] opacity-70">{formatMessageTime(message.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
        <p className="text-vv-muted text-[10px] font-semibold uppercase tracking-wider">
          Advanced Options
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={onToggleAutoApply}
            className={`rounded-md border px-2 py-1 ${
              agentAutoApply
                ? 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100'
                : 'border-white/15 text-vv-muted'
            }`}
          >
            Auto Apply: {agentAutoApply ? 'On' : 'Off'}
          </button>
          <button
            onClick={onToggleSafeMode}
            className={`rounded-md border px-2 py-1 ${
              agentSafeMode
                ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                : 'border-white/15 text-vv-muted'
            }`}
          >
            Safe Mode: {agentSafeMode ? 'On' : 'Off'}
          </button>
        </div>
        {pendingSafeCommand && (
          <p className="rounded border border-amber-300/35 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-100">
            Pending confirmation: <span className="font-mono">confirm {pendingSafeCommand}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-vv-muted text-[10px] font-semibold uppercase tracking-wider">
          Quick Commands
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickCommands.map((quick) => (
            <button
              key={quick.command}
              onClick={() => onRunCommand(quick.command)}
              className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-1 text-[11px] text-vv-secondary transition-colors hover:text-vv-primary"
            >
              {quick.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
