import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  try {
    const body = await req.json();
    const remainingCalories = Number(body.remaining_calories ?? body.remainingCalories ?? body.calories ?? 0);
    const remainingProtein = Number(body.remaining_protein ?? body.remainingProtein ?? body.protein ?? 0);

    if (!Number.isFinite(remainingCalories) || !Number.isFinite(remainingProtein)) {
      return new Response(JSON.stringify({ error: "Invalid remaining_calories or remaining_protein" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Anthropic API key not configured (CLAUDE_API_KEY)" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    const prompt = `You are a concise nutrition assistant. Provide exactly 2 Indian vegetarian meal suggestions that together (or individually) help meet the remaining targets for today: ${remainingCalories} kcal and ${remainingProtein} g protein. For each suggestion include: 1) a short meal name, 2) approximate serving size in grams, and 3) estimated calories, protein (g), carbs (g), and fat (g). Keep the response brief and easy to read.`;

    // Use the Responses API when available in the SDK
    let result;
    try {
      result = await client.responses.create({
        model: "claude-sonnet-4-6",
        input: prompt,
        max_tokens: 800,
      });
    } catch (e) {
      // Fallback to complete if responses.create is not available
      try {
        result = await client.complete({ model: "claude-sonnet-4-6", prompt, max_tokens: 800 });
      } catch (err) {
        return new Response(JSON.stringify({ error: `Anthropic request failed: ${err.message || String(err)}` }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Extract text from possible response shapes
    const text =
      result.output_text ||
      (Array.isArray(result.output) && result.output.map((o) => {
        if (o && o.content) {
          return o.content.map((c) => c.text || "").join("");
        }
        return "";
      }).join("\n")) ||
      String(result);

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
