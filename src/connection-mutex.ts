export class ConnectionMutex {
  private promise: Promise<void> = Promise.resolve();
  private resolve: (() => void) | null = null;

  async lock(): Promise<void> {
    const prevPromise = this.promise;
    let releaseLock: () => void;
    this.promise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.resolve = releaseLock!;
    await prevPromise;
  }

  unlock(): void {
    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
  }
}
