import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../Login";
import { BrowserRouter } from "react-router-dom";
import api from "../api";

// Mock the API module
vi.mock("../api", () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe("Login Component", () => {
  const setAuth = vi.fn();
  const setUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form correctly", () => {
    render(
      <BrowserRouter>
        <Login setAuth={setAuth} setUser={setUser} />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Sign In/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Login to LMS/i }),
    ).toBeInTheDocument();
  });

  it("submits the form and calls api.post", async () => {
    const mockResponse = {
      data: {
        access: "access-token",
        refresh: "refresh-token",
        user: { id: 1, username: "testuser" },
      },
    };
    api.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <Login setAuth={setAuth} setUser={setUser} />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Login to LMS/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/token/", {
        username: "testuser",
        password: "password123",
      });
      expect(setUser).toHaveBeenCalledWith(mockResponse.data.user);
      expect(setAuth).toHaveBeenCalledWith(true);
    });
  });

  it("displays error message on failed login", async () => {
    api.post.mockRejectedValue({
      response: { status: 401, data: { detail: "Unauthorized" } },
    });

    render(
      <BrowserRouter>
        <Login setAuth={setAuth} setUser={setUser} />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Login to LMS/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid username or password/i),
      ).toBeInTheDocument();
    });
  });
});
