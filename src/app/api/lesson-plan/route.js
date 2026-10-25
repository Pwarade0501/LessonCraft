// /app/api/lesson-plan/route.js
import { generateContent } from "@/lib/gemini";
import { lessonPlanPrompt } from "@/lib/prompts";
import redisClient from "@/lib/redis";
import { requireAuth } from "@/lib/auth";
export async function POST(req) {
  try {
    await requireAuth();
    const { subject, topic, level } = await req.json();
    if (![subject, topic, level].every((value) => typeof value === "string" && value.trim())) {
      return Response.json({ error: "Subject, topic, and level are required." }, { status: 400 });
    }

    const cacheKey = `lesson-plan:${subject.trim()}:${topic.trim()}:${level.trim()}`;

    let cached = null;
    if (redisClient.isReady) {
      try {
        cached = await redisClient.get(cacheKey);
      } catch (error) {
        console.error("Lesson plan cache read failed:", error);
      }
    }
    if (cached) {
      console.log("⚡ Serving from Redis cache");
      return new Response(cached, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const prompt = lessonPlanPrompt(topic, subject, level);
    let generatedText = await generateContent(prompt);

    generatedText = generatedText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const lessonPlan = JSON.parse(generatedText);

    const responseData = JSON.stringify({ lessonPlan });

    if (redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 3600, responseData);
      } catch (error) {
        console.error("Lesson plan cache write failed:", error);
      }
    }

    return new Response(responseData, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Lesson Plan API error:", error);
    if (error.message === "Unauthorized") {
      return Response.json({ error: "Please sign in to generate a lesson plan." }, { status: 401 });
    }
    return new Response(
      JSON.stringify({
        error: "Failed to generate lesson plan.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
