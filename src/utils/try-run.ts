export type Result<T> = readonly [error: unknown, data: T | undefined]

export function tryRun<T>(fn: () => T): Result<T> {
  try {
    return [undefined, fn()]
  } catch (error) {
    return [error, undefined]
  }
}

export async function tryRunAsync<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return [undefined, await promise]
  } catch (error) {
    return [error, undefined]
  }
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
