import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('GitHub MCP Server', () => {
  it('should be installed and accessible', () => {
    // Test that github-mcp-server is installed as dependency
    const packageJson = require('../package.json');
    expect(packageJson.dependencies).toHaveProperty('github-mcp-server');
    expect(packageJson.dependencies['github-mcp-server']).toMatch(/^\^1\.\d+\.\d+$/);
  });

  it('should provide MCP scripts in package.json', () => {
    const packageJson = require('../package.json');
    expect(packageJson.scripts).toHaveProperty('mcp');
    expect(packageJson.scripts).toHaveProperty('mcp:help');
    expect(packageJson.scripts).toHaveProperty('git:status');
    expect(packageJson.scripts).toHaveProperty('git:flow');
  });

  it('should have working CLI commands', () => {
    // Test that gstatus command is available and executable
    const result = execSync('npx gstatus', { 
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8'
    });
    
    expect(result).toContain('Working Directory');
    expect(result).toContain('generated-game-experiment');
  });

  it('should provide help output', () => {
    const result = execSync('npm run mcp:help', { 
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8'
    });
    
    expect(result).toContain('GitHub MCP Server');
    expect(result).toContain('Git Operations CLI');
    expect(result).toContain('Basic Git Operations');
    expect(result).toContain('Advanced Git Operations');
  });

  it('should have all essential CLI aliases available', () => {
    const essentialCommands = [
      'gstatus', 'gadd', 'gcommit', 'gpush', 'gpull', 
      'gbranch', 'gcheckout', 'glog', 'gdiff', 'gstash'
    ];

    for (const command of essentialCommands) {
      expect(() => {
        execSync(`which ${command}`, { 
          cwd: path.resolve(__dirname, '..'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    }
  });
});