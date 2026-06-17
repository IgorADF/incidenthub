export class CreatedAt {
  readonly value: Date;
  constructor(value?: Date) {
    this.value = value ?? new Date();
  }
}
