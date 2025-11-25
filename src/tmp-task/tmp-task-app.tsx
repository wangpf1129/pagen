import { Hono } from "hono";
import {
	addHtmlPage,
	addTestFiles,
	clearAllPages,
	listPages,
} from "./insert-demo-html-data";

export const tmpTaskApp = new Hono<{ Bindings: CloudflareBindings }>();

tmpTaskApp
	.get("/", (c) => {
		return c.json({
			message: "Temporary task endpoint - Import HTML files to database",
			available_endpoints: [
				"GET / - This help message",
				"POST /add-html - Add single HTML page (requires: {slug, html, model?, prompt?})",
				"POST /add-test-files - Import sample test files with embedded data",
				"GET /list - List all pages in database",
				"DELETE /clear - Clear all pages from database",
			],
			usage_examples: {
				add_single_html: {
					method: "POST",
					url: "/tmp-task/add-html",
					body: {
						slug: "my-page",
						html: "<html>...</html>",
						model: "gpt-4",
						prompt: "Generate a test page",
					},
				},
			},
		});
	})
	.get("/list", listPages)
	.delete("/clear", clearAllPages)
	.post("/add-html", addHtmlPage)
	.post("/add-test-files", addTestFiles);
