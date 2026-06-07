import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';

type Level = 'info' | 'error' | 'warn' | 'debug' | 'verbose';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Pattern: Strategy — one structured-logging implementation with two output modes.
 *
 * In production it emits one JSON object per line (stdout for info/warn/debug,
 * stderr for errors) so a log aggregator can parse fields. In dev/test it
 * delegates to Nest's pretty ConsoleLogger for readability.
 *
 * It only formats the messages it is handed — request bodies, tokens, and PII are
 * never logged by callers (see the request interceptor and CLAUDE.md logging rule).
 */
@Injectable()
export class JsonLogger implements LoggerService {
  private readonly pretty = new ConsoleLogger();

  constructor(
    private readonly useJson = process.env.NODE_ENV === 'production',
  ) {}

  log(message: unknown, ...optional: unknown[]): void {
    this.write('info', message, optional);
  }
  error(message: unknown, ...optional: unknown[]): void {
    this.write('error', message, optional);
  }
  warn(message: unknown, ...optional: unknown[]): void {
    this.write('warn', message, optional);
  }
  debug(message: unknown, ...optional: unknown[]): void {
    this.write('debug', message, optional);
  }
  verbose(message: unknown, ...optional: unknown[]): void {
    this.write('verbose', message, optional);
  }

  private write(level: Level, message: unknown, optional: unknown[]): void {
    if (!this.useJson) {
      this.delegate(level, message, optional);
      return;
    }

    // Nest's convention: error(message, stack?, context?); others: (message, context?).
    let context: string | undefined;
    let stack: string | undefined;
    if (level === 'error' && optional.length >= 2) {
      stack = asString(optional[0]);
      context = asString(optional[1]);
    } else {
      context = asString(optional[optional.length - 1]);
    }

    const entry = {
      level,
      time: new Date().toISOString(),
      context,
      message:
        typeof message === 'string'
          ? message
          : (() => {
              try {
                return JSON.stringify(message);
              } catch {
                return String(message);
              }
            })(),
      ...(stack ? { stack } : {}),
    };

    const line = `${JSON.stringify(entry)}\n`;
    if (level === 'error') process.stderr.write(line);
    else process.stdout.write(line);
  }

  private delegate(level: Level, message: unknown, optional: unknown[]): void {
    switch (level) {
      case 'info':
        this.pretty.log(message as never, ...(optional as never[]));
        break;
      case 'error':
        this.pretty.error(message as never, ...(optional as never[]));
        break;
      case 'warn':
        this.pretty.warn(message as never, ...(optional as never[]));
        break;
      case 'debug':
        this.pretty.debug(message as never, ...(optional as never[]));
        break;
      case 'verbose':
        this.pretty.verbose(message as never, ...(optional as never[]));
        break;
    }
  }
}
