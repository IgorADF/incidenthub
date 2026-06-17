type ValueObjectErrorType = "validation";

export class ValueObjectError {
  className: string;
  type: ValueObjectErrorType;
  message: string;

  constructor(className: string, type: ValueObjectErrorType, message: string) {
    this.className = className;
    this.type = type;
    this.message = message;
  }
}
