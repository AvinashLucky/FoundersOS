import { NextResponse } from "next/server";

/**
 * Tiny HTTP helpers so every route handler stays ~10 lines and returns a
 * consistent shape. Success → the data. Failure → { code, message }.
 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function problem(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ code, message }, { status });
}

/** Parse a JSON body safely; returns null on bad/empty JSON. */
export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
