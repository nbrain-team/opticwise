"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActivityType = "call" | "meeting" | "task" | "deadline" | "email" | "lunch";
type ActivityStatus = "pending" | "done" | "cancelled";

type Activity = {
  id: string;
  subject: string;
  note: string | null;
  type: ActivityType;
  status: ActivityStatus;
  dueDate: string | null;
  dueTime: string | null;
  duration: number | null;
  assignedTo: string | null;
  createdBy: string | null;
  doneTime: string | null;
  markedAsDoneBy: string | null;
  createdAt: string;
  updatedAt: string;
};

interface ActivitiesTabProps {
  entityType: "deal" | "person" | "organization";
  entityId: string;
  activities: Activity[];
}

export function ActivitiesTab({ entityType, entityId, activities: initialActivities }: ActivitiesTabProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  // Form state
  const [formData, setFormData] = useState({
    subject: "",
    note: "",
    type: "task" as ActivityType,
    dueDate: "",
    dueTime: "",
    duration: "",
  });

  const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
    { value: "task", label: "Task", icon: "📋" },
    { value: "call", label: "Call", icon: "📞" },
    { value: "meeting", label: "Meeting", icon: "👥" },
    { value: "deadline", label: "Deadline", icon: "⏰" },
    { value: "email", label: "Email", icon: "📧" },
    { value: "lunch", label: "Lunch", icon: "🍽️" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formData.subject,
          note: formData.note || null,
          type: formData.type,
          dueDate: formData.dueDate || null,
          dueTime: formData.dueTime || null,
          duration: formData.duration ? parseInt(formData.duration) : null,
          [`${entityType}Id`]: entityId,
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities([newActivity, ...activities]);
        setFormData({ subject: "", note: "", type: "task", dueDate: "", dueTime: "", duration: "" });
        setIsAdding(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating activity:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDone = async (activityId: string, currentStatus: ActivityStatus) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedActivity = await response.json();
        setActivities(activities.map((a) => (a.id === activityId ? updatedActivity : a)));
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setActivities(activities.filter((a) => a.id !== activityId));
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.status === filter;
  });

  const pendingCount = activities.filter((a) => a.status === "pending").length;
  const doneCount = activities.filter((a) => a.status === "done").length;

  const getActivityIcon = (type: ActivityType) => {
    const typeInfo = activityTypes.find((t) => t.value === type);
    return typeInfo?.icon || "📋";
  };

  const isOverdue = (activity: Activity): boolean => {
    if (!activity.dueDate || activity.status === "done") return false;
    return new Date(activity.dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Stats and Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "all"
                ? "bg-[#3B6B8F] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({activities.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "pending"
                ? "bg-[#3B6B8F] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            To Do ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("done")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "done"
                ? "bg-[#3B6B8F] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Done ({doneCount})
          </button>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-md hover:bg-[#2E5570] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Activity
          </button>
        )}
      </div>

      {/* Add Activity Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Time</label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Additional details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !formData.subject.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-md hover:bg-[#2E5570] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Activity"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setFormData({ subject: "", note: "", type: "task", dueDate: "", dueTime: "", duration: "" });
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm">
            {filter === "all" ? "No activities yet." : `No ${filter} activities.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => {
            const overdue = isOverdue(activity);
            
            return (
              <div
                key={activity.id}
                className={`bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow ${
                  activity.status === "done" ? "opacity-60" : ""
                } ${overdue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleDone(activity.id, activity.status)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {activity.status === "done" ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" strokeWidth="2" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                          <span className={`text-sm font-medium ${activity.status === "done" ? "line-through text-gray-500" : "text-gray-900"}`}>
                            {activity.subject}
                          </span>
                        </div>

                        {activity.note && (
                          <p className="text-sm text-gray-600 mt-1">{activity.note}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          {activity.dueDate && (
                            <span className={overdue ? "text-red-600 font-medium" : ""}>
                              📅 {new Date(activity.dueDate).toLocaleDateString()}
                              {activity.dueTime && ` at ${activity.dueTime}`}
                            </span>
                          )}
                          {activity.duration && (
                            <span>⏱️ {activity.duration} min</span>
                          )}
                          {activity.status === "done" && activity.doneTime && (
                            <span className="text-green-600">
                              ✓ Completed {new Date(activity.doneTime).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                        title="Delete activity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
