import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

type ErrorExample = { summary: string; message: string };

function errorContent(status: number, error: string, examples: ErrorExample[]) {
  const named = Object.fromEntries(
    examples.map((item, index) => [
      `case${index + 1}`,
      {
        summary: item.summary,
        value: { statusCode: status, error, message: item.message },
      },
    ]),
  );
  return {
    'application/json': {
      schema: {
        type: 'object',
        required: ['statusCode', 'error', 'message'],
        properties: {
          statusCode: { type: 'integer', example: status },
          error: { type: 'string', example: error },
          message: { type: 'string', example: examples[0]?.message ?? '' },
        },
      },
      examples: named,
    },
  };
}

export function apiError(status: number, error: string, description: string, examples: ErrorExample[]) {
  return ApiResponse({ status, description, content: errorContent(status, error, examples) });
}

export function apiJson(status: number, description: string, example: unknown) {
  return ApiResponse({
    status,
    description,
    content: { 'application/json': { example } },
  });
}

export function ApiCommonErrors(badRequest: ErrorExample[], unauthorized: ErrorExample[]) {
  const decorators = [
    apiError(401, 'Unauthorized', unauthorized[0]?.summary ?? 'Not signed in.', unauthorized),
    apiError(403, 'Forbidden', 'Reserved by the global error filter. These routes do not return 403.', [
      { summary: 'A route refuses an action', message: 'Forbidden' },
    ]),
    apiError(404, 'Not Found', 'The path is not one of the routes in this document.', [
      { summary: 'Unknown path', message: 'Cannot GET /api/nope' },
    ]),
    apiError(500, 'Internal Server Error', 'The server failed before it could build a normal response.', [
      { summary: 'Unexpected failure', message: 'Something went wrong.' },
    ]),
  ];
  if (badRequest.length > 0) {
    decorators.unshift(apiError(400, 'Bad Request', 'The request failed validation.', badRequest));
  }
  return applyDecorators(...decorators);
}
