import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const VOLCANO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const VOLCANO_API_KEY = "b6e2ba07-8adf-41b2-b818-bf7181b5c13c";

// 火山云模型端点映射
const MODEL_ENDPOINTS: Record<string, string> = {
	"deepseek-v3": "ep-20250407151147-z8dqb",
	"seed1.6": "ep-20250618140439-2qzbx",
};

const openai = createOpenAI({
	apiKey: VOLCANO_API_KEY,
	baseURL: VOLCANO_BASE_URL,
});

// 创建模型实例的函数
function createModel(modelName: string): LanguageModel {
	const endpoint = MODEL_ENDPOINTS[modelName];
	if (!endpoint) {
		throw new Error(`Unknown model: ${modelName}`);
	}
	return openai(endpoint);
}

export const llm_service = {
	model_list: ["deepseek-v3", "seed1.6"],
	createModel,
	// 保持向后兼容，使用 openrouter 作为别名
	openrouter: createModel,
};
