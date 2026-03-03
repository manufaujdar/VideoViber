export type PlannedShot = {
  title: string;
  prompt: string;
};

export function parsePlannerShots(content: string, maxShots: number): PlannedShot[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\s*(?:shot\s*\d+[:.-]?|\d+[).:-]?|[-*])\s*/i, ''))
    .filter((line) => line.length > 20);

  const deduped = Array.from(new Set(lines)).slice(0, maxShots);

  return deduped.map((line, index) => {
    const titled = line.match(/^([^:]{4,40}):\s*(.+)$/);
    if (titled) {
      const [, rawTitle = '', rawPrompt = ''] = titled;
      return {
        title: rawTitle.trim() || `Shot ${index + 1}`,
        prompt: rawPrompt.trim() || line,
      };
    }

    const fallbackTitle = line
      .replace(/[.!?].*$/, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')
      .trim();

    return {
      title: fallbackTitle || `Shot ${index + 1}`,
      prompt: line,
    };
  });
}
