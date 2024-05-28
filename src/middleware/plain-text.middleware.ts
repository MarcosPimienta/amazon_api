import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PlainTextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.is('text/plain')) {
      req.setEncoding('utf8');
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        req.body = { upc: data };
        next();
      });
    } else {
      next();
    }
  }
}
