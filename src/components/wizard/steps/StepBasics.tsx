import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ProjectConfig } from '@/lib/types';
import { Folder, User, FileText, GitBranch } from 'lucide-react';

interface StepBasicsProps {
  config: Partial<ProjectConfig>;
  onChange: (updates: Partial<ProjectConfig>) => void;
  errors?: Record<string, string>;
}

export function StepBasics({ config, onChange, errors }: StepBasicsProps) {
  const handleNameChange = (value: string) => {
    // Auto-convert to slug format
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    onChange({ projectName: slug });
  };

  return (
    <div className="step-content space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Project Basics</h2>
        <p className="text-muted-foreground">
          Set up your automation project's identity and initial configuration.
        </p>
      </div>

      <div className="space-y-5">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="projectName" className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            Project Name
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="projectName"
            placeholder="my-automation-suite"
            value={config.projectName || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-mono"
          />
          {errors?.projectName ? (
            <p className="text-xs text-destructive">{errors.projectName}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only. This will be your folder name.
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Description
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your automation project..."
            value={config.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Brief description for your README and package metadata.
          </p>
        </div>

        {/* Author */}
        <div className="space-y-2">
          <Label htmlFor="author" className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Author
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="author"
            placeholder="Your name or team"
            value={config.author || ''}
            onChange={(e) => onChange({ author: e.target.value })}
          />
        </div>

        {/* Git Init Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="initGit" className="text-sm font-medium cursor-pointer">
                Initialize Git Repository
              </Label>
              <p className="text-xs text-muted-foreground">
                Includes .gitignore and git setup instructions
              </p>
            </div>
          </div>
          <Switch
            id="initGit"
            checked={config.initGit ?? true}
            onCheckedChange={(checked) => onChange({ initGit: checked })}
          />
        </div>
      </div>
    </div>
  );
}
