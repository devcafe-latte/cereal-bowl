export class DbError {
  message: string;
  code: string = "generic-db-error";
  innerExcepton: any;

  static new(message: string, code?: string, innerException?: any): DbError {
    const e = new DbError();
    e.message = message;
    if (e.code) e.code = code;
    e.innerExcepton = innerException;

    return e;
  }
}