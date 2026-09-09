import type { ErrorHandler } from "hono";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    return c.json({ success: false, message: err.message }, err.status as 400);
  }
  console.error(err);
  return c.json({ success: false, message: "Internal server error" }, 500);
};
