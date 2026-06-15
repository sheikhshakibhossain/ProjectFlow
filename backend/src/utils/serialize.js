export function serializeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    teamId: user.team_id || undefined,
    bio: user.bio || '',
  };
}

export function serializeProject(project) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    teamId: project.team_id,
    course: project.course,
    deadline: project.deadline,
    progress: project.progress,
    createdBy: project.created_by,
    supervisorId: project.supervisor_id || undefined,
    sectionId: project.section_id || undefined,
  };
}

export function serializeSection(section) {
  return {
    id: section.id,
    name: section.name,
    createdBy: section.created_by || undefined,
    createdAt: section.created_at,
  };
}

export function serializeTask(task) {
  return {
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    description: task.description,
    status: task.status,
    assigneeId: task.assignee_id || undefined,
    deadline: task.deadline,
    priority: task.priority,
  };
}

export function serializeFeedback(feedback) {
  return {
    id: feedback.id,
    projectId: feedback.project_id,
    teacherId: feedback.teacher_id,
    rating: feedback.rating,
    comments: feedback.comments,
    date: feedback.date,
    highlights: feedback.highlights ? JSON.parse(feedback.highlights) : [],
  };
}

export function serializeNotification(notification) {
  return {
    id: notification.id,
    userId: notification.user_id,
    title: notification.title,
    message: notification.message,
    isRead: !!notification.is_read,
    date: notification.date,
    type: notification.type,
    relatedProjectId: notification.related_project_id || undefined,
  };
}
