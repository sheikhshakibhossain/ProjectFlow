import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, Task, TaskStatus } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Clock, AlertCircle, MessageSquare } from 'lucide-react';

const ItemTypes = {
  TASK: 'task'
};

const TaskCard: React.FC<{ task: Task, index: number, moveTask: (taskId: string, targetStatus: TaskStatus) => void }> = ({ task, moveTask }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const assignee = MOCK_USERS.find(u => u.id === task.assigneeId);

  return (
    <div
      ref={drag}
      className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
          {task.priority}
        </Badge>
      </div>
      <h4 className="font-medium text-slate-900 text-sm mb-1">{task.title}</h4>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        {assignee && (
          <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-white shadow-sm" title={assignee.name} />
        )}
      </div>
    </div>
  );
};

const Column: React.FC<{ status: TaskStatus, title: string, tasks: Task[], moveTask: (taskId: string, targetStatus: TaskStatus) => void }> = ({ status, title, tasks, moveTask }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-sm bg-slate-100/50 rounded-2xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <Badge variant="secondary" className="bg-white">{tasks.length}</Badge>
      </div>
      <div 
        ref={drop} 
        className={`flex-1 flex flex-col gap-3 min-h-[200px] rounded-xl transition-colors ${isOver ? 'bg-indigo-50/50 border border-indigo-200 border-dashed' : ''}`}
      >
        {tasks.map((task, i) => (
          <TaskCard key={task.id} task={task} index={i} moveTask={moveTask} />
        ))}
      </div>
    </div>
  );
};

export const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const project = MOCK_PROJECTS.find(p => p.id === id);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (project) {
      setTasks(MOCK_TASKS.filter(t => t.projectId === project.id));
    }
  }, [project]);

  if (!project) return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Project Not Found</h2>
      <p className="text-slate-500 mb-6">The project you're looking for doesn't exist or you don't have access.</p>
      <Button asChild>
        <Link to="/projects">Return to Projects</Link>
      </Button>
    </div>
  );

  const moveTask = (taskId: string, targetStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="mt-1 -ml-2 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
                <Badge variant={project.status === 'active' ? 'success' : 'default'}>{project.status}</Badge>
              </div>
              <p className="text-slate-500">{project.course}</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            {user?.role === 'teacher' && (
              <Button asChild variant="outline">
                <Link to="/feedback">Add Feedback</Link>
              </Button>
            )}
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>

        {/* Project Meta */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <Card className="md:col-span-3 bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-slate-600 text-sm">{project.description}</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-indigo-100">
            <CardContent className="p-4 sm:p-6 flex flex-col justify-center h-full">
              <p className="text-sm font-medium text-indigo-800 mb-2">Overall Progress</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-indigo-600 leading-none">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-indigo-200/50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full items-start">
            <Column status="todo" title="To Do" tasks={todoTasks} moveTask={moveTask} />
            <Column status="in_progress" title="In Progress" tasks={inProgressTasks} moveTask={moveTask} />
            <Column status="done" title="Done" tasks={doneTasks} moveTask={moveTask} />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
