import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
  timestamp: string;
  path: string;
}

/**
 * Pattern: Global Exception Handling
 * Transforms all exceptions into a standard error response envelope
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    // Handle HttpException (NestJS built-in)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as { message?: string | string[] };
        const rawMessage = errorObj.message;
        message = Array.isArray(rawMessage)
          ? rawMessage.join('; ')
          : rawMessage || exception.message;
        errorCode = this.getErrorCodeFromStatus(statusCode);
      } else {
        message = String(exceptionResponse);
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'DATABASE_ERROR';
      message = this.handlePrismaError(exception);

      // Log database errors for debugging
      this.logger.error(`Prisma Error [${exception.code}]: ${message}`);
    }
    // Handle validation errors
    else if (exception instanceof Error) {
      if (exception.message.includes('validation')) {
        statusCode = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
        message = exception.message;
      } else {
        errorCode = exception.name || 'UNKNOWN_ERROR';
        message = exception.message || 'An error occurred';
      }
    }

    // Log error
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Exception: ${JSON.stringify(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Send standardized error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        statusCode,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    const errorMap: Record<string, string> = {
      P2002: 'A unique constraint was violated',
      P2003: 'A foreign key constraint was violated',
      P2025: 'Resource not found',
      P2000: 'The provided value for the column is too long',
      P2001: 'The record searched for in the query was not found',
      P2011: 'Null constraint violation',
      P2012: 'Missing a required value',
      P2014:
        'The change you are trying to make would violate the required relation',
      P2015: 'Related record not found',
      P2016: 'Query interpretation error',
      P2017:
        'The records for relation between parent and child models are not connected',
      P2018:
        'The required relation between models for the query could not be found',
      P2019: 'Input error',
      P2020: 'Value out of range for the type',
      P2021: 'Table does not exist in the current database',
      P2022: 'The column does not exist in the current database',
      P2023: 'Inconsistent column data',
    };

    return errorMap[error.code] || 'A database error occurred';
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
}
