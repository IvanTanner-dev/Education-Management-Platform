import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InstructorDashboard from "../../pages/InstructorDashboard";
import { BrowserRouter } from "react-router-dom";
import api from "../../api";

// Mock the API module
vi.mock("../../api");

const mockCourses = [
  {
    id: 1,
    title: "My Course",
    description: "Description",
    teacher_username: "teacher_ivan",
    students: [1, 2],
  },
  {
    id: 2,
    title: "Other Course",
    description: "Other Desc",
    teacher_username: "other_teacher",
    students: [],
  },
];

describe("InstructorDashboard Page", () => {
  const setCourses = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders only courses belonging to the instructor", () => {
    const mockUser = { username: "teacher_ivan" };
    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText(/My Course/i)).toBeInTheDocument();
    expect(screen.queryByText(/Other Course/i)).not.toBeInTheDocument();
    expect(screen.getByText(/2 Students Enrolled/i)).toBeInTheDocument();
  });

  it("shows the creation form when clicking 'Create New Course'", () => {
    const mockUser = { username: "teacher_ivan" };
    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    const createBtn = screen.getByRole("button", {
      name: /\+ Create New Course/i,
    });
    fireEvent.click(createBtn);

    expect(screen.getByPlaceholderText(/Course Title/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Course Description/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save and Publish/i }),
    ).toBeInTheDocument();
  });

  it("creates a new course successfully", async () => {
    const mockUser = { username: "teacher_ivan" };
    const newCourse = {
      id: 3,
      title: "New Physics Course",
      description: "Physics is fun",
      teacher_username: "teacher_ivan",
    };
    api.post.mockResolvedValue({ data: newCourse });
    // Mock window.alert
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /\+ Create New Course/i }),
    );

    fireEvent.change(screen.getByPlaceholderText(/Course Title/i), {
      target: { value: "New Physics Course" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Course Description/i), {
      target: { value: "Physics is fun" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save and Publish/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/courses/", {
        title: "New Physics Course",
        description: "Physics is fun",
      });
      expect(setCourses).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith("Course created successfully!");
    });

    alertSpy.mockRestore();
  });

  it("updates a course successfully", async () => {
    const mockUser = { username: "teacher_ivan" };
    const updatedCourse = {
      ...mockCourses[0],
      title: "Updated Title",
    };
    api.patch.mockResolvedValue({ data: updatedCourse });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Edit$/i }));

    fireEvent.change(screen.getByPlaceholderText(/Course Title/i), {
      target: { value: "Updated Title" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Save$/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/api/courses/1/", {
        title: "Updated Title",
        description: "Description",
      });
      expect(alertSpy).toHaveBeenCalledWith("Course updated!");
    });

    alertSpy.mockRestore();
  });

  it("adds a student to a course successfully", async () => {
    const mockUser = { username: "teacher_ivan" };
    api.post.mockResolvedValue({ data: { status: "student added" } });
    api.get.mockResolvedValue({ data: mockCourses });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^\+ Student$/i }));

    fireEvent.change(screen.getByPlaceholderText(/Student Username/i), {
      target: { value: "new_student" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Add Student$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/courses/1/add_student/", {
        username: "new_student",
      });
      expect(alertSpy).toHaveBeenCalledWith(
        "Student @new_student added to course!",
      );
    });

    alertSpy.mockRestore();
  });

  it("toggles analytics view for a specific course", () => {
    const mockUser = { username: "teacher_ivan" };
    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    const analyticsBtn = screen.getByRole("button", { name: /Analytics/i });
    fireEvent.click(analyticsBtn);

    expect(screen.getByText(/Course Insights: My Course/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to List/i)).toBeInTheDocument();

    // Go back
    fireEvent.click(screen.getByText(/Back to List/i));
    expect(
      screen.queryByText(/Course Insights: My Course/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/My Course/i)).toBeInTheDocument();
  });

  it("requires exact course title for deletion", async () => {
    const mockUser = { username: "teacher_ivan" };
    api.delete.mockResolvedValue({});

    render(
      <BrowserRouter>
        <InstructorDashboard
          courses={mockCourses}
          setCourses={setCourses}
          user={mockUser}
        />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));

    expect(screen.getByText(/Dangerous Action/i)).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", {
      name: /Delete Permanently/i,
    });
    expect(deleteBtn).toBeDisabled();

    const input = screen.getByPlaceholderText(/Type course title here.../i);
    fireEvent.change(input, { target: { value: "Wrong Title" } });
    expect(deleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "My Course" } });
    expect(deleteBtn).not.toBeDisabled();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/courses/1/");
      expect(setCourses).toHaveBeenCalled();
    });
  });
});
