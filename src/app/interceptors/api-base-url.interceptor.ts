import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../config/api-base-url';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  return next(req.clone({ url: `${API_BASE_URL}${req.url}` }));
};
