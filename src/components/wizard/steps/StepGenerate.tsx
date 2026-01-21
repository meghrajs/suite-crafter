import { useState } from 'react';
import { ProjectConfig, labels } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FolderTree } from '../FolderTree';
import { generateFolderTree } from '@/lib/folderTree';
import { generateAndDownloadZip } from '@/lib/zipGenerator';
import { Download, Check, Loader2, ArrowRight, Sparkles } from 'lucide-react';

const SUPPORT_EMAIL = "meghrajwithandroid@gmail.com";
const GITHUB_NEW_ISSUE = "https://github.com/meghrajs/suite-crafter/issues/new/choose";

interface StepGenerateProps {
  config: ProjectConfig;
}

export function StepGenerate({ config }: StepGenerateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const folderTree = generateFolderTree(config);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateAndDownloadZip(config);
      setIsComplete(true);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const summaryItems = [
    { label: 'Project', value: config.projectName },
    { label: 'Language', value: labels.language[config.language] },
    { label: 'Build Tool', value: labels.buildTool[config.buildTool] },
    { label: 'Test Types', value: [
      config.includeUI && 'UI',
      config.includeAPI && 'API',
    ].filter(Boolean).join(' + ') },
    config.includeUI && { label: 'UI Framework', value: labels.uiFramework[config.uiFramework!] },
    config.includeAPI && { label: 'API Framework', value: labels.apiFramework[config.apiFramework!] },
    { label: 'Test Runner', value: labels.testRunner[config.testRunner] },
    { label: 'Reporting', value: config.reporting.map(r => labels.reporting[r]).join(', ') },
    config.includeCI && { label: 'CI/CD', value: 'GitHub Actions' },
    config.includeDocker && { label: 'Container', value: 'Docker' },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="step-content space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Generate Your Framework
        </h2>
        <p className="text-muted-foreground">
          Review your configuration and generate your ready-to-run automation framework.
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="p-5 rounded-xl bg-secondary/30 border border-border space-y-4">
        <h3 className="text-sm font-medium text-foreground">Configuration Summary</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {summaryItems.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Folder Preview */}
      <div className="h-64">
        <FolderTree paths={folderTree} projectName={config.projectName} />
      </div>

      {/* Generate Button */}
      <div className="pt-4">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold gap-3"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : isComplete ? (
            <>
              <Check className="w-5 h-5" />
              Downloaded Successfully!
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate & Download ZIP
            </>
          )}
        </Button>
      </div>

      {/* Support */}
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Questions or feedback?</p>
            <p className="text-xs text-muted-foreground">
              Bugs & feature requests → GitHub Issues. Private questions → email.
            </p>
          </div>
      
          <div className="flex items-center gap-3">
            <a
              href={GITHUB_NEW_ISSUE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Open an Issue
            </a>
      
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                `SuiteMate — ${config.projectName} (${config.language})`
              )}`}
              className="text-sm text-primary underline underline-offset-4 hover:opacity-90"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>


      {/* Next Steps */}
      {isComplete && (
        <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-fade-in">
          <h3 className="text-sm font-medium text-primary flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Next Steps
          </h3>
          <ol className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-primary font-mono">1.</span>
              <span>Unzip <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">{config.projectName}.zip</code></span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-mono">2.</span>
              <span>Open terminal in the project folder</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-mono">3.</span>
              <span>Run <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">
                {config.buildTool === 'npm' || config.buildTool === 'pnpm' 
                  ? `${config.buildTool} install` 
                  : config.buildTool === 'maven' 
                    ? 'mvn clean install -DskipTests'
                    : 'pip install -r requirements.txt'}
              </code></span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-mono">4.</span>
              <span>Run your first test with the commands in README</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
