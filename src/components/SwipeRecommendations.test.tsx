import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SwipeRecommendations from "./SwipeRecommendations";

vi.mock("@/hooks/useReadingHistory", () => ({
  useReadingHistory: () => ({ getRecentlyRead: () => [] }),
}));

const swipeLeft = (element: Element, from: number, to: number) => {
  fireEvent.touchStart(element, { touches: [{ clientX: from, clientY: 200 }] });
  fireEvent.touchEnd(element, { changedTouches: [{ clientX: to, clientY: 200 }] });
};

describe("mobile swipe previews", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 507 });
  });
  afterEach(cleanup);

  it("opens recommendations on the first left swipe", () => {
    render(<MemoryRouter><SwipeRecommendations /></MemoryRouter>);
    swipeLeft(document.body, 500, 350);
    expect(screen.getByRole("dialog", { name: "Recommendations" })).toBeInTheDocument();
  });

  it("replaces recommendations with settings on the second left swipe", () => {
    render(<MemoryRouter><SwipeRecommendations /></MemoryRouter>);
    swipeLeft(document.body, 500, 350);
    swipeLeft(screen.getByRole("dialog", { name: "Recommendations" }), 420, 240);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Recommendations" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Scroll" }));
    expect(localStorage.getItem("yuvience-reader-mode")).toBe("vertical");
    fireEvent.click(screen.getByRole("switch", { name: "Show spoilers" }));
    expect(localStorage.getItem("yuvience-reveal-spoilers")).toBe("1");
  });
});