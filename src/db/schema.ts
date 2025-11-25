import * as s from "drizzle-orm/sqlite-core";

export const html_pages = s.sqliteTable(
	"html_pages",
	{
		id: s.integer("id").primaryKey({ autoIncrement: true }),
		slug: s.text("slug").notNull().unique(),
		created_at: s.text("created_at").notNull(),
		updated_at: s.text("updated_at").notNull(),
		prompt: s.text("prompt").notNull(),
		model: s.text("model").notNull(),
		title: s.text("title").notNull(),
		description: s.text("description"),
		html: s.text("html"),
	},
	(t) => [s.index("idx_html_pages_slug").on(t.slug)],
);
