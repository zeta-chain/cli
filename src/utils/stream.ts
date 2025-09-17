import { AxiosResponse } from "axios";

// Highly reusable stream utilities

export type StreamLike = {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  setEncoding?: (encoding: string) => void;
};

export const isValidStream = (value: unknown): value is StreamLike =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as Record<string, unknown>).on === "function";

export const readStreamBody = async (res: AxiosResponse): Promise<string> => {
  const data = res.data as unknown;

  if (isValidStream(data)) {
    return await new Promise<string>((resolve) => {
      let s = "";
      data.setEncoding?.("utf8");
      data.on("data", (...args: unknown[]) => {
        const c = args[0];
        s += Buffer.isBuffer(c) ? c.toString() : String(c);
      });
      data.on("end", () => resolve(s));
      data.on("error", () => resolve(""));
    });
  }

  return typeof res.data === "string"
    ? res.data
    : res.data == null
      ? ""
      : String(res.data);
};
