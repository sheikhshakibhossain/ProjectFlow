import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Badge } from '../components/ui';
import { api } from '../lib/api';
import type { Feedback as FeedbackType, Project } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { Star, MessageSquarePlus, CheckCircle2 } from 'lucide-react';

export const Feedback: React.FC = () => {
  const { user } = useAuth();

  // For Teacher view
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [highlights, setHighlights] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Student/Lead view
  const [myFeedback, setMyFeedback] = useState<FeedbackType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'teacher') {
      api.getProjects().then(({ projects }) => setProjects(projects)).catch(() => {}).finally(() => setIsLoading(false));
    } else {
      api.getFeedback().then(({ feedback }) => setMyFeedback(feedback)).catch(() => {}).finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.createFeedback({ projectId: selectedProject, rating, comments, highlights });
      setSubmitted(true);
      setTimeout(() => {
        setSelectedProject('');
        setRating(5);
        setComments('');
        setHighlights('');
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role === 'teacher') {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Submit Feedback</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Provide structured feedback and ratings for student projects.</p>
        </div>

        {submitted ? (
          <Card className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300">Feedback Submitted Successfully</h3>
                <p className="text-emerald-700 dark:text-emerald-400 mt-1">Your feedback has been sent to the student team.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Select Project</label>
                  <select
                    required
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <option value="" disabled>Choose a project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} - {p.course}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2 rounded-xl transition-colors ${rating >= star ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                      >
                        <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Key Highlights / Suggestions (comma separated)</label>
                  <Input
                    placeholder="e.g. Great UI, Need better error handling"
                    value={highlights}
                    onChange={e => setHighlights(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Detailed Comments</label>
                  <textarea
                    required
                    className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[120px] resize-y"
                    placeholder="Provide constructive feedback on the team's progress..."
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Attachments (Optional)</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <MessageSquarePlus className="w-8 h-8 mb-3 text-slate-400 dark:text-slate-500" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX, or Images</p>
                      </div>
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Student / Team Lead View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Teacher Feedback</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review feedback and suggestions from your supervisors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">Loading feedback...</div>
        ) : myFeedback.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            No feedback received yet.
          </div>
        ) : (
          myFeedback.map(feedback => (
            <Card key={feedback.id} className="h-full flex flex-col">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20">
                    {feedback.projectTitle}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(feedback.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <img src={feedback.teacherAvatar} alt={feedback.teacherName} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{feedback.teacherName}</p>
                    <div className="flex text-amber-500 dark:text-amber-400 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < feedback.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed whitespace-pre-line">
                  "{feedback.comments}"
                </p>

                {feedback.highlights && feedback.highlights.length > 0 && (
                  <div className="mt-auto">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Key Highlights</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.highlights.map((h, i) => (
                        <Badge key={i} variant="outline" className="bg-slate-50 dark:bg-slate-800">{h}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
