
export const diffInDays = (item:any) => {
  const today = new Date();
  const dueDate = new Date(item.dueDate);

  // Difference in milliseconds
  const diffInMs = today.getTime() - dueDate.getTime();

  // Convert to days: ms / (1000ms * 60s * 60m * 24h)
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

export const diffInDaysAccountPage = (item:any) => {
  const today = new Date();
  const dueDate = new Date(item.due_date);

  // Difference in milliseconds
  const diffInMs = dueDate.getTime() - today.getTime()

  // Convert to days: ms / (1000ms * 60s * 60m * 24h)
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}