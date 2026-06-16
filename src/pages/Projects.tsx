import React, { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Project, Section } from '../lib/types';
import { Link } from 'react-router';
import { Search, Plus, Clock, Users, Folder, FolderPlus, X, ArrowLeft, AlertTriangle } from 'lucide-react';

function isOverdue(deadline: string) {
  return new Date(deadline) < new Date(new Date().toDateString());
}

const ItemTypes = {
  PROJECT: 'project',
};

const ProjectCard: React.FC<{ project: Project; memberCount?: number; canDrag: boolean }> = ({ project, memberCount, canDrag }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PROJECT,
    item: { id: project.id },
    canDrag,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [canDrag, project.id]);

  const overdue = !['completed', 'rejected', 'deletion_requested'].includes(project.status) && isOverdue(project.deadline);

  const statusVariant = (s: string) =>
    s === 'active' ? 'success' : s === 'completed' ? 'default' : s === 'dormant' ? 'warning'
    : s === 'rejected' ? 'destructive' : s === 'deletion_requested' ? 'destructive' : s === 'under_review' ? 'warning' : 'secondary';
  const statusLabel = (s: string) =>
    s === 'deletion_requested' ? 'deletion pending' : s === 'under_review' ? 'under review' : s.replace('_', ' ');

  return (
    <div ref={drag} className={`${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <Link to={`/projects/${project.id}`}>
        <Card className={`h-full hover:shadow-md transition-all cursor-pointer group ${overdue ? 'hover:border-red-200 dark:hover:border-red-500/30 border-red-100 dark:border-red-500/20' : 'hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start flex-wrap gap-1">
              <Badge variant={statusVariant(project.status)} className="mb-1">{statusLabel(project.status)}</Badge>
              {overdue && (
                <Badge variant="destructive" className="mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />overdue
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">{project.title}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">{project.description}</p>
          </CardHeader>
          <CardContent className="mt-auto pt-4 space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
              <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-500 dark:text-red-400' : ''}`}>
                <Clock className="w-4 h-4" />
                <span>{project.deadline}</span>
              </div>
              {memberCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{memberCount} Members</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
                <span className="text-slate-500 dark:text-slate-400">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

const SectionFolder: React.FC<{
  section: Section;
  count: number;
  isTeacher: boolean;
  onOpen: () => void;
  onDropProject: (projectId: string) => void;
  onDelete: () => void;
}> = ({ section, count, isTeacher, onOpen, onDropProject, onDelete }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.PROJECT,
    drop: (item: { id: string }) => onDropProject(item.id),
    canDrop: () => isTeacher,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [isTeacher]);

  return (
    <div
      ref={drop}
      onClick={onOpen}
      className={`group relative flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 cursor-pointer transition-colors ${isOver && canDrop ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40'}`}
    >
      <Folder className="w-8 h-8 text-indigo-500 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{section.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{count} project{count === 1 ? '' : 's'}</p>
      </div>
      {isTeacher && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete section"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const BackToProjects: React.FC<{ onClick: () => void; onDropProject: (projectId: string) => void; isTeacher: boolean }> = ({ onClick, onDropProject, isTeacher }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.PROJECT,
    drop: (item: { id: string }) => onDropProject(item.id),
    canDrop: () => isTeacher,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [isTeacher]);

  return (
    <button
      ref={drop}
      onClick={onClick}
      className={`flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg ${isOver && canDrop ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-500/30' : ''}`}
    >
      <ArrowLeft className="w-4 h-4" />
      All Projects
    </button>
  );
};

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([api.getProjects(), api.getSections()])
      .then(([projectsRes, sectionsRes]) => {
        if (cancelled) return;
        setProjects(projectsRes.projects);
        setSections(sectionsRes.sections);
        const teamIds = Array.from(new Set(projectsRes.projects.map(p => p.teamId).filter(Boolean)));
        Promise.all(teamIds.map(teamId => api.getTeamMembers(teamId).then(({ users }) => [teamId, users.length] as const)))
          .then(entries => {
            if (cancelled) return;
            setMemberCounts(Object.fromEntries(entries));
          })
          .catch(() => {});
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load projects'))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [user]);

  const visibleProjects = projects.filter(p => (p.sectionId || null) === activeSectionId);
  const filteredProjects = visibleProjects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeSection = sections.find(s => s.id === activeSectionId);

  const handleCreateSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    setSectionError('');
    try {
      const { section } = await api.createSection(name);
      setSections(prev => [...prev, section]);
      setNewSectionName('');
      setIsCreatingSection(false);
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'Failed to create section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    setSectionError('');
    try {
      await api.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setProjects(prev => prev.map(p => p.sectionId === sectionId ? { ...p, sectionId: undefined } : p));
      if (activeSectionId === sectionId) setActiveSectionId(null);
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'Failed to delete section');
    }
  };

  const handleMoveProject = async (projectId: string, sectionId: string | null) => {
    setSectionError('');
    try {
      const { project } = await api.moveProjectToSection(projectId, sectionId);
      setProjects(prev => prev.map(p => p.id === projectId ? project : p));
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'Failed to move project');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your academic projects.</p>
        </div>
        {user?.role === 'team_lead' && (
          <Button asChild className="shrink-0">
            <Link to="/projects/create">
              <Plus className="w-5 h-5 mr-2" />
              Create Project
            </Link>
          </Button>
        )}
      </div>

      {sectionError && <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">{sectionError}</div>}

      {activeSectionId === null ? (
        (sections.length > 0 || isTeacher) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Sections</h2>
              {isTeacher && !isCreatingSection && (
                <Button variant="outline" size="sm" onClick={() => setIsCreatingSection(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Section
                </Button>
              )}
            </div>

            {isCreatingSection && (
              <div className="flex gap-2 items-center">
                <Input
                  autoFocus
                  placeholder="Section name..."
                  className="bg-white dark:bg-slate-900 max-w-xs"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSection();
                    if (e.key === 'Escape') { setIsCreatingSection(false); setNewSectionName(''); }
                  }}
                />
                <Button size="sm" onClick={handleCreateSection}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsCreatingSection(false); setNewSectionName(''); }}>Cancel</Button>
              </div>
            )}

            {sections.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sections.map(section => (
                  <SectionFolder
                    key={section.id}
                    section={section}
                    count={projects.filter(p => p.sectionId === section.id).length}
                    isTeacher={isTeacher}
                    onOpen={() => setActiveSectionId(section.id)}
                    onDropProject={(projectId) => handleMoveProject(projectId, section.id)}
                    onDelete={() => handleDeleteSection(section.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="flex items-center gap-3">
          <BackToProjects
            onClick={() => setActiveSectionId(null)}
            onDropProject={(projectId) => handleMoveProject(projectId, null)}
            isTeacher={isTeacher}
          />
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <Folder className="w-4 h-4 text-indigo-500" />
            {activeSection?.name || 'Section'}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search projects..."
            className="pl-10 bg-white dark:bg-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="dormant">Dormant</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            {activeSectionId !== null
              ? 'No projects in this section yet.'
              : 'No projects found matching your criteria.'}
          </div>
        ) : (
          filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              memberCount={memberCounts[project.teamId]}
              canDrag={isTeacher}
            />
          ))
        )}
      </div>
    </div>
    </DndProvider>
  );
};
