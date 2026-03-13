export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  apiPrefix: string;
  swagger: {
    title: string;
    description: string;
    version: string;
  };
}

export const appConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  swagger: {
    title: process.env.SWAGGER_TITLE || 'Escrow Wallet Service API',
    description: process.env.SWAGGER_DESCRIPTION || 'API documentation for Escrow Wallet Service',
    version: process.env.SWAGGER_VERSION || '1.0',
  },
});
