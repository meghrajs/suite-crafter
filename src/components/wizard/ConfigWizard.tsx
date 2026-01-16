import { useState, useMemo } from 'react';
import { ProjectConfig, ProjectConfigSchema, defaultConfig, validCombinations } from '@/lib/types';
import { generateFolderTree } from '@/lib/folderTree';
import { WizardStepper } from './WizardStepper';
import { FolderTree } from './FolderTree';
import { StepBasics } from './steps/StepBasics';
import { StepCoverage } from './steps/StepCoverage';
import { StepLanguage } from './steps/StepLanguage';
import { StepOptions } from './steps/StepOptions';
import { StepGenerate } from './steps/StepGenerate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const steps = [
  { id: 1, title: 'Basics', description: 'Project information' },
  { id: 2, title: 'Coverage', description: 'Test types' },
  { id: 3, title: 'Language', description: 'Tech stack' },
  { id: 4, title: 'Options', description: 'Framework config' },
  { id: 5, title: 'Generate', description: 'Download ZIP' },
];

export function ConfigWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<Partial<ProjectConfig>>(defaultConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = (updates: Partial<ProjectConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    // Clear relevant errors
    const errorKeys = Object.keys(updates);
    setErrors(prev => {
      const next = { ...prev };
      errorKeys.forEach(key => delete next[key]);
      return next;
    });
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!config.projectName || config.projectName.length < 1) {
        newErrors.projectName = 'Project name is required';
      } else if (!/^[a-z0-9-]+$/.test(config.projectName)) {
        newErrors.projectName = 'Must be lowercase with hyphens only';
      }
    }

    if (currentStep === 2) {
      if (!config.includeUI && !config.includeAPI) {
        newErrors.includeUI = 'Select at least one test type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = useMemo(() => {
    if (currentStep === 1) {
      return config.projectName && config.projectName.length > 0 && /^[a-z0-9-]+$/.test(config.projectName);
    }
    if (currentStep === 2) {
      return config.includeUI || config.includeAPI;
    }
    return true;
  }, [currentStep, config]);

  const handleNext = () => {
    if (validateStep() && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Build complete config for preview and generation
  const completeConfig = useMemo(() => {
    const language = config.language || 'typescript';
    const validOptions = validCombinations[language];
    
    return {
      projectName: config.projectName || 'my-project',
      description: config.description || '',
      author: config.author || '',
      initGit: config.initGit ?? true,
      includeUI: config.includeUI ?? true,
      includeAPI: config.includeAPI ?? false,
      language,
      buildTool: config.buildTool || validOptions.buildTools[0],
      uiFramework: config.includeUI ? (config.uiFramework || validOptions.uiFrameworks[0]) : undefined,
      apiFramework: config.includeAPI ? (config.apiFramework || validOptions.apiFrameworks[0]) : undefined,
      testRunner: config.testRunner || validOptions.testRunners[0],
      reporting: config.reporting || [validOptions.reporting[0]],
      includeEnvConfig: config.includeEnvConfig ?? true,
      includeCI: config.includeCI ?? false,
      includeDocker: config.includeDocker ?? false,
    } as ProjectConfig;
  }, [config]);

  const folderTree = useMemo(() => 
    generateFolderTree(completeConfig), 
    [completeConfig]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="gradient-text">SuiteMate</span>
          </h1>
          <p className="text-muted-foreground">
            Generate production-ready automation frameworks in seconds
          </p>
        </div>

        {/* Stepper */}
        <div className="max-w-3xl mx-auto mb-8">
          <WizardStepper 
            steps={steps} 
            currentStep={currentStep} 
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Wizard Steps */}
          <div className="lg:col-span-3">
            <div className="card-gradient rounded-2xl border border-border p-6 sm:p-8 min-h-[500px] flex flex-col">
              <div className="flex-1">
                {currentStep === 1 && (
                  <StepBasics config={config} onChange={updateConfig} errors={errors} />
                )}
                {currentStep === 2 && (
                  <StepCoverage config={config} onChange={updateConfig} />
                )}
                {currentStep === 3 && (
                  <StepLanguage config={config} onChange={updateConfig} />
                )}
                {currentStep === 4 && (
                  <StepOptions config={config} onChange={updateConfig} />
                )}
                {currentStep === 5 && (
                  <StepGenerate config={completeConfig} />
                )}
              </div>

              {/* Navigation */}
              {currentStep < 5 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="gap-2"
                  >
                    {currentStep === 4 ? 'Review & Generate' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-8">
              <div className="h-[500px]">
                <FolderTree paths={folderTree} projectName={completeConfig.projectName} />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Live preview updates as you configure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
