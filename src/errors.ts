/** Error raised when an operation cannot process its input or arguments. */
export class OperationError extends Error {
  override name = "OperationError";
  /** Id of the failing operation, set by `run`. */
  operation?: string;
}
