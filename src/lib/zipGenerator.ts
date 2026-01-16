import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ProjectConfig } from './types';
import { generateFiles } from './templates';

export async function generateAndDownloadZip(config: ProjectConfig): Promise<void> {
  const zip = new JSZip();
  const files = generateFiles(config);

  // Add each file to the zip
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Generate the zip
  const content = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // Trigger download
  saveAs(content, `${config.projectName}.zip`);
}
