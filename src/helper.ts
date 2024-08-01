import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type TailwindColor = string | { [key: string]: TailwindColor };

type TailwindColors = { [key: string]: TailwindColor };

export function loadTailwindColors(): { [key: string]: string } | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    console.log('No workspace folder is open');
    return null;
  }

  const configPath = path.join(workspaceFolders[0].uri.fsPath, 'tailwind.config.js');

  if (!fs.existsSync(configPath)) {
    console.log('tailwind.config.js not found');
    return null;
  }

  try {
    delete require.cache[require.resolve(configPath)]; // Clear the cache
    const config = require(configPath);
    const colors = config.theme?.colors || config.theme?.extend?.colors;

    if (!colors) {
      console.log('No colors found in tailwind.config.js');
      return null;
    }

    return flattenColors(colors);

  } catch (error) {
    console.error('Error loading tailwind.config.js:', error);
    return null;
  }
}


function flattenColors(colors: TailwindColors, prefix = ''): { [key: string]: string } {
  let result: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(colors)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string') {
      if (value.startsWith('#') || value.startsWith('rgb')) {
        result[newKey] = value;
      }
    } else if (typeof value === 'object') {
      // Recursively flatten nested objects
      const nestedColors = flattenColors(value, newKey);
      Object.assign(result, nestedColors);
    }
  }
  return result;
}
