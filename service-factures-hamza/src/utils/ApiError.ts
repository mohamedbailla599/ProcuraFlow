export class ApiError extends Error {
  statusCode: number;
  details: any;

  constructor(statusCode: number, message: string, details: any = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details: any = null): ApiError {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Ressource non trouvée'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = 'Erreur interne du serveur'): ApiError {
    return new ApiError(500, message);
  }

  static serviceUnavailable(serviceName: string): ApiError {
    return new ApiError(
      503,
      `Le service ${serviceName} est temporairement indisponible`
    );
  }
}

export default ApiError;

