export const taskExportColumns = [
  { label: "Task", value: (task) => task.title },
  { label: "Description", value: (task) => task.description },
  {
    label: "Assigned To",
    value: (task) =>
      task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : "Unassigned",
  },
  { label: "Priority", value: (task) => task.priority },
  { label: "Status", value: (task) => task.status },
  { label: "Start Date", value: (task) => task.startDate?.split("T")[0] ?? "" },
  { label: "Due Date", value: (task) => task.dueDate?.split("T")[0] ?? "" },
];
