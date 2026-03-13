export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  
  request: (method: string, url: string, body?: any) => {
    console.log(`[REQUEST] ${new Date().toISOString()} - ${method} ${url}`, body || '');
  },
  
  response: (method: string, url: string, statusCode: number, responseData?: any) => {
    console.log(`[RESPONSE] ${new Date().toISOString()} - ${method} ${url} - ${statusCode}`, responseData || '');
  }
};
