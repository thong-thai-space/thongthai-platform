import { setAtPath, unsetAtPath } from './content.path.util';

describe('content path utils', () => {
  describe('setAtPath', () => {
    it('sets a top-level key without touching siblings', () => {
      expect(setAtPath({ title: 'x' }, 'imageUrl', 'u')).toEqual({
        title: 'x',
        imageUrl: 'u',
      });
    });

    it('creates nested objects and preserves existing branches', () => {
      const source = { items: { web: { title: 'Web' }, ai: { title: 'AI' } } };
      expect(setAtPath(source, 'items.web.imageUrl', 'u')).toEqual({
        items: { web: { title: 'Web', imageUrl: 'u' }, ai: { title: 'AI' } },
      });
    });

    it('does not mutate the source', () => {
      const source = { items: { web: {} } };
      setAtPath(source, 'items.web.imageUrl', 'u');
      expect(source).toEqual({ items: { web: {} } });
    });
  });

  describe('unsetAtPath', () => {
    it('removes a leaf and prunes empty parents', () => {
      const source = { items: { web: { imageUrl: 'u' } } };
      expect(unsetAtPath(source, 'items.web.imageUrl')).toEqual({});
    });

    it('keeps parents that still have other keys', () => {
      const source = { items: { web: { title: 'Web', imageUrl: 'u' } } };
      expect(unsetAtPath(source, 'items.web.imageUrl')).toEqual({
        items: { web: { title: 'Web' } },
      });
    });
  });
});
