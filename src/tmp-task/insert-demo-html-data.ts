import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import { html_pages } from "../db/schema";

// Test files data - fallback for when files can't be read
const testFiles = {
	"flash-2.5-high-reasoning": {
		title: "Akso医院6月表彰名单：黎深医师特刊",
		description:
			"在Akso医院的六月表彰名单中，我们荣幸地将最高荣誉授予心外科主任医师——黎深。",
		model: "flash 2.5 high reasoning",
	},
	"flash-2.5-low-reasoning": {
		title: "Akso医院6月表彰名单",
		description:
			"Flash 2.5 low reasoning model generated page for Li Shen character profile.",
		model: "flash 2.5 low reasoning",
	},
	"gpt-5-mini": {
		title: "Akso医院6月表彰名单",
		description:
			"GPT-5 mini model generated page for Li Shen character profile.",
		model: "gpt 5 mini",
	},
	"gpt-5-mini-retry": {
		title: "Akso医院6月表彰名单",
		description:
			"GPT-5 mini retry model generated page for Li Shen character profile.",
		model: "gpt 5 mini retry",
	},
	"qwen3-232b": {
		title: "Akso医院6月表彰名单",
		description:
			"Qwen3 232B model generated page for Li Shen character profile.",
		model: "qwen3 232b",
	},
	"sonnet-4": {
		title: "Akso医院6月表彰名单",
		description:
			"Claude Sonnet 4 model generated page for Li Shen character profile.",
		model: "sonnet 4",
	},
	"streaming-page-demo": {
		title: "Streaming Page Demo",
		description:
			"Streaming page demonstration for character profile generation.",
		model: "streaming demo",
	},
};

// Helper function to extract title from HTML
export function extractTitle(html: string): string {
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	return titleMatch ? titleMatch[1].trim() : "Untitled";
}

// Helper function to extract description from meta tag or first paragraph
export function extractDescription(html: string): string {
	const descMatch = html.match(
		/<meta[^>]*name=["']description["'][^>]*content=["\']([^"']+)["\'][^>]*>/i,
	);
	if (descMatch) return descMatch[1].trim();

	// Fallback: try to get first paragraph text
	const pMatch = html.match(/<p[^>]*>([^<]+)</i);
	return pMatch ? pMatch[1].trim().substring(0, 200) + "..." : "";
}

// List all pages in database
export async function listPages(c: Context<{ Bindings: CloudflareBindings }>) {
	if (!c.env.DB) {
		c.status(500);
		return c.json({ error: "DB binding missing" });
	}

	const db = drizzle(c.env.DB);
	const pages = await db.select().from(html_pages).all();

	return c.json({
		count: pages.length,
		pages: pages.map((page) => ({
			id: page.id,
			slug: page.slug,
			title: page.title,
			model: page.model,
			created_at: page.created_at,
			description: page.description?.substring(0, 100) + "...",
		})),
	});
}

// Clear all pages from database
export async function clearAllPages(
	c: Context<{ Bindings: CloudflareBindings }>,
) {
	if (!c.env.DB) {
		c.status(500);
		return c.json({ error: "DB binding missing" });
	}

	const db = drizzle(c.env.DB);
	await db.delete(html_pages);

	return c.json({ message: "All pages cleared from database" });
}

