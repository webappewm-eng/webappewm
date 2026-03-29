import { NextResponse } from "next/server";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function extractJson(text: string): Record<string, unknown> | null {
  const codeFence = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = codeFence?.[1] ?? text;

  try {
    return JSON.parse(raw);
  } catch {
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      return null;
    }

    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing. Add it in your environment variables before using AI generation."
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      prompt?: string;
      model?: string;
      titleHint?: string;
      excerptHint?: string;
    };

    const prompt = body.prompt?.trim() ?? "";
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const model = body.model?.trim() || "gemini-1.5-flash";
    const instruction = [
      "You are writing a technical blog post for engineering learners.",
      "Return only valid JSON with keys: title, excerpt, content, seoTitle, seoDescription.",
      "content should be rich HTML including headings, paragraphs, lists, and at least one <pre><code class=\"language-code\"> block.",
      `Optional title hint: ${body.titleHint || ""}`,
      `Optional excerpt hint: ${body.excerptHint || ""}`,
      `User request: ${prompt}`
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: instruction }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2400
          }
        })
      }
    );

    const payload = (await response.json()) as GeminiResponse & { error?: { message?: string } };

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.error?.message || "Gemini API request failed."
        },
        { status: 500 }
      );
    }

    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n")
        .trim() ?? "";

    if (!text) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 500 });
    }

    const parsed = extractJson(text);
    if (!parsed) {
      return NextResponse.json({ error: "Could not parse Gemini output into JSON." }, { status: 500 });
    }

    return NextResponse.json({
      title: String(parsed.title ?? ""),
      excerpt: String(parsed.excerpt ?? ""),
      content: String(parsed.content ?? ""),
      seoTitle: String(parsed.seoTitle ?? ""),
      seoDescription: String(parsed.seoDescription ?? "")
    });
  } catch {
    return NextResponse.json({ error: "AI generation failed due to a server error." }, { status: 500 });
  }
}
