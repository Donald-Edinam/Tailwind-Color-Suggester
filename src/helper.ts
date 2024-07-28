import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type TailwindColors = { [key: string]: string };

export function loadTailwindColors(): TailwindColors | null {
  let tailwindColors: TailwindColors = {};

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    console.log('No workspace folder is open');
    return null;  // Return null if no workspace is open
  }

  const configPath = path.join(workspaceFolders[0].uri.fsPath, 'tailwind.config.js');

  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Use a regular expression to find the colors object
    const colorsMatch = configContent.match(/colors:\s*{([^}]*)}/s);

    if (colorsMatch) {
      const colorsContent = colorsMatch[1];

      // Use a regular expression to parse color definitions
      const colorRegex = /['"]?([\w-]+)['"]?\s*:\s*['"]?(#[0-9A-Fa-f]{6})['"]?/g;
      let match;

      while ((match = colorRegex.exec(colorsContent)) !== null) {
        const [, name, value] = match;
        tailwindColors[name] = value;
      }

      return tailwindColors;  // Return the parsed colors
    } else {
      console.log('No colors found in tailwind.config.js');
    }
  } else {
    console.log('tailwind.config.js not found');
  }

  return null;
}
