import React, { useState, useEffect } from "react";
import api from "./api";
import Register from "./components/Register";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./Login";
import MyCourses from "./pages/MyCourses";
import Sidebar from "./components/Sidebar";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminPanel from "./pages/AdminPanel";
import LessonEditor from "./pages/LessonEditor";

function App() {
  const [courses, setCourses] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("access_token");
    return !!token && token !== "undefined";
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user_info");
      if (!savedUser || savedUser === "undefined") return null;
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCourses([]);
    setIsLoggedIn(false);
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/api/courses/${courseId}/enroll/`);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, is_enrolled: true } : c)),
      );
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        console.error("Enroll failed:", error);
      }
    }
  };

  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Student Dashboard";
    if (path === "/my-courses") return "My Learning";
    if (path === "/admin") return "Admin Panel";
    if (path.startsWith("/instructor")) return "Instructor Portal";
    if (path.startsWith("/course/")) return "Course View";
    return "Dashboard";
  };

  // Synchronization: Keep local course state in sync with the backend database.
  useEffect(() => {
    const fetchCourses = async () => {
      if (!isLoggedIn) return;
      try {
        const response = await api.get("/api/courses/");
        setCourses(response.data);
      } catch (error) {
        if (error.response?.status === 401) handleLogout();
      }
    };
    fetchCourses();
  }, [isLoggedIn]);

  // Conditional Layout: Redirect unauthenticated users to the identity gateway.
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Login setAuth={setIsLoggedIn} setUser={setUser} />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Protected Shell: Render the core application layout once session is verified.
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation: Global drawer for role-specific routes and course list. */}
      <nav aria-label="Main Navigation">
        <Sidebar
          handleLogout={handleLogout}
          courses={courses}
          user={user}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      </nav>

      {/* Workspace: Flexible area for rendering route-specific pages. */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-200">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <span className="text-xl">☰</span>
            </button>
            <h2 className="text-lg font-medium">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-gray-500 font-medium">
              {user?.first_name
                ? `${user.first_name} ${user.last_name ? user.last_name[0] + "." : ""}`
                : user?.username}
            </span>
            <div
              className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-sm font-bold"
              role="img"
              aria-label="User Avatar"
            >
              {user?.first_name
                ? (
                    user.first_name[0] +
                    (user.last_name ? user.last_name[0] : "")
                  ).toUpperCase()
                : (user?.username ? user.username[0] : "U").toUpperCase()}
            </div>
          </div>
        </header>

        <main id="main-content" className="p-10 min-h-[calc(100vh-64px)]">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  courses={courses}
                  onEnroll={handleEnroll}
                  studentName={user?.first_name}
                />
              }
            />
            <Route
              path="/my-courses"
              element={
                <MyCourses courses={courses} studentName={user?.first_name} />
              }
            />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route
              path="/instructor"
              element={
                <InstructorDashboard
                  courses={courses}
                  setCourses={setCourses}
                  user={user}
                />
              }
            />
            <Route
              path="/instructor/course/:courseId/lessons"
              element={<LessonEditor />}
            />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
