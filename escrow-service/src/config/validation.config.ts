import { ValidationPipe } from '@nestjs/common';

export const validationPipeConfig = (): ValidationPipe => {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });
};
