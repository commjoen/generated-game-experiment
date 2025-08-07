# Pre-commit Configuration

This repository uses [pre-commit](https://pre-commit.com/) to ensure code quality and consistency across GitHub Actions workflows, TypeScript source code, and test files.

## Setup

1. Install pre-commit:

   ```bash
   pip install pre-commit
   ```

2. Install the hooks:
   ```bash
   pre-commit install
   ```

## Hooks Included

### General Code Quality

- **trailing-whitespace**: Removes trailing whitespace
- **end-of-file-fixer**: Ensures files end with a newline
- **check-yaml**: Validates YAML syntax (including GitHub Actions)
- **check-json**: Validates JSON syntax
- **check-merge-conflict**: Prevents committing merge conflict markers
- **check-case-conflict**: Prevents case conflicts on case-insensitive filesystems
- **check-added-large-files**: Prevents committing large files

### GitHub Actions Specific

- **actionlint**: Validates GitHub Actions workflow files using [actionlint](https://github.com/rhysd/actionlint)
- **prettier**: Formats YAML files for consistency

### TypeScript/JavaScript Code Quality

- **eslint**: Lints TypeScript and JavaScript files with TypeScript-specific rules
- **prettier**: Formats TypeScript and JavaScript files for consistent code style
- **typescript-check**: Runs TypeScript compiler type checking (`tsc --noEmit`)
- **vitest-related**: Runs the test suite when TypeScript files are modified

## GitHub Actions Validation

The `actionlint` hook specifically validates:

- Workflow syntax and structure
- Job and step configuration
- Action usage and parameters
- Expression syntax (`${{ }}`)
- Common GitHub Actions best practices

## TypeScript/JavaScript Validation

The TypeScript hooks ensure:

- **Code style consistency**: Prettier formats all TypeScript/JavaScript files
- **Code quality**: ESLint catches common issues and enforces best practices
- **Type safety**: TypeScript compiler ensures type correctness
- **Test coverage**: Tests run automatically when code changes

### ESLint Configuration

The project uses a modern ESLint configuration with:

- TypeScript support via `@typescript-eslint`
- Browser environment globals (window, document, localStorage, etc.)
- Relaxed rules for test files
- Warning on `any` types, error on unused variables

### Prettier Configuration

Code formatting follows these rules:

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 80-character line width
- Trailing commas where valid

## Manual Usage

You can run pre-commit manually on all files:

```bash
pre-commit run --all-files
```

Or on specific files:

```bash
pre-commit run --files .github/workflows/release.yml
pre-commit run --files src/main.ts
```

Run specific hooks:

```bash
pre-commit run eslint --all-files
pre-commit run prettier --all-files
pre-commit run typescript-check
```

## Benefits

- **Consistent formatting**: All code follows the same formatting rules
- **Early error detection**: Catch syntax errors and type issues before pushing
- **Best practices**: Enforce coding standards automatically
- **Team consistency**: Ensure all contributors follow the same standards
- **Quality assurance**: Prevent common bugs and maintain code quality
