// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
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
  const router = createMemoryRouter([{ path: "*", element: <App /> }], {
    initialEntries: ["/", "/applications/1"],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
  const note = await screen.findByLabelText("Decision reason");
  fireEvent.change(note, { target: { value: "Please provide proof" } });
  fireEvent.click(screen.getByRole("button", { name: "தமிழ்" }));
  await waitFor(() =>
    expect(
      (screen.getByLabelText("முடிவிற்கான காரணம்") as HTMLTextAreaElement)
        .value,
    ).toBe("Please provide proof"),
  );
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("link", { name: "முடிவு வரலாறு" }));
  expect(screen.getByLabelText("முடிவிற்கான காரணம்")).toBeTruthy();
  await router.navigate(-1);
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText("முடிவிற்கான காரணம்")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "வெளியேறு" }));
  expect(confirm).toHaveBeenCalledTimes(3);
  await waitFor(() =>
    expect(screen.getByLabelText("முடிவிற்கான காரணம்")).toBeTruthy(),
  );
});
