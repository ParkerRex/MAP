import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ActionStatusMessage } from "./action-status";

describe("ActionStatusMessage", () => {
  it("renders semantic output with success palette", () => {
    const html = renderToStaticMarkup(
      <ActionStatusMessage status={{ kind: "success", message: "Saved" }} />,
    );

    expect(html).toContain("<output");
    expect(html).toContain("Saved");
    expect(html).toContain("text-emerald-700");
  });

  it("returns empty markup when status is null", () => {
    const html = renderToStaticMarkup(<ActionStatusMessage status={null} />);

    expect(html).toBe("");
  });

  it("uses error palette for failures", () => {
    const html = renderToStaticMarkup(
      <ActionStatusMessage status={{ kind: "error", message: "Failed" }} />,
    );

    expect(html).toContain("Failed");
    expect(html).toContain("text-rose-700");
  });
});
