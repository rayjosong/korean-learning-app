import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.AI_API_KEY && process.env.AI_MODEL);
  return NextResponse.json({ configured });
}
