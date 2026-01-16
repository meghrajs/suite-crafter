import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse-glow',
                    !isCompleted && !isCurrent && 'bg-secondary text-muted-foreground',
                    isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/40'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </button>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={cn(
                    'text-xs font-medium',
                    (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-3 h-0.5 relative">
                  <div className="absolute inset-0 bg-border rounded-full" />
                  <div 
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                      isCompleted ? 'bg-primary w-full' : 'w-0'
                    )}
                    style={{
                      background: isCompleted ? 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(199 89% 48%) 100%)' : undefined
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
