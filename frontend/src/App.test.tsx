// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
it("keeps an unfinished officer note when switching languages", async () => {
  const record = {
    id: 1,
    reference: "INC-0001",
    applicant: "Sample Person",
    district: "Chennai",
    address: "Sample Street",
    occupation: "Salaried",
    submitted: "2026-10-01",
    status: "pending",
    annual_income: 120000,
    attention: [],
    revision: 0,
    age: 29,
    overdue: true,
    required_documents: [],
    documents: [],
    ai_review: null,
    decision: null,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.endsWith("/auth/me") ? { username: "officer" } : record,
    })),
  );
  render(
    <MemoryRouter initialEntries={["/applications/1"]}>
      <App />
    </MemoryRouter>,
  );
  const note = await screen.findByLabelText("Decision reason");
  fireEvent.change(note, { target: { value: "Please provide proof" } });
  fireEvent.click(screen.getByRole("button", { name: "தமிழ்" }));
  await waitFor(() =>
    expect(
      (screen.getByLabelText("முடிவிற்கான காரணம்") as HTMLTextAreaElement)
        .value,
    ).toBe("Please provide proof"),
  );
  vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("link", { name: "முடிவு வரலாறு" }));
  expect(screen.getByLabelText("முடிவிற்கான காரணம்")).toBeTruthy();
});
