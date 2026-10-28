import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

type JsonResponse = { status: (code: number) => { json: (body: unknown) => void } };

const STATUS_LABEL: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<JsonResponse>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      error: STATUS_LABEL[status] ?? 'Error',
      message: this.message(exception),
    });
  }

  private message(exception: unknown) {
    if (!(exception instanceof HttpException)) return 'Something went wrong.';
    const body = exception.getResponse();
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object' && 'message' in body) {
      const raw = (body as { message?: string | string[] }).message;
      if (Array.isArray(raw)) return raw.join(' ');
      if (typeof raw === 'string' && raw) return raw;
    }
    return 'Something went wrong.';
  }
}
