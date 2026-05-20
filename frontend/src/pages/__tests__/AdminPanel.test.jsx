import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPanel from "../AdminPanel";
import { BrowserRouter } from "react-router-dom";
import api from "../../api";

// Mock the API module
vi.mock("../../api");

const mockUsers = [
  {
    id: 1,
    username: "testuser",
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    role: "student",
  },
  {
    id: 2,
    username: "teacher1",
    first_name: "Teacher",
    last_name: "One",
    email: "teacher@example.com",
    role: "teacher",
  },
];

describe("AdminPanel Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockUsers });
  });

  it("renders user list correctly", async () => {
    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      expect(screen.getByText(/Teacher One/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/@testuser/i)).toBeInTheDocument();
    expect(screen.getByText(/@teacher1/i)).toBeInTheDocument();
  });

  it("filters users by search term", async () => {
    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /Search by name or username.../i,
    );
    fireEvent.change(searchInput, { target: { value: "teacher" } });

    expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Teacher One/i)).toBeInTheDocument();
  });

  it("filters users by role", async () => {
    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    const teacherFilterBtn = screen.getByRole("button", { name: /^teacher$/i });
    fireEvent.click(teacherFilterBtn);

    expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Teacher One/i)).toBeInTheDocument();
  });

  it("opens edit modal with user data", async () => {
    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    // Click the edit button (pencil icon) for the first user
    const editButtons = screen.getAllByTitle(/Edit User/i);
    fireEvent.click(editButtons[0]);

    // Check if modal is open and contains user data
    expect(screen.getByText(/Edit User: @testuser/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    expect(screen.getByDisplayValue("User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("updates user data successfully", async () => {
    const updatedUser = {
      ...mockUsers[0],
      first_name: "Updated",
      last_name: "Name",
    };
    api.patch.mockResolvedValue({ data: updatedUser });

    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/Edit User/i);
    fireEvent.click(editButtons[0]);

    const firstNameInput = screen.getByLabelText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: "Updated" } });

    const lastNameInput = screen.getByLabelText(/Last Name/i);
    fireEvent.change(lastNameInput, { target: { value: "Name" } });

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Updated Name/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/Edit User: @testuser/i),
      ).not.toBeInTheDocument();
    });

    expect(api.patch).toHaveBeenCalledWith(
      "/api/admin/users/1/",
      expect.objectContaining({
        first_name: "Updated",
        last_name: "Name",
      }),
    );
  });

  it("removes a user after confirmation", async () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    api.delete.mockResolvedValue({});

    render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle(/Remove User/i);
    fireEvent.click(removeButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();
    });
    expect(api.delete).toHaveBeenCalledWith("/api/admin/users/1/");

    confirmSpy.mockRestore();
  });
});
