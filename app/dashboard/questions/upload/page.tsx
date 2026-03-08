'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, ArrowLeft } from 'lucide-react';

export default function UploadQuestionsPage() {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/questions/template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      setUploadError(t('questions.failedToDownloadTemplate'));
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/questions/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || t('questions.uploadFailed'));
        return;
      }

      let successMessage = `✓ ${t('questions.successfullyUploaded')} ${data.inserted} ${t('questions.questions')}!`;
      if (data.errors && data.errors.length > 0) {
        successMessage += `\n\n${t('common.errors')} (${data.errors.length}):\n${data.errors.join('\n')}`;
      }
      setUploadSuccess(successMessage);
      if (e.target) {
        e.target.value = '';
      }
    } catch (error) {
      setUploadError(t('questions.uploadErrorOccurred'));
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('questions.bulkUploadQuestions')}</h2>
        </div>
        <Link href="/dashboard/questions">
          <Button variant="outline" className="border-border/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('questions.backToQuestions')}
          </Button>
        </Link>
      </div>

      {/* <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
          <CardDescription>Follow these steps to upload questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">1</div>
              <div>
                <p className="font-semibold text-foreground">Download the Excel template</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">2</div>
              <div>
                <p className="font-semibold text-foreground">Fill in your questions</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">3</div>
              <div>
                <p className="font-semibold text-foreground">Upload the file</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>{t('questions.step1')}: {t('questions.downloadTemplate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownloadTemplate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-3 w-4" />
              {t('questions.downloadExcelTemplate')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card border-primary/30">
          <CardHeader>
            <CardTitle>{t('questions.step2')}: {t('questions.uploadQuestions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Button 
                asChild 
                disabled={isUploading}
                className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? t('common.uploading') : t('questions.selectExcelFileToUpload')}
                </span>
              </Button>
            </label>

            {uploadError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded text-sm">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-600 p-4 rounded text-sm whitespace-pre-wrap">
                {uploadSuccess}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
