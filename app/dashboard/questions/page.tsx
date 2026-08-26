'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Upload, Eye, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface Question {
  id: string;
  title: string;
  question_type: string;
  round_id: string;
  round_name: string;
  marks: number;
  time_limit: number;
}

interface GroupedQuestions {
  [roundName: string]: {
    [questionType: string]: Question[];
  };
}

function QuestionsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groupedQuestions, setGroupedQuestions] = useState<GroupedQuestions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRounds, setExpandedRounds] = useState<{ [key: string]: boolean }>({});
  const [expandedTypes, setExpandedTypes] = useState<{ [key: string]: boolean }>({});

  // Translate question type names
  const getQuestionTypeName = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'multiple_choice': t('questions.multipleChoice'),
      'true_false': t('questions.trueOrFalse'),
      'short_answer': t('questions.shortAnswer'),
      'sign_screen': t('questions.signScreen'),
      'signed': t('questions.signed'),
      'essay': t('questions.essay'),
      'matching': t('questions.matching'),
      'general_knowledge': t('questions.generalKnowledge'),
      'general knowledge': t('questions.generalKnowledge'),
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    fetchQuestions();
  }, [router]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        const allQuestions = data.questions || [];
        setQuestions(allQuestions);
        
        // Group questions by round, then by question type
        const grouped: GroupedQuestions = {};
        allQuestions.forEach((q: Question) => {
          const roundName = q.round_name || 'No Round';
          const questionType = q.question_type || 'Unknown';
          
          if (!grouped[roundName]) {
            grouped[roundName] = {};
          }
          if (!grouped[roundName][questionType]) {
            grouped[roundName][questionType] = [];
          }
          grouped[roundName][questionType].push(q);
        });
        setGroupedQuestions(grouped);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, roundName: string, questionType: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Update the questions array
        const updatedQuestions = questions.filter(q => q.id !== id);
        setQuestions(updatedQuestions);
        
        // Update grouped questions
        const updatedGrouped = { ...groupedQuestions };
        if (updatedGrouped[roundName] && updatedGrouped[roundName][questionType]) {
          updatedGrouped[roundName][questionType] = updatedGrouped[roundName][questionType].filter(q => q.id !== id);
          
          // Remove empty type groups
          if (updatedGrouped[roundName][questionType].length === 0) {
            delete updatedGrouped[roundName][questionType];
          }
          
          // Remove empty round groups
          if (Object.keys(updatedGrouped[roundName]).length === 0) {
            delete updatedGrouped[roundName];
          }
        }
        setGroupedQuestions(updatedGrouped);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('An error occurred while deleting the question');
    }
  };

  const toggleRound = (roundName: string) => {
    setExpandedRounds(prev => ({
      ...prev,
      [roundName]: !prev[roundName]
    }));
  };

  const toggleQuestionType = (key: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Define sort order for question types
  const questionTypeOrder = ['multiple_choice', 'short_answer', 'sign_screen', 'signed', 'true_false', 'essay', 'matching', 'general_knowledge'];
  
  const sortedTypeGroups = (typeGroups: { [key: string]: Question[] }) => {
    return Object.entries(typeGroups).sort(([typeA], [typeB]) => {
      const indexA = questionTypeOrder.indexOf(typeA);
      const indexB = questionTypeOrder.indexOf(typeB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('questions.questions')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('questions.manageQuestions')}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/questions/new">
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="w-4 h-4 mr-2" />
              {t('questions.newQuestion')}
            </Button>
          </Link>
          <Link href="/dashboard/questions/upload">
            <Button variant="outline" className="border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-md">
              <Upload className="w-4 h-4 mr-2" />
              {t('questions.upload')}
            </Button>
          </Link>
          <Link href="/dashboard/questions/view">
            <Button variant="outline" className="border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-md">
              <Eye className="w-4 h-4 mr-2" />
              {t('questions.viewAll')}
            </Button>
          </Link>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">{t('questions.noQuestions')}</p>
            <Link href="/dashboard/questions/new">
              <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
                {t('questions.createFirst')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedQuestions).map(([roundName, typeGroups]) => {
            const totalQuestions = Object.values(typeGroups).reduce((sum, questions) => sum + questions.length, 0);
            
            return (
              <div key={roundName} className="space-y-0">
                <button
                  onClick={() => toggleRound(roundName)}
                  className="w-full flex items-center justify-between gap-3 p-5 bg-gradient-to-br from-card to-card/50 border border-border/30 rounded-xl hover:border-primary/50 hover:bg-secondary/30 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <ChevronDown 
                      className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedRounds[roundName] ? 'rotate-180' : ''}`}
                    />
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{roundName}</h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-sm font-semibold rounded-full">
                      {totalQuestions} {t('questions.questions_count')}
                    </span>
                  </div>
                </button>
                
                {expandedRounds[roundName] && (
                  <div className="space-y-3 mt-2 pl-4 border-l-2 border-primary/30">
                    {sortedTypeGroups(typeGroups).map(([questionType, typeQuestions]) => {
                      const typeKey = `${roundName}-${questionType}`;
                      const isTypeExpanded = expandedTypes[typeKey];
                      
                      return (
                        <div key={typeKey} className="space-y-2">
                          {/* Question Type Header - Collapsible */}
                          <button
                            onClick={() => toggleQuestionType(typeKey)}
                            className="w-full flex items-center gap-3 py-2 px-3 hover:bg-secondary/30 rounded-lg transition-all group"
                          >
                            <ChevronDown 
                              className={`w-4 h-4 text-red-600 transition-transform duration-300 ${isTypeExpanded ? 'rotate-180' : ''}`}
                            />
                            <span className="px-3 py-1 bg-red-500/20 text-red-600 text-sm font-bold rounded-full group-hover:bg-red-500/30 transition-all">
                              {getQuestionTypeName(questionType)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {typeQuestions.length} {t('questions.questions_count')}
                            </span>
                          </button>
                          
                          {/* Questions in this type - Collapsible */}
                          {isTypeExpanded && (
                            <div className="space-y-2 pl-2">
                              {typeQuestions.map((question, index) => (
                                <Card key={question.id} className="border-border/30 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 hover:bg-secondary/30 transition-all shadow-sm hover:shadow-md group">
                                  <CardContent className="pt-6">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <span className="text-sm font-bold text-primary bg-gradient-to-r from-primary/20 to-primary/10 px-2 py-1 rounded-lg">
                                            {index + 1}
                                          </span>
                                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{question.title}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                          <span>{t('questions.marks')}: {question.marks}</span>
                                          <span>{t('questions.time')}: {question.time_limit}s</span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Link href={`/dashboard/questions/${question.id}`}>
                                          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 transition-all">
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                        </Link>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:bg-destructive/10 transition-all"
                                          onClick={() => handleDelete(question.id, roundName, questionType)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuestionsPage;
