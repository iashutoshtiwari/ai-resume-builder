import { describe, expect, it } from "vitest";
import { ResumePresentationSchema } from "@/features/presentation/schema";

describe("ResumePresentationSchema", () => {
  it("allows only paper size and section order/visibility", () => {
    expect(ResumePresentationSchema.parse({ paperSize: "letter", sections: ["experience"] })).toEqual({
      paperSize: "letter",
      sections: ["experience"],
    });
    expect(() => ResumePresentationSchema.parse({
      paperSize: "letter",
      sections: ["experience"],
      fontFamily: "lato",
    })).toThrow();
  });

  it("rejects duplicate sections and unsupported paper sizes", () => {
    expect(() => ResumePresentationSchema.parse({ paperSize: "legal", sections: ["experience"] })).toThrow();
    expect(() => ResumePresentationSchema.parse({ paperSize: "a4", sections: ["skills", "skills"] })).toThrow();
  });
});
