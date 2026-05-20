import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Register from "../components/Register";
import { BrowserRouter } from "react-router-dom";
import api from "../api";

// Mock API
vi.mock("../api");

describe("Register Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders register form correctly", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Create Account/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  it("submits the form and calls api.post", async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "johndoe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/register/", {
        first_name: "John",
        last_name: "Doe",
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
      });
      expect(alertSpy).toHaveBeenCalledWith(
        "Account created! Now you can sign in.",
      );
    });

    alertSpy.mockRestore();
  });

  it("displays error message on failed registration", async () => {
    api.post.mockRejectedValue({
      response: { data: { error: "Username already exists" } },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "johndoe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username already exists/i)).toBeInTheDocument();
    });
  });
});
