import { describe, expect, it } from "vitest";
import { translate } from "./translations";

describe("site translations", () => {
  it("uses English as the default inquiry and keeps it first", () => {
    expect(translate("en", "inquiry.english")).toBe(
      "Can I have more information on this?",
    );
    expect(translate("en", "language.english")).toBe("English");
    expect(translate("en", "language.albanian")).toBe("Shqip");
  });

  it("uses the Albanian inquiry after the language is switched", () => {
    expect(translate("sq", "inquiry.albanian")).toBe(
      "Mund të më jepni më shumë informacion?",
    );
  });

  it("provides translated opening hours", () => {
    expect(translate("en", "footer.hours")).toContain("Mon–Sat");
    expect(translate("sq", "footer.hours")).toContain("Hën–Sht");
  });
});
