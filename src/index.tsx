import { Scalar } from "@scalar/hono-api-reference";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import {
	describeRoute,
	openAPIRouteHandler,
	validator as zValidator,
} from "hono-openapi";
import slug from "slug";
import z from "zod";
import { generateWebpage } from "./application/generate-webpage";
import { html_pages } from "./db/schema";
import { renderer } from "./renderer";
import { db } from "./services/db";
import { llm_service } from "./services/llm";
import { tmpTaskApp } from "./tmp-task/tmp-task-app";

export const app = new Hono<{ Bindings: CloudflareBindings }>();

app
	.get("/health", (c) => c.text("OK"))
	.route("/tmp-task", tmpTaskApp)
	.use(renderer)
	.get(
		"/submit-demo",
		describeRoute({
			description: "测试用前端 - 提交一个页面生成请求",
		}),
		(c) => {
			return c.render(
				<>
					<head>
						<title>角色页面生成测试</title>
						<script src="https://cdn.tailwindcss.com"></script>
					</head>
					<body class="bg-gray-50 min-h-screen">
						<div class="container mx-auto px-4 py-8">
							<div class="max-w-2xl mx-auto">
								<h1 class="text-3xl font-bold text-center mb-8 text-gray-800">
									角色页面生成器
								</h1>
								<div class="bg-white rounded-lg shadow-md p-6">
									<form method="post" action="/submit-page-form" class="space-y-6">
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">
												角色名字
											</label>
											<input
												type="text"
												name="character_name"
												required
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="请输入角色名字"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">
												角色设定
											</label>
											<textarea
												name="character_setting"
												required
												rows={4}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="请详细描述角色的背景、性格、能力等设定"
											></textarea>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">
												网页标题
											</label>
											<input
												type="text"
												name="webpage_title"
												required
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="请输入网页标题"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">
												角色转发网页时的评论
											</label>
											<textarea
												name="character_comment"
												required
												rows={3}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="请输入角色转发这个网页时会说的话或评论"
											></textarea>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">
												语言模型
											</label>
											<select
												name="model"
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												{llm_service.model_list.map((model) => (
													<option value={model} key={model}>
														{model}
													</option>
												))}
											</select>
										</div>

										<div class="text-center">
											<button
												type="submit"
												class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
											>
												生成角色页面
											</button>
										</div>
									</form>
								</div>
							</div>
						</div>
					</body>
				</>,
			);
		},
	)
	.get(
		"/",
		describeRoute({
			description: "首页 - 显示页面生成工具",
		}),
		(c) => {
			return c.render(
				<>
					<head>
						<title>Pagen - AI 页面生成器</title>
						<script src="https://cdn.tailwindcss.com"></script>
					</head>
					<body class="bg-gray-50 min-h-screen">
						<div class="container mx-auto px-4 py-8">
							<div class="max-w-2xl mx-auto">
								<h1 class="text-4xl font-bold text-center mb-8 text-gray-800">
									Pagen - AI 页面生成器
								</h1>
								<div class="bg-white rounded-lg shadow-md p-6">
									<p class="text-gray-600 mb-6 text-center">
										使用 AI 技术快速生成个性化的网页内容
									</p>
									<div class="text-center">
										<a
											href="/submit-demo"
											class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
										>
											开始生成页面
										</a>
									</div>
								</div>
							</div>
						</div>
					</body>
				</>,
			);
		},
	)
	.get(
		"/gen/:id",
		describeRoute({
			description: "根据 ID 动态生成和提供网页",
		}),
		async (c) => {
			const id = c.req.param("id");
			console.log("Generating page for ID:", id);

			if (!c.env.DB) {
				c.status(500);
				return c.text("DB binding missing");
			}

			const db = drizzle(c.env.DB);

			const page = await db
				.select()
				.from(html_pages)
				.where(eq(html_pages.id, parseInt(id)))
				.get();

			console.log("got page", !!page);

			if (!page) {
				return c.notFound();
			} else if (!page.html) {
				// should generate

				// stream html
				c.header("Content-Type", "text/html; charset=utf-8");
				c.header("Content-Encoding", "Identity");
				return stream(c, async (s) => {
					let raw_res = "";
					let html = "";
					let sent_text_index = 0;
					const md_wrapper_start = "```html";
					console.log("Generating page for ID:", id);
					for await (const chunk of generateWebpage({
						prompt: page.prompt,
						model: page.model || "deepseek-v3",
					}).textStream) {
						raw_res += chunk;
						// send only new text
						if (raw_res.startsWith(md_wrapper_start)) {
							html = raw_res.slice(md_wrapper_start.length);
						} else {
							html = raw_res;
						}
						if (html.endsWith("```")) {
							html = html.slice(0, -3);
						}
						await s.write(html.slice(sent_text_index));
						sent_text_index = html.length;
					}

					// save generated html
					await db
						.update(html_pages)
						.set({ html })
						.where(eq(html_pages.id, page.id));
					console.log("Finished generating page for ID:", id);
				});
			} else {
				return c.html(page.html);
			}
		},
	)
	.post(
		"/submit-page",
		describeRoute({
			description:
				"通过 JSON 提交一个页面生成请求，返回页面的 ID，页面不会立即生成，需要访问 /gen/:id 才会生成",
		}),
		zValidator(
			"json",
			z.object({
				character_name: z.string().min(1),
				character_setting: z.string().min(1),
				webpage_title: z.string().min(1),
				character_comment: z.string().min(1),
				model: z.enum(llm_service.model_list).default("deepseek-v3"),
			}),
		),
		async (c) => {
			const { character_name, character_setting, webpage_title, character_comment, model } = c.req.valid("json");

			// 组合 prompt
			const prompt = `角色名字：${character_name}

角色设定：${character_setting}

网页标题：${webpage_title}

角色转发网页时的评论：${character_comment}

请根据以上信息生成一个关于"${character_name}"的角色页面。`;

			const d = await await db
				.insert(html_pages)
				.values({
					slug: `${slug(character_name)}----${randomBytes(3).toString("hex")}`,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					title: webpage_title,
					description: `关于角色 ${character_name} 的页面`,
					prompt,
					model,
				})
				.returning();
			return c.json({
				message: "Page submission successful",
				id: d[0].id,
				url: `/gen/${d[0].id}`
			});
		},
	)
	.post(
		"/submit-page-form",
		describeRoute({
			description:
				"仅前端测试用，通过表单提交一个页面生成请求，会直接跳转到 /gen/:id 并且触发生成",
		}),
		zValidator(
			"form",
			z.object({
				character_name: z.string().min(1),
				character_setting: z.string().min(1),
				webpage_title: z.string().min(1),
				character_comment: z.string().min(1),
				model: z.enum(llm_service.model_list).default("deepseek-v3"),
			}),
		),
		async (c) => {
			const { character_name, character_setting, webpage_title, character_comment, model } = c.req.valid("form");
			console.log("Form submission received:", {
				character_name,
				character_setting,
				webpage_title,
				character_comment,
				model,
			});

			// 组合 prompt
			const prompt = `
			请根据我所提供的角色信息以及明确的网页标题，精心打造出与之高度契合的网页。在创作过程中，务必仔细研读角色设定，确保网页内容能够紧密结合该角色所处的世界观，但要完全围绕网页标题，不能刻意使用太多角色信息
			
			角色名字：${character_name}

			角色设定：${character_setting}

			网页标题：${webpage_title}

			注意，：${character_name}转发了这个网页并评论：“${character_comment}”，设计网页时可以考虑这条评价并巧妙的融入其中，但网页中不要直接暴露这条转发评论，仅作参考
			`;

			const d = await await db
				.insert(html_pages)
				.values({
					slug: `${slug(character_name)}----${randomBytes(3).toString("hex")}`,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					title: webpage_title,
					description: `关于角色 ${character_name} 的页面`,
					prompt,
					model,
				})
				.returning();
			const new_id = d[0].id;
			return c.redirect(`/gen/${new_id}`, 302);
		},
	)
	.get(
		"/openapi.json",
		openAPIRouteHandler(app, {
			documentation: {
				info: {
					title: "Hono",
					version: "1.0.0",
					description: "API for greeting users",
				},
			},
		}),
	)
	.get(
		"/docs",
		Scalar({
			theme: "saturn",
			url: "/openapi.json",
		}),
	);

export default app;
