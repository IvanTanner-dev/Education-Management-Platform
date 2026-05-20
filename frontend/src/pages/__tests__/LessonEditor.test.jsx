import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LessonEditor from "../LessonEditor";
import { BrowserRouter } from "react-router-dom";
import api from "../../api";

// Mock API
vi.mock("../../api");

// Mock useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ courseId: "1" }),
  };
});

const mockCourseWithLessons = {
  data: {
    id: 1,
    title: "Test Course",
    lessons: [
      { id: 10, title: "Lesson 1", content: "Content 1", order: 1 },
      { id: 11, title: "Lesson 2", content: "Content 2", order: 2 },
    ],
  },
};

describe("LessonEditor Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(mockCourseWithLessons);
  });

  it("loads and displays existing lessons", async () => {
    render(
      <BrowserRouter>
        <LessonEditor />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Lesson 2/i)).toBeInTheDocument();
    });
  });

  it("adds a new lesson successfully", async () => {
    const newLesson = { id: 12, title: "New Lesson", content: "New Content", order: 3 };
    api.post.mockResolvedValue({ data: newLesson });

    render(
      <BrowserRouter>
        <LessonEditor />
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Lesson Title/i), {
      target: { value: "New Lesson" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Lesson Text Content/i), {
      target: { value: "New Content" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Add Lesson/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/lessons/", {
        course: 1,
        title: "New Lesson",
        content: "New Content",
        order: 3,
      });
      expect(screen.getByText(/New Lesson/i)).toBeInTheDocument();
    });
  });

  it("deletes a lesson after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    api.delete.mockResolvedValue({});

    render(
      <BrowserRouter>
        <LessonEditor />
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument());

    const deleteButtons = screen.getAllByLabelText(/Delete lesson/i);
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/Lesson 1/i)).not.toBeInTheDocument();
    });
    expect(api.delete).toHaveBeenCalledWith("/api/lessons/10/");

    confirmSpy.mockRestore();
  });
});
