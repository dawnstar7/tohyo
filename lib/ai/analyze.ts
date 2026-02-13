import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Schema for AI-generated poll options
const pollOptionsSchema = z.object({
  options: z.array(
    z.object({
      option_text: z.string().describe("具体的な解決案や選択肢のテキスト"),
      explanation: z.string().describe("なぜこの選択肢が重要か、どの意見が反映されているかの説明"),
      related_opinions: z.array(z.number()).describe("この選択肢に反映された意見のインデックス（0始まり）"),
    })
  ).length(5).describe("5つの投票選択肢"),
});

export type AnalysisResult = z.infer<typeof pollOptionsSchema>;

/**
 * Analyze entries and generate poll options using AI
 * @param entries - Array of user entries (opinions)
 * @param roomTitle - Title of the room for context
 * @returns AI-generated poll options with explanations
 */
export async function analyzeEntriesAndGeneratePolls(
  entries: string[],
  roomTitle: string
): Promise<AnalysisResult> {
  if (entries.length === 0) {
    throw new Error("意見が投稿されていません");
  }

  const prompt = `
あなたは、多様な意見をまとめて具体的な解決案や選択肢を作成する専門家です。

議題: ${roomTitle}

以下は、ユーザーから寄せられた意見の一覧です：

${entries.map((entry, index) => `${index + 1}. ${entry}`).join("\n")}

---

【あなたの役割】
これらの意見を分析し、それらを網羅する具体的な解決案や選択肢を正確に5つ作成してください。

【要件】
1. 各選択肢は、具体的で実行可能な内容にしてください
2. できるだけ多様な意見を反映するようにしてください
3. 似た意見は1つの選択肢にまとめてください
4. 各選択肢には、どの意見が反映されているか、なぜその選択肢が重要かを説明してください
5. 投票者が納得できるよう、論理的で分かりやすい説明を心がけてください

【出力形式】
必ず5つの選択肢を作成してください。
各選択肢には、関連する意見のインデックス（1始まりではなく0始まり）を含めてください。
`;

  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-pro"),
      schema: pollOptionsSchema,
      prompt,
      temperature: 0.7,
    });

    return object;
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error("意見の分析に失敗しました。もう一度お試しください。");
  }
}
