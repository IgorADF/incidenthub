export class DefaultEntity<T> {
  private props: T;
  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  getProps(): Readonly<T> {
    return this.props;
  }
}
