# Pre-commit Configuration

This repository uses [pre-commit](https://pre-commit.com/) to ensure code quality and consistency, particularly for GitHub Actions workflows.

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

## GitHub Actions Validation

The `actionlint` hook specifically validates:
- Workflow syntax and structure
- Job and step configuration
- Action usage and parameters
- Expression syntax (`${{ }}`)
- Common GitHub Actions best practices

## Manual Usage

You can run pre-commit manually on all files:
```bash
pre-commit run --all-files
```

Or on specific files:
```bash
pre-commit run --files .github/workflows/release.yml
```

## Benefits

- **Consistent formatting**: All YAML files follow the same formatting rules
- **Early error detection**: Catch workflow syntax errors before pushing
- **Best practices**: Enforce GitHub Actions best practices automatically
- **Team consistency**: Ensure all contributors follow the same standards