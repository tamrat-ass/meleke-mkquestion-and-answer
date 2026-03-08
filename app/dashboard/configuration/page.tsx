'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/context';

interface QuestionTypeConfig {
  id: string;
  name: string;
  timeLimit: number;
  minimumTimeFrame: number;
  marks: number;
  hasOptions: boolean;
}

export default function ConfigurationPage() {
  const { t } = useLanguage();
  const [configs, setConfigs] = useState<QuestionTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/question-types');
      if (response.ok) {
        const data = await response.json();
        console.log('Question types data:', data);
        
        // Fetch time limit and check if questions have options for each question type
        const configuredTypes = await Promise.all(
          (data.question_types || data.types || []).map(async (type: any) => {
            try {
              const timeRes = await fetch(`/api/question-types/${type.id}/get-time-limit`);
              if (timeRes.ok) {
                const timeData = await timeRes.json();
                
                // Check if this question type has options (multiple choice)
                const hasOptionsRes = await fetch(`/api/question-types/${type.id}/check-options`);
                let hasOptions = false;
                if (hasOptionsRes.ok) {
                  const optionsData = await hasOptionsRes.json();
                  hasOptions = optionsData.has_options;
                }
                
                return {
                  id: type.id,
                  name: type.name,
                  timeLimit: timeData.average_time_limit || 30,
                  minimumTimeFrame: timeData.average_minimum_time_frame || 5,
                  marks: 4,
                  hasOptions: hasOptions,
                };
              }
            } catch (error) {
              console.error(`Error fetching data for ${type.name}:`, error);
            }
            return {
              id: type.id,
              name: type.name,
              timeLimit: 30,
              minimumTimeFrame: 5,
              marks: 4,
              hasOptions: false,
            };
          })
        );
        
        console.log('Configured types:', configuredTypes);
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

  const handleTimeLimitChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 30;
    setConfigs(configs.map(config =>
      config.id === id ? { ...config, timeLimit: numValue } : config
    ));
  };

  const handleMinimumTimeFrameChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 5;
    setConfigs(configs.map(config =>
      config.id === id ? { ...config, minimumTimeFrame: numValue } : config
    ));
  };

  const handleMarksChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 4;
    setConfigs(configs.map(config =>
      config.id === id ? { ...config, marks: numValue } : config
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update time limits and marks for each question type
      for (const config of configs) {
        await fetch(`/api/question-types/${config.id}/update-time-limit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time_limit: config.timeLimit,
            minimum_time_frame: config.minimumTimeFrame,
            marks: config.marks,
            has_options: config.hasOptions,
          }),
        });
      }
      alert(t('common.configurationSaved'));
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert(t('common.failedSave'));
    } finally {
      setIsSaving(false);
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

  // Separate multiple choice and short answer
  const multipleChoice = configs.filter(c => c.hasOptions);
  const shortAnswer = configs.filter(c => !c.hasOptions);

  const renderConfigSection = (title: string, description: string, items: QuestionTypeConfig[]) => (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {items.map((config) => {
          // Translate question type names
          const getQuestionTypeName = (name: string) => {
            const typeMap: { [key: string]: string } = {
              'multiple_choice': t('questions.multipleChoice'),
              'true_false': t('questions.trueOrFalse'),
              'short_answer': t('questions.shortAnswer'),
              'essay': t('questions.essay'),
              'matching': t('questions.matching'),
            };
            return typeMap[name] || name;
          };

          return (
            <div key={config.id} className="space-y-4 pb-6 border-b border-border/30 last:border-b-0 last:pb-0">
              <Label className="text-lg font-semibold capitalize text-foreground">{getQuestionTypeName(config.name)}</Label>
              
              {/* Time Limit */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t('configuration.timeLimit')} ({t('questions.seconds')})</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="5"
                    max="300"
                    value={config.timeLimit || 30}
                    onChange={(e) => handleTimeLimitChange(config.id, e.target.value)}
                    className="w-24 bg-input border-border/50"
                    placeholder={t('questions.seconds')}
                  />
                  <span className="text-sm text-muted-foreground">{t('questions.seconds')}</span>
                </div>
              </div>

              {/* Minimum Time Frame */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t('configuration.minimumTimeFrame')} ({t('questions.seconds')})</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max={config.timeLimit - 1}
                    value={config.minimumTimeFrame || 5}
                    onChange={(e) => handleMinimumTimeFrameChange(config.id, e.target.value)}
                    className="w-24 bg-input border-border/50"
                    placeholder={t('questions.seconds')}
                  />
                  <span className="text-sm text-muted-foreground">{t('questions.seconds')}</span>
                </div>
              </div>

              {/* Marks */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t('questions.marks')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={config.marks || 4}
                    onChange={(e) => handleMarksChange(config.id, e.target.value)}
                    className="w-24 bg-input border-border/50"
                    placeholder={t('questions.marks')}
                  />
                  <span className="text-sm text-muted-foreground">{t('questions.marks')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('configuration.questionTypes')}</h1>
        <p className="text-muted-foreground mt-1">{t('configuration.configureQuestionTypes')}</p>
      </div>

      {/* Multiple Choice Section */}
      {multipleChoice.length > 0 && renderConfigSection(
        t('configuration.multipleChoice'),
        t('configuration.multipleChoiceDesc'),
        multipleChoice
      )}

      {/* Short Answer Section */}
      {shortAnswer.length > 0 && renderConfigSection(
        t('configuration.shortAnswer'),
        t('configuration.shortAnswerDesc'),
        shortAnswer
      )}

      <div className="pt-6">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
        >
          {isSaving ? t('common.saving') : t('configuration.save')}
        </Button>
      </div>
    </div>
  );
}
