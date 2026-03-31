import fs from 'fs';
import path from 'path';

const AGENTS_DIR = path.resolve(process.cwd(), 'src/agents');
const TARGET_FILE = path.resolve(process.cwd(), 'AGENTS.md');

async function main() {
  console.log('Updating AGENTS.md...');
  
  if (!fs.existsSync(AGENTS_DIR)) {
      console.error('Agents directory not found.');
      return;
  }
  
  const workspaces = fs.readdirSync(AGENTS_DIR).filter(f => f.startsWith('workspace-'));
  
  let content = `# AI Financial Assistant Agents\n\n`;
  content += `This file is auto-generated.\n\n`;
  content += `## Active Agents\n\n`;
  
  for (const ws of workspaces) {
      const name = ws.replace('workspace-', '');
      content += `### ${name.toUpperCase().replace('-', ' ')}\n`;
      
      const identityPath = path.join(AGENTS_DIR, ws, 'IDENTITY.md');
      if (fs.existsSync(identityPath)) {
          const identity = fs.readFileSync(identityPath, 'utf-8');
          const roleMatch = identity.match(/Role\s*(.*)/i);
          if (roleMatch) {
              content += `- **Role**: ${roleMatch[1].trim()}\n`;
          }
      }
      
      const soulPath = path.join(AGENTS_DIR, ws, 'SOUL.md');
      if (fs.existsSync(soulPath)) {
          const soul = fs.readFileSync(soulPath, 'utf-8');
          const objMatch = soul.match(/Core Objective\s*(.*)/i);
           if (objMatch) {
              content += `- **Objective**: ${objMatch[1].trim()}\n`;
          }
      }
      
      content += `\n`;
  }
  
  fs.writeFileSync(TARGET_FILE, content, 'utf-8');
  console.log(`Updated AGENTS.md with ${workspaces.length} agents.`);
}

main();