// Add single HTML page
export async function addHtmlPage(
	c: Context<{ Bindings: CloudflareBindings }>,
) {
	if (!c.env.DB) {
		c.status(500);
		return c.json({ error: "DB binding missing" });
	}

	try {
		const body = (await c.req.json()) as {
			slug: string;
			html: string;
			model?: string;
			prompt?: string;
		};

		if (!body.slug || !body.html) {
			c.status(400);
			return c.json({ error: "Missing required fields: slug and html" });
		}

		const db = drizzle(c.env.DB);
		const now = new Date().toISOString();

		const title = extractTitle(body.html);
		const description = extractDescription(body.html);
		const model = body.model || "unknown";
		const prompt = body.prompt || "Manually uploaded HTML content";

		// Check if slug already exists
		const existing = await db
			.select()
			.from(html_pages)
			.where(eq(html_pages.slug, body.slug))
			.get();

		if (existing) {
			// Update existing record
			await db
				.update(html_pages)
				.set({
					updated_at: now,
					prompt,
					model,
					title,
					description,
					html: body.html,
				})
				.where(eq(html_pages.slug, body.slug));

			return c.json({
				message: "HTML page updated successfully",
				slug: body.slug,
				title,
				action: "updated",
				model,
			});
		} else {
			// Insert new record
			await db.insert(html_pages).values({
				slug: body.slug,
				created_at: now,
				updated_at: now,
				prompt,
				model,
				title,
				description,
				html: body.html,
			});

			return c.json({
				message: "HTML page created successfully",
				slug: body.slug,
				title,
				action: "created",
				model,
			});
		}
	} catch (error) {
		console.error("Error adding HTML:", error);
		c.status(500);
		return c.json({
			error: "Failed to add HTML page",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Add test files to database by reading actual HTML files
export async function addTestFiles(
	c: Context<{ Bindings: CloudflareBindings }>,
) {
	if (!c.env.DB) {
		c.status(500);
		return c.json({ error: "DB binding missing" });
	}

	const db = drizzle(c.env.DB);

	try {
		const results = [];
		const now = new Date().toISOString();

		// Try to read files from the model-page-gen-test-results directory
		const testResultsDir = join(process.cwd(), "model-page-gen-test-results");

		let htmlFiles: string[];
		try {
			const files = await readdir(testResultsDir);
			htmlFiles = files.filter((file) => file.endsWith(".html"));
		} catch (_error) {
			// Fallback to embedded test data if we can't read files (production mode)
			console.warn(
				"Cannot read files in production mode, using embedded test data",
				_error,
			);
			for (const [slug, fileData] of Object.entries(testFiles)) {
				const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileData.title}</title>
    <meta name="description" content="${fileData.description}">
</head>
<body>
    <h1>${fileData.title}</h1>
    <p>${fileData.description}</p>
    <p>Generated by: ${fileData.model}</p>
    <p>This is a sample HTML page for testing the database insertion functionality.</p>
</body>
</html>`;

				await insertOrUpdatePage(
					db,
					slug,
					sampleHtml,
					fileData.model,
					now,
					fileData.title,
					fileData.description,
				);
				results.push({
					slug,
					title: fileData.title,
					action: "created/updated (sample)",
					model: fileData.model,
				});
			}

			return c.json({
				message: `Successfully processed ${results.length} sample test files`,
				results,
				note: "Used sample HTML data - files not accessible in production",
			});
		}

		// Process actual HTML files
		for (const filename of htmlFiles) {
			const filePath = join(testResultsDir, filename);
			const html = await readFile(filePath, "utf-8");

			const slug = filename
				.replace(/\.html$/, "")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-");
			const title = extractTitle(html);
			const description = extractDescription(html);
			const model = filename.replace(/\.html$/, "").replace(/-/g, " ");

			await insertOrUpdatePage(db, slug, html, model, now, title, description);

			results.push({
				filename,
				slug,
				title,
				action: "created/updated",
				model,
			});
		}

		return c.json({
			message: `Successfully processed ${results.length} HTML files`,
			results,
			note: "Read actual HTML files from model-page-gen-test-results directory",
		});
	} catch (error) {
		console.error("Error processing files:", error);
		c.status(500);
		return c.json({
			error: "Failed to process files",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Helper function to insert or update a page
async function insertOrUpdatePage(
	db: ReturnType<typeof drizzle>,
	slug: string,
	html: string,
	model: string,
	now: string,
	title: string,
	description: string,
) {
	// Check if slug already exists
	const existing = await db
		.select()
		.from(html_pages)
		.where(eq(html_pages.slug, slug))
		.get();

	if (existing) {
		// Update existing record
		await db
			.update(html_pages)
			.set({
				updated_at: now,
				prompt: "Test page generated by AI model",
				model,
				title,
				description,
				html,
			})
			.where(eq(html_pages.slug, slug));
	} else {
		// Insert new record
		await db.insert(html_pages).values({
			slug,
			created_at: now,
			updated_at: now,
			prompt: "Test page generated by AI model",
			model,
			title,
			description,
			html,
		});
	}
}
