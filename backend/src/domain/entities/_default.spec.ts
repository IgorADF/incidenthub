import { describe, it, expect } from "vitest";
import { DefaultEntity } from "./_default";
import { ValidationError } from "./errors/ValidationError";
import z from "zod";

const TestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  age: z.number().int().min(0).max(150),
  createdAt: z.date(),
});

type TestType = z.infer<typeof TestSchema>;

class TestEntity extends DefaultEntity<TestType> {
  static create(props: Omit<TestType, "id" | "createdAt">) {
    return TestEntity.fromProps({
      ...props,
      id: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: new Date(),
    });
  }

  static fromProps(props: TestType) {
    return new TestEntity(props, TestSchema);
  }
}

describe("DefaultEntity", () => {
  it("should create an entity with valid props", () => {
    const entity = TestEntity.create({ name: "John", age: 30 });

    expect(entity.getProps().name).toBe("John");
    expect(entity.getProps().age).toBe(30);
    expect(entity.getProps().id).toBeDefined();
    expect(entity.getProps().createdAt).toBeDefined();
  });

  it("should throw ValidationError when props are invalid", () => {
    expect(() =>
      TestEntity.fromProps({
        id: "not-a-uuid",
        name: "",
        age: -1,
        createdAt: new Date(),
      }),
    ).toThrow(ValidationError);
  });

  it("should expose structured validation issues", () => {
    try {
      TestEntity.fromProps({
        id: "not-a-uuid",
        name: "",
        age: -1,
        createdAt: new Date(),
      });
      expect.fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;

      expect(validationError.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "id", message: expect.any(String) }),
          expect.objectContaining({
            path: "name",
            message: expect.any(String),
          }),
          expect.objectContaining({ path: "age", message: expect.any(String) }),
        ]),
      );
    }
  });

  it("should include a human-readable message", () => {
    try {
      TestEntity.fromProps({
        id: "not-a-uuid",
        name: "",
        age: -1,
        createdAt: new Date(),
      });
    } catch (error) {
      const validationError = error as ValidationError;
      expect(validationError.message).toContain("id:");
      expect(validationError.message).toContain("name:");
      expect(validationError.message).toContain("age:");
    }
  });

  it("should mark root errors with (root) path", () => {
    const SchemaWithRootRefine = z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        createdAt: z.date(),
      })
      .refine(() => false, {
        message: "root level error",
      });

    class EntityWithRootRefine extends DefaultEntity<
      z.infer<typeof SchemaWithRootRefine>
    > {
      constructor(props: z.infer<typeof SchemaWithRootRefine>) {
        super(props, SchemaWithRootRefine);
      }
    }

    try {
      new EntityWithRootRefine({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John",
        createdAt: new Date(),
      });
    } catch (error) {
      const validationError = error as ValidationError;
      expect(validationError.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "(root)", message: "root level error" }),
        ]),
      );
    }
  });

  it("should freeze props so they cannot be mutated", () => {
    const entity = TestEntity.create({ name: "John", age: 30 });

    expect(() => {
      (entity.getProps() as Record<string, unknown>).name = "Jane";
    }).toThrow();
  });

  it("should expose props as readonly", () => {
    const entity = TestEntity.create({ name: "John", age: 30 });
    const props = entity.getProps();

    expect(props.name).toBe("John");
    expect(Object.isFrozen(props)).toBe(true);
  });
});
