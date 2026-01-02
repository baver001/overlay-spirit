import React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, MousePointer, Settings, Download } from 'lucide-react';

const EditorInstructions: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Upload,
      title: t('editor.instructions_step1_title'),
      description: t('editor.instructions_step1_desc'),
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: MousePointer,
      title: t('editor.instructions_step2_title'),
      description: t('editor.instructions_step2_desc'),
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    {
      icon: Settings,
      title: t('editor.instructions_step3_title'),
      description: t('editor.instructions_step3_desc'),
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-400',
    },
    {
      icon: Download,
      title: t('editor.instructions_step4_title'),
      description: t('editor.instructions_step4_desc'),
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t('editor.instructions_title')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`p-6 rounded-xl border border-border/40 bg-gradient-to-br ${step.color} backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-background/50 ${step.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {t('editor.instructions_step1_desc').split('.')[0]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorInstructions;












