import { RecursiveTextChunker } from './recursive-text-chunker';

// Pattern: Unit test — pure chunker, no I/O. Small sizes for readable assertions.

describe('RecursiveTextChunker', () => {
  const chunker = new RecursiveTextChunker(50, 10);

  it('returns no chunks for empty or whitespace-only text', () => {
    expect(chunker.chunk('')).toEqual([]);
    expect(chunker.chunk('   \n\n  \t ')).toEqual([]);
  });

  it('keeps short text as a single chunk', () => {
    const chunks = chunker.chunk('A short note.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe('A short note.');
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it('splits long text into multiple ordered, non-empty chunks', () => {
    const text = Array.from(
      { length: 8 },
      (_, i) => `Paragraph ${i} with some filler words here.`,
    ).join('\n\n');
    const chunks = chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => {
      expect(c.index).toBe(i);
      expect(c.content.trim().length).toBeGreaterThan(0);
    });
  });

  it('hard-splits a single paragraph longer than the window', () => {
    const chunks = chunker.chunk('x'.repeat(200));
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('overlaps consecutive chunks so boundary context is preserved', () => {
    const text = Array.from(
      { length: 6 },
      (_, i) => `Sentence number ${i} padded out.`,
    ).join('\n\n');
    const chunks = chunker.chunk(text);

    // The start of chunk N should share some text with the end of chunk N-1.
    for (let i = 1; i < chunks.length; i += 1) {
      const prevTail = chunks[i - 1].content.slice(-10);
      expect(chunks[i].content.includes(prevTail.trim().split(/\s+/)[0])).toBe(
        true,
      );
    }
  });

  it('disables overlap when configured with zero', () => {
    const noOverlap = new RecursiveTextChunker(40, 0);
    const chunks = noOverlap.chunk('y'.repeat(120));
    expect(chunks.length).toBeGreaterThan(1);
  });
});
