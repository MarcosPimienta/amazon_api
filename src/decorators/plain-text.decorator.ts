import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiPlainTextBody(): MethodDecorator {
  return applyDecorators(
    ApiConsumes('text/plain'),
    ApiBody({
      schema: {
        type: 'string',
        example: `35406-03324
615908426328
796845691977
615908420821
792486906111`,
      },
    }),
  );
}
