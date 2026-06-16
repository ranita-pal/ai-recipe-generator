import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { ingredients = [] } = ctx.args;

  const prompt = `Suggest a detailed recipe using these ingredients: ${ingredients.join(
    ", "
  )}. Include a recipe name, ingredients, and step-by-step instructions.`;

  return {
    resourcePath:
      "/model/us.anthropic.claude-haiku-4-5-20251001-v1:0/invoke",
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const parsedBody = JSON.parse(ctx.result.body);

  if (parsedBody.error || parsedBody.message) {
    return util.error(
      parsedBody.message || JSON.stringify(parsedBody),
      parsedBody.error?.type || parsedBody.__type || "BedrockError"
    );
  }

  const textBlock = parsedBody.content?.find(
    (item) => item.type === "text"
  );

  if (!textBlock?.text) {
    return util.error(
      `Unexpected Bedrock response: ${JSON.stringify(parsedBody)}`,
      "UnexpectedBedrockResponse"
    );
  }

  return {
    body: textBlock.text,
  };
}