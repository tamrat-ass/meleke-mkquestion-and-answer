'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/context';
import { Edit2, Save, Trash2 } from 'lucide-react';

interface QuestionTypeConfig {
  id: string;
  name: string;
  timeLimit: number;
  minimumTimeFrame: number;
  marks: number;
  minTimeLimit: number;
  maxTimeLimit: number;
  minMinimumTimeFrame: number;
  maxMinimumTimeFrame: number | null;
}

interface EditingState {
  [key: string]: {
    timeLimit: number;
    minimumTimeFrame: number;
  };
}

interface NewQuestionTypeState {
  name: string;
  timeLimit: number;
}

export default function ConfigurationPage() {
  const { t } = useLanguage();
  const [configs, setConfigs] = useState<QuestionTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [editingValues, setEditingValues] = useState<EditingState>({});
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<NewQuestionTypeState>({
    name: '',
    timeLimit: 30,
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/question-types');
      if (response.ok) {
        const data = await response.json();
        
        console.log('Raw API response:', data.question_types); // Debug log
        
        const configuredTypes: QuestionTypeConfig[] = (data.question_types || data.types || []).map((type: any) => {
          console.log(`Processing type: ${type.name}`, {
            time_limit: type.time_limit,
            min_time_limit: type.min_time_limit,
            max_time_limit: type.max_time_limit,
            min_minimum_time_frame: type.min_minimum_time_frame,
            max_minimum_time_frame: type.max_minimum_time_frame,
          }); // Debug log
          
          return {
            id: type.id,
            name: type.name,
            timeLimit: type.time_limit || 30,
            minimumTimeFrame: type.min_minimum_time_frame || 1,
            marks: 4, // Demo value - read from first question of this type in actual use
            minTimeLimit: type.min_time_limit || 5,
            maxTimeLimit: type.max_time_limit || 300,
            minMinimumTimeFrame: type.min_minimum_time_frame || 1,
            maxMinimumTimeFrame: type.max_minimum_time_frame || null,
          };
        });
        
        console.log('Configured types:', configuredTypes); // Debug log
        
        setConfigs(configuredTypes.filter(c => c.name !== 'sign'));
      } else {
        console.error('Failed to fetch question types:', response.status);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionTypeName = (name: string): string => {
    const typeMap: { [key: string]: string } = {
      'multiple_choice': t('questions.multipleChoice'),
      'true_false': t('questions.trueOrFalse'),
      'short_answer': t('questions.shortAnswer'),
      'essay': t('questions.essay'),
      'matching': t('questions.matching'),
      'sign_screen': t('questions.signScreen'),
      'signed': t('questions.signed'),
      'scrambled_word': 'Scrambled Word Challenge',
    };
    return typeMap[name] || name;
  };

  const getQuestionTypeColor = (name: string): string => {
    const colorMap: { [key: string]: string } = {
      'multiple_choice': 'from-blue-500 to-blue-600',
      'true_false': 'from-green-500 to-green-600',
      'short_answer': 'from-amber-500 to-amber-600',
      'essay': 'from-purple-500 to-purple-600',
      'matching': 'from-pink-500 to-pink-600',
      'sign_screen': 'from-red-500 to-red-600',
      'signed': 'from-indigo-500 to-indigo-600',
      'scrambled_word': 'from-orange-500 to-orange-600',
    };
    return colorMap[name] || 'from-gray-500 to-gray-600';
  };

  const handleEdit = (id: string, config: QuestionTypeConfig) => {
    const newEditingIds = new Set(editingIds);
    newEditingIds.add(id);
    setEditingIds(newEditingIds);
    
    setEditingValues({
      ...editingValues,
      [id]: {
        timeLimit: config.timeLimit,
        minimumTimeFrame: config.minimumTimeFrame,
      },
    });
  };

  const handleCancel = (id: string) => {
    const newEditingIds = new Set(editingIds);
    newEditingIds.delete(id);
    setEditingIds(newEditingIds);
    
    const newValues = { ...editingValues };
    delete newValues[id];
    setEditingValues(newValues);
  };

  const handleSave = async (id: string) => {
    setIsSaving(id);
    try {
      const values = editingValues[id];
      
      await fetch(`/api/question-types/${id}/update-time-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_limit: values.timeLimit,
          minimum_time_frame: values.minimumTimeFrame,
        }),
      });

      // Update local state
      setConfigs(configs.map(config =>
        config.id === id
          ? {
              ...config,
              timeLimit: values.timeLimit,
              minimumTimeFrame: values.minimumTimeFrame,
            }
          : config
      ));

      // Exit editing mode
      const newEditingIds = new Set(editingIds);
      newEditingIds.delete(id);
      setEditingIds(newEditingIds);
      
      const newValues = { ...editingValues };
      delete newValues[id];
      setEditingValues(newValues);

      alert(t('common.configurationSaved'));
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert(t('common.failedSave'));
    } finally {
      setIsSaving(null);
    }
  };

  const handleCreateNewQuestionType = async () => {
    setCreateError('');
    
    if (!newQuestionType.name.trim()) {
      setCreateError(t('questions.questionText') + ' is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/question-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newQuestionType.name.trim(),
          time_limit: newQuestionType.timeLimit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add new question type to the list with database values
        const newConfig: QuestionTypeConfig = {
          id: data.question_type.id,
          name: data.question_type.name,
          timeLimit: data.question_type.time_limit || 30,
          minimumTimeFrame: data.question_type.min_minimum_time_frame || 1,
          marks: 4, // Demo value
          minTimeLimit: data.question_type.min_time_limit || 5,
          maxTimeLimit: data.question_type.max_time_limit || 300,
          minMinimumTimeFrame: data.question_type.min_minimum_time_frame || 1,
          maxMinimumTimeFrame: data.question_type.max_minimum_time_frame || null,
        };
        
        setConfigs([...configs, newConfig]);
        setNewQuestionType({ name: '', timeLimit: 30 });
        setIsCreatingNew(false);
        alert(t('common.created') + ' successfully!');
      } else if (response.status === 409) {
        setCreateError('Question type already exists');
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error || 'Failed to create question type');
      }
    } catch (error) {
      console.error('Error creating question type:', error);
      setCreateError('An error occurred while creating the question type');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQuestionType = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the question type "${name}"? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setIsDeleting(id);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/question-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setConfigs(configs.filter(config => config.id !== id));
        
        // Clear editing state if it was being edited
        const newEditingIds = new Set(editingIds);
        newEditingIds.delete(id);
        setEditingIds(newEditingIds);
        
        const newValues = { ...editingValues };
        delete newValues[id];
        setEditingValues(newValues);

        alert(t('common.deleted') + ' successfully!');
      } else {
        const errorData = await response.json();
        setDeleteError(errorData.message || errorData.error || 'Failed to delete question type');
      }
    } catch (error) {
      console.error('Error deleting question type:', error);
      setDeleteError('An error occurred while deleting the question type');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('configuration.configuration')}</h2>
          <p className="text-muted-foreground">{t('configuration.timeLimit')}</p>
        </div>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">{t('common.noData')}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {t('configuration.questionTypes')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('configuration.configureQuestionTypes')}</p>
      </div>

      {/* Create New Question Type Section */}
      {!isCreatingNew ? (
        <Button
          onClick={() => setIsCreatingNew(true)}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          + Add New Question Type
        </Button>
      ) : (
        <Card className="border-border/50 bg-card shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-bold text-foreground mb-2 block">
                Question Type Name
              </Label>
              <Input
                type="text"
                placeholder="e.g., fill_in_blank, drag_drop, coding"
                value={newQuestionType.name}
                onChange={(e) => setNewQuestionType({
                  ...newQuestionType,
                  name: e.target.value
                })}
                className="bg-input border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-foreground mb-2 block">
                Default Time Limit (seconds)
              </Label>
              <Input
                type="number"
                min="5"
                max="300"
                value={newQuestionType.timeLimit}
                onChange={(e) => setNewQuestionType({
                  ...newQuestionType,
                  timeLimit: parseInt(e.target.value) || 30
                })}
                className="bg-input border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            {createError && (
              <div className="p-3 bg-red-100/50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                {createError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreateNewQuestionType}
                disabled={isCreating}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md"
              >
                {isCreating ? t('common.creating') : t('common.create')}
              </Button>
              <Button
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewQuestionType({ name: '', timeLimit: 30 });
                  setCreateError('');
                }}
                variant="outline"
                disabled={isCreating}
                className="border-border/50"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Type Cards */}
      <div className="space-y-4">
        {configs.map((config) => {
          const isEditing = editingIds.has(config.id);
          const values = editingValues[config.id] || config;
          const colorGradient = getQuestionTypeColor(config.name);
          
          return (
            <Card key={config.id} className="border-border/50 bg-card shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                {/* Delete Error Message */}
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-100/50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                    {deleteError}
                  </div>
                )}

                {/* Header with title and buttons */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorGradient}`}></div>
                    <h3 className="text-lg font-bold text-foreground">
                      {getQuestionTypeName(config.name)}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button
                          onClick={() => handleEdit(config.id, config)}
                          variant="outline"
                          size="sm"
                          className="border-border/50 hover:border-primary/50 transition-all"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          onClick={() => handleDeleteQuestionType(config.id, config.name)}
                          disabled={isDeleting === config.id}
                          variant="outline"
                          size="sm"
                          className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeleting === config.id ? t('common.deleting') : t('common.delete')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleSave(config.id)}
                          disabled={isSaving === config.id}
                          size="sm"
                          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving === config.id ? t('common.saving') : t('configuration.update')}
                        </Button>
                        <Button
                          onClick={() => handleCancel(config.id)}
                          variant="outline"
                          size="sm"
                          className="border-border/50 hover:border-red-500/50"
                          disabled={isSaving === config.id}
                        >
                          {t('common.cancel')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Time Limit */}
                  <div className="space-y-3 p-4 rounded-lg bg-secondary/10 border border-border/30">
                    <Label className="text-sm font-bold text-foreground">{t('configuration.timeLimit')}</Label>
                    <p className="text-xs text-muted-foreground">({t('questions.seconds')})</p>
                    {isEditing ? (
                      <>
                        <Input
                          type="number"
                          min={config.minTimeLimit}
                          max={config.maxTimeLimit}
                          value={values.timeLimit}
                          onChange={(e) => setEditingValues({
                            ...editingValues,
                            [config.id]: {
                              ...values,
                              timeLimit: parseInt(e.target.value) || 30,
                            }
                          })}
                          className="bg-input border-border/50 focus:border-primary/50 transition-colors font-semibold"
                        />
                        <p className="text-xs text-muted-foreground">Min: {config.minTimeLimit} • Max: {config.maxTimeLimit}</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-background border border-border/30 rounded-md p-3 font-semibold text-foreground">
                          {config.timeLimit}
                        </div>
                        <p className="text-xs text-muted-foreground">Min: {config.minTimeLimit} • Max: {config.maxTimeLimit}</p>
                      </>
                    )}
                  </div>

                  {/* Minimum Time Frame */}
                  <div className="space-y-3 p-4 rounded-lg bg-secondary/10 border border-border/30">
                    <Label className="text-sm font-bold text-foreground">{t('configuration.minimumTimeFrame')}</Label>
                    <p className="text-xs text-muted-foreground">({t('questions.seconds')})</p>
                    {isEditing ? (
                      <>
                        <Input
                          type="number"
                          min={config.minMinimumTimeFrame}
                          max={values.timeLimit - 1}
                          value={values.minimumTimeFrame}
                          onChange={(e) => setEditingValues({
                            ...editingValues,
                            [config.id]: {
                              ...values,
                              minimumTimeFrame: parseInt(e.target.value) || 1,
                            }
                          })}
                          className="bg-input border-border/50 focus:border-primary/50 transition-colors font-semibold"
                        />
                        <p className="text-xs text-muted-foreground">Min: {config.minMinimumTimeFrame} • Max: {values.timeLimit - 1}</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-background border border-border/30 rounded-md p-3 font-semibold text-foreground">
                          {config.minimumTimeFrame}
                        </div>
                        <p className="text-xs text-muted-foreground">Min: {config.minMinimumTimeFrame} • Max: {config.timeLimit - 1}</p>
                      </>
                    )}
                  </div>

                  {/* Marks */}
                  <div className="space-y-3 p-4 rounded-lg bg-secondary/10 border border-border/30">
                    <Label className="text-sm font-bold text-foreground">{t('questions.marks')}</Label>
                    <p className="text-xs text-muted-foreground">Points per question (Demo)</p>
                    <div className="bg-background border border-border/30 rounded-md p-3 font-semibold text-foreground">
                      {config.marks}
                    </div>
                    <p className="text-xs text-muted-foreground">Read-only display</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
