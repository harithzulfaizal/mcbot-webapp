import type { Citation } from "@/App";

const INLINE_CITATION_PATTERN =
  /\[(\d+)(?:\s*,\s*(?:(?:pg|pp|p)\.?\s*\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*[^\]]+)?)|[^\]]+)?\]/gi;

export function extractInlineCitationIndices(content: string): number[] {
  const seen = new Set<number>();
  const indices: number[] = [];
  for (const match of content.matchAll(INLINE_CITATION_PATTERN)) {
    const value = Number(match[1]);
    if (!Number.isInteger(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    indices.push(value);
  }
  return indices;
}

export function filterInlineCitations(content: string, citations: Citation[]): Citation[] {
  const used = new Set(extractInlineCitationIndices(content));
  if (used.size === 0) {
    return [];
  }
  return citations.filter((citation) => used.has(citation.index));
}
