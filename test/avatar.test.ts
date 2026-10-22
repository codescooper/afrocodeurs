// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar } from "../components/shared/avatar";

afterEach(cleanup);
describe("member avatars", () => {
  it("renders an actual image with fixed dimensions", () => {
    const { container } = render(createElement(Avatar, { name: "Awa Diop", image: "/uploads/avatar.png", size: 40 }));
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/uploads/avatar.png");
    expect(container.firstElementChild?.getAttribute("style")).toContain("width: 40px");
  });
  it("keeps contrasting initials when the photo fails and retries a new source", () => {
    const view = render(createElement(Avatar, { name: "Awa Diop", image: "/missing.png" }));
    fireEvent.error(view.container.querySelector("img")!);
    expect(view.container.querySelector("img")).toBeNull();
    expect(view.getByRole("img", { name: "Awa Diop" }).textContent).toBe("AD");
    expect(view.container.firstElementChild?.className).toContain("text-primary");
    view.rerender(createElement(Avatar, { name: "Awa Diop", image: "/new.png" }));
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe("/new.png");
  });
  it("supports missing photos and data URLs", () => {
    const view = render(createElement(Avatar, { name: "Salon Communautaire" }));
    expect(view.container.textContent).toBe("SC");
    const image = "data:image/png;base64,AAAA";
    view.rerender(createElement(Avatar, { name: "Salon Communautaire", image }));
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe(image);
  });
});
