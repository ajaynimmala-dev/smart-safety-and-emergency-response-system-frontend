import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // Do not add JWT to OSRM requests
  if (req.url.startsWith('https://router.project-osrm.org')) {
    return next(req);
  }

  const token = localStorage.getItem('token');

  console.log('TOKEN:', token);

  if (token) {

    const authReq = req.clone({
      setHeaders: {
        Authorization: 'Bearer ' + token
      }
    });

    console.log(
      'AUTHORIZATION HEADER:',
      authReq.headers.get('Authorization')
    );

    return next(authReq);
  }

  return next(req);
};
