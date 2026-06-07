import { JsonLogger } from './json.logger';

describe('JsonLogger (JSON mode)', () => {
  const logger = new JsonLogger(true);

  it('emits one JSON line to stdout for info logs', () => {
    const spy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    logger.log('hello', 'TestCtx');

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(parsed).toMatchObject({
      level: 'info',
      message: 'hello',
      context: 'TestCtx',
    });
    expect(typeof parsed.time).toBe('string');
    spy.mockRestore();
  });

  it('writes errors to stderr with stack and context', () => {
    const spy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    logger.error('boom', 'STACKTRACE', 'ErrCtx');

    const parsed = JSON.parse(spy.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(parsed).toMatchObject({
      level: 'error',
      message: 'boom',
      context: 'ErrCtx',
      stack: 'STACKTRACE',
    });
    spy.mockRestore();
  });

  it('serializes non-string messages', () => {
    const spy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    logger.log({ a: 1 });

    const parsed = JSON.parse(spy.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    expect(parsed.message).toBe('{"a":1}');
    spy.mockRestore();
  });
});
