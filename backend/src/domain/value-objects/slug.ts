import z from "zod";

export const Slug = z
	.string()
	.min(1)
	.max(50)
	.trim()
	.transform((val) => val.replace(/^\//, "")) // strip leading slash if present
	.pipe(
		z
			.string()
			.min(1, "Slug cannot be empty")
			.regex(
				/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
				"Slug must be lowercase alphanumeric, words separated by single hyphens",
			),
	);

export type Slug = z.infer<typeof Slug>;
