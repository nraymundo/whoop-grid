import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in .env.local" },
      { status: 500 }
    );
  }

  const inputs = await req.json();

  const prompt = `You write a short, blunt fitness-recovery readout for a WHOOP dashboard, based only on the stats below. No greetings, no disclaimers, no markdown.

Stats (last 30 days unless noted):
- Nights under 6h sleep: ${inputs.nightsUnderSix}
- Red recovery days: ${inputs.redRecoveryDays}
- Recovery trend (last 15d vs prior 15d): ${inputs.recoveryTrend >= 0 ? "+" : ""}${inputs.recoveryTrend}%
- Strain trend (last 15d vs prior 15d): ${inputs.strainTrend >= 0 ? "+" : ""}${inputs.strainTrend}
- Average recovery: ${inputs.avgRecovery ?? "n/a"}%
- Average strain: ${inputs.avgStrain ?? "n/a"}
- Average sleep: ${inputs.avgSleepHours ?? "n/a"}h
- Current green-or-better streak: ${inputs.currentStreak} days
- Best day of week: ${inputs.bestWeekday ? `${inputs.bestWeekday.day} (avg ${inputs.bestWeekday.avg}%)` : "n/a"}

Respond with strict JSON only, no other text:
{"headline": "one sentence, under 14 words, direct", "short": "1-2 sentences, under 40 words, specific to the numbers above", "paragraphs": ["2-3 sentence paragraph expanding on the headline", "2-3 sentence paragraph about the trend/risk", "2-3 sentence paragraph noting one specific bright spot from the numbers"]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[insights] Anthropic API error", res.status, detail);
    return NextResponse.json(
      { error: "Anthropic API request failed" },
      { status: 502 }
    );
  }

  const data = await res.json();
  const rawText: string = data.content?.[0]?.text ?? "";
  // Models sometimes wrap JSON in a markdown code fence despite instructions not to.
  const text = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json({
      headline: String(parsed.headline ?? ""),
      short: String(parsed.short ?? ""),
      paragraphs: Array.isArray(parsed.paragraphs)
        ? parsed.paragraphs.map(String)
        : [],
    });
  } catch {
    console.error("[insights] non-JSON model output", text);
    return NextResponse.json(
      { error: "Model returned unparseable output" },
      { status: 502 }
    );
  }
}
