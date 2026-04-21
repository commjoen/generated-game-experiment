import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('GitHub MCP Server', () => {
  it('should be installed and accessible', () => {
    // Test that github-mcp-server is installed as dependency
    const packageJsonContent = fs.readFileSync(
      path.resolve(__dirname, '../package.json'),
      'utf-8'
    );
    const packageJson = JSON.parse(packageJsonContent);
    const githubMcpServerVersion =
      packageJson.dependencies?.['github-mcp-server'] ||
      packageJson.devDependencies?.['github-mcp-server'];
    expect(githubMcpServerVersion).toBeDefined();
    expect(githubMcpServerVersion).toMatch(/^\^1\.\d+\.\d+$/);
  });

  it('should provide MCP scripts in package.json', () => {
    const packageJsonContent = fs.readFileSync(
      path.resolve(__dirname, '../package.json'),
      'utf-8'
    );
    const packageJson = JSON.parse(packageJsonContent);
    expect(packageJson.scripts).toHaveProperty('mcp');
    expect(packageJson.scripts).toHaveProperty('mcp:help');
    expect(packageJson.scripts).toHaveProperty('git:status');
    expect(packageJson.scripts).toHaveProperty('git:flow');
  });

  it('should have working CLI commands', () => {
    // Test that gstatus command is available and executable
    const result = execSync('npx gstatus', {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8',
    });

    expect(result).toContain('Working Directory');
    expect(result).toContain('generated-game-experiment');
  });

  it('should provide help output', () => {
    const result = execSync('npm run mcp:help', {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8',
    });

    expect(result).toContain('GitHub MCP Server');
    expect(result).toContain('Git Operations CLI');
    expect(result).toContain('Basic Git Operations');
    expect(result).toContain('Advanced Git Operations');
  });

  it('should have all essential CLI aliases available', () => {
    const essentialCommands = [
      'gstatus',
      'gadd',
      'gcommit',
      'gpush',
      'gpull',
      'gbranch',
      'gcheckout',
      'glog',
      'gdiff',
      'gstash',
    ];

    for (const command of essentialCommands) {
      expect(() => {
        execSync(`which ${command}`, {
          cwd: path.resolve(__dirname, '..'),
          stdio: 'pipe',
        });
      }).not.toThrow();
    }
  });
});
