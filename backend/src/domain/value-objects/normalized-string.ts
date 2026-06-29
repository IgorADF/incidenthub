import z from "zod";
export const NormalizedString = z
	.string()
	.min(3)
	.max(50)
	.transform((value) => {
		value = value
			.trim()
			.normalize("NFKD")
			.replace(/\p{M}/gu, "")
			.toLowerCase()
			.replace(/\s+/g, " ");

		return value;
	});
export type NormalizedString = z.infer<typeof NormalizedString>;
