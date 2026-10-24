export class BusinessToolsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessToolsError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BusinessToolsError {
  public readonly field?: string;
  public readonly issues: string[];

  constructor(message: string, options?: { field?: string; issues?: string[] }) {
    super(message);
    this.name = 'ValidationError';
    this.field = options?.field;
    this.issues = options?.issues ?? [message];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
