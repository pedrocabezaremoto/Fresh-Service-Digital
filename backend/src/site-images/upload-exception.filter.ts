import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const err = exception as { code?: string; name?: string; message?: string };

    if (err?.code === 'LIMIT_FILE_SIZE' || err?.name === 'MulterError') {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no puede superar 2 MB'
          : 'No se pudo procesar el archivo';
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return res.status(status).json(exception.getResponse());
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno al subir la imagen',
    });
  }
}
