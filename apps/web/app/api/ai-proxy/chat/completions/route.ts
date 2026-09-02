import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({ error: "Deployment AI defaults are not configured." }, { status: 500 });
  }

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");

  try {
    const body = await request.json();

    // Force the deployment default model
    body.model = model;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to proxy AI request." }, { status: 502 });
  }
}
