import React from "react";

const SyllabusSidebar = ({ lessons, selectedLesson, onSelectLesson }) => {
  // Calculate progress locally for the sidebar's mini-progress bar
  const completedCount = lessons.filter((l) => l.is_completed).length;
  const progress =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full overflow-y-auto p-4">
      <h2 className="font-bold text-slate-800 mb-4 text-lg">Course Content</h2>

      {/* Mini Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500 font-medium">Your Progress</span>
          <span className="text-blue-600 font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => onSelectLesson(lesson)}
            className={`w-full text-left p-3 rounded-xl transition-all border ${
              selectedLesson?.id === lesson.id
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-transparent hover:bg-slate-50 text-slate-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${lesson.is_completed ? "bg-green-500" : "bg-slate-300"}`}
              />
              <span className="text-sm font-medium leading-tight">
                {lesson.title}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SyllabusSidebar;
