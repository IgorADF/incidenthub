import { describe, expect, it } from "vitest";
import { UUIDv7 } from "./uuidv7";

describe("UUIDv7 value object", () => {
	it("should parse a valid UUIDv7 string", () => {
		const valid = "019edb8c-3928-72e5-9510-6a5926ffef9e";

		expect(UUIDv7.parse(valid)).toBe(valid);
	});

	it("should reject a non-UUID string", () => {
		expect(UUIDv7.safeParse("not-a-uuid").success).toBe(false);
	});

	it("should reject a UUIDv4 string", () => {
		const uuidv4 = "550e8400-e29b-41d4-a716-446655440000";

		expect(UUIDv7.safeParse(uuidv4).success).toBe(false);
	});
});
