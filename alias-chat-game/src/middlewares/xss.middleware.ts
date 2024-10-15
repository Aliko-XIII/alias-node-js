import { Injectable, NestMiddleware } from '@nestjs/common';
import xss from 'xss';

@Injectable()
export class XssMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (req.body) {
      req.body = this.sanitize(req.body);
    }
    next();
  }

  private sanitize(input: any): any {
    const sanitizedInput = {};
    for (const key in input) {
      if (typeof input[key] === 'string') {
        sanitizedInput[key] = xss(input[key]);
      } else if (Array.isArray(input[key])) {
        sanitizedInput[key] = input[key].map((item) =>
          typeof item === 'string' ? xss(item) : item,
        );
      } else {
        sanitizedInput[key] = input[key];
      }
    }
    return sanitizedInput;
  }
}
