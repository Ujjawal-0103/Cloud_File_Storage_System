import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

function sanitizeLogMessage(input: string): string {
  if (!input) return '';
  return input
    .replace(/(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED_TOKEN]')
    .replace(/(password['"]?\s*[:=]\s*['"]?)[^'"\s,]+/gi, '$1[REDACTED_PASSWORD]')
    .replace(/(api_key['"]?\s*[:=]\s*['"]?)[^'"\s,]+/gi, '$1[REDACTED_KEY]')
    .replace(/(api_secret['"]?\s*[:=]\s*['"]?)[^'"\s,]+/gi, '$1[REDACTED_SECRET]')
    .replace(/(secret['"]?\s*[:=]\s*['"]?)[^'"\s,]+/gi, '$1[REDACTED_SECRET]');
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name;
      }

      if (status >= 500) {
        this.logger.error(
          `[${request.method}] ${request.url} - Status: ${status} - [${exception.name}] ${sanitizeLogMessage(exception.message)}`,
          sanitizeLogMessage(exception.stack || ''),
        );
      } else {
        this.logger.warn(
          `[${request.method}] ${request.url} - Status: ${status} - [${exception.name}] ${sanitizeLogMessage(JSON.stringify(message))}`,
        );
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      const prismaCode = (exception as any).code;
      if (prismaCode === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A resource with this identifier already exists';
        error = 'Conflict';
      } else if (prismaCode === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Requested record was not found';
        error = 'Not Found';
      } else if (prismaCode === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced resource or folder does not exist';
        error = 'Bad Request';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database operation could not be completed';
        error = 'Bad Request';
      }

      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - [Prisma:${prismaCode}] ${sanitizeLogMessage((exception as any).message || '')}`,
      );
    } else if (
      exception &&
      typeof exception === 'object' &&
      (exception as any).name === 'MulterError'
    ) {
      const multerErr = exception as any;
      if (multerErr.code === 'LIMIT_FILE_SIZE') {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = 'Uploaded file exceeds the allowed file size limit';
        error = 'Payload Too Large';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = multerErr.message || 'File upload error';
        error = 'Bad Request';
      }

      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - [Multer:${multerErr.code || 'Error'}] ${multerErr.message}`,
      );
    } else {
      // Unexpected / unhandled errors (Error instances, rejected objects, thrown strings)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected internal error occurred';
      error = 'Internal Server Error';

      const exceptionName =
        (exception as any)?.name ||
        (exception as any)?.constructor?.name ||
        typeof exception ||
        'UnhandledException';

      let rawErrorMessage = '';
      if (exception instanceof Error) {
        rawErrorMessage = exception.message;
      } else if (typeof exception === 'string') {
        rawErrorMessage = exception;
      } else if (typeof exception === 'object' && exception !== null) {
        rawErrorMessage = (exception as any).message || JSON.stringify(exception);
      } else {
        rawErrorMessage = String(exception);
      }

      const stackTrace = (exception as any)?.stack;
      const errorCode = (exception as any)?.code || (exception as any)?.http_code;

      const sanitizedMsg = sanitizeLogMessage(rawErrorMessage);
      const sanitizedStack = stackTrace ? sanitizeLogMessage(stackTrace) : undefined;

      this.logger.error(
        `[${request.method}] ${request.url} - Status: ${status} - [${exceptionName}] ${sanitizedMsg}${errorCode ? ` (Code: ${errorCode})` : ''}`,
        sanitizedStack,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }
}
