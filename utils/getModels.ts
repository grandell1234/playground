import fs from 'fs';
import path from 'path';

export function getModelNames() {
  const checkpointPath = path.join(process.cwd(), 'checkpoint');
  try {
    const files = fs.readdirSync(checkpointPath);
    return files.filter(file => !file.startsWith('.'));
  } catch (error) {
    console.error('Error reading checkpoint directory:', error);
    return [];
  }
}
