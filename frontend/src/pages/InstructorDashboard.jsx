import React, { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import Analytics from "../components/Analytics";

const InstructorDashboard = ({ courses, setCourses, user }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourseAnalytics, setSelectedCourseAnalytics] = useState(null);

  // Edit Course State
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
  });

  // Add Student State
  const [addingStudentTo, setAddingStudentTo] = useState(null);
  const [studentUsername, setStudentUsername] = useState("");

  // Delete Course State
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [deleteConfirmationTitle, setDeleteConfirmationTitle] = useState("");

  // Filters the courses to show only yours
  const myCourses = courses.filter(
    (c) => c.teacher_username === user?.username,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/courses/", formData);
      setCourses([...courses, response.data]);
      setFormData({ title: "", description: "" });
      setShowForm(false);
      alert("Course created successfully!");
    } catch (error) {
      console.error("Error creating course:", error.response?.data);
      alert("Failed to create course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description,
    });
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(
        `/api/courses/${editingCourse.id}/`,
        editFormData,
      );
      setCourses(
        courses.map((c) => (c.id === editingCourse.id ? response.data : c)),
      );
      setEditingCourse(null);
      alert("Course updated!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update course.");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/courses/${addingStudentTo.id}/add_student/`, {
        username: studentUsername,
      });
      alert(`Student @${studentUsername} added to course!`);
      setStudentUsername("");
      setAddingStudentTo(null);
      // Optionally refresh courses to update student count
      const res = await api.get("/api/courses/");
      setCourses(res.data);
    } catch (error) {
      console.error("Add student failed:", error);
      alert(error.response?.data?.error || "Failed to add student.");
    }
  };

  const handleDeleteCourse = async (e) => {
    e.preventDefault();
    if (deleteConfirmationTitle !== deletingCourse.title) {
      alert("Course title does not match exactly.");
      return;
    }

    try {
      await api.delete(`/api/courses/${deletingCourse.id}/`);
      setCourses(courses.filter((c) => c.id !== deletingCourse.id));
      setDeletingCourse(null);
      setDeleteConfirmationTitle("");
      alert("Course deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete course. You may not have permission.");
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-0">
      {/* MODALS */}
      {editingCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-black text-slate-900">Edit Course</h2>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <input
                className="w-full p-3 border rounded-xl"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                placeholder="Course Title"
                required
              />
              <textarea
                className="w-full p-3 border rounded-xl h-32"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Course Description"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addingStudentTo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-black text-slate-900">
              Add Student to: {addingStudentTo.title}
            </h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input
                className="w-full p-3 border rounded-xl"
                value={studentUsername}
                onChange={(e) => setStudentUsername(e.target.value)}
                placeholder="Student Username"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddingStudentTo(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 text-red-700">
              <span className="text-2xl" role="img" aria-label="warning">
                ⚠️
              </span>
              <div>
                <h2 className="font-black">Dangerous Action</h2>
                <p className="text-xs font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-sm">
              To delete{" "}
              <span className="font-bold text-slate-900">
                "{deletingCourse.title}"
              </span>
              , please type the course title exactly below:
            </p>

            <form onSubmit={handleDeleteCourse} className="space-y-4">
              <input
                className="w-full p-3 border border-red-100 bg-red-50/30 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
                value={deleteConfirmationTitle}
                onChange={(e) => setDeleteConfirmationTitle(e.target.value)}
                placeholder="Type course title here..."
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingCourse(null);
                    setDeleteConfirmationTitle("");
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmationTitle !== deletingCourse.title}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all ${
                    deleteConfirmationTitle === deletingCourse.title
                      ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                      : "bg-red-300 cursor-not-allowed"
                  }`}
                >
                  Delete Permanently
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANALYTICS OVERLAY/VIEW */}
      {selectedCourseAnalytics && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Course Insights: {selectedCourseAnalytics.title}
              </h2>
              <p className="text-slate-500 font-medium">
                Deep dive into enrollment and performance metrics.
              </p>
            </div>
            <button
              onClick={() => setSelectedCourseAnalytics(null)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
            >
              ← Back to List
            </button>
          </div>

          {/* Reuse the Analytics component with only the selected course */}
          <Analytics courses={[selectedCourseAnalytics]} />
        </div>
      )}

      {!selectedCourseAnalytics && (
        <>
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-slate-500 text-sm md:base font-medium">
                Manage your content and track student engagement.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all text-sm md:text-base"
            >
              {showForm ? "Cancel" : "+ Create New Course"}
            </button>
          </div>

          {/* CREATION FORM */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <h2 className="text-xl font-bold text-slate-800">
                New Course Details
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Course Title (e.g., Advanced Calculus)"
                  required
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <textarea
                  placeholder="Course Description"
                  required
                  className="w-full p-3 border border-slate-200 rounded-lg h-32 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    isSubmitting
                      ? "bg-slate-400"
                      : "bg-slate-900 hover:bg-black"
                  }`}
                >
                  {isSubmitting ? "Creating..." : "Save and Publish"}
                </button>
              </div>
            </form>
          )}

          {/* COURSE LIST */}
          <div className="grid grid-cols-1 gap-4">
            {myCourses.length > 0 ? (
              myCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {course.students?.length || 0} Students Enrolled
                    </p>
                  </div>
                  <div className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-2">
                    <Link
                      to={`/instructor/course/${course.id}/lessons`}
                      className="flex-1 sm:flex-none text-center px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Lessons
                    </Link>
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setAddingStudentTo(course)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      + Student
                    </button>
                    <button
                      onClick={() => setSelectedCourseAnalytics(course)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => setDeletingCourse(course)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors col-span-2 sm:col-span-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">
                  You haven't created any courses yet.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InstructorDashboard;
