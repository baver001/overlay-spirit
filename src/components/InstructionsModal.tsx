import React from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, MousePointer, Settings, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ open, onOpenChange }) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('editor.instructions_title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`p-5 rounded-xl border border-border/40 bg-gradient-to-br ${step.color} backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-background/50 ${step.iconColor}`}>
                    <Icon className="w-5 h-5" />
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
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsModal;










