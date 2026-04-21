#!/bin/bash
# Pre-commit validation script
# This script ensures all pre-commit checks pass before committing

set -e

echo "🔍 Running pre-commit validation..."

# Install pre-commit if not available
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."
    pip install pre-commit
fi

# Install pre-commit hooks if not installed (skip when hooksPath is managed externally)
if [ ! -f .git/hooks/pre-commit ]; then
    if git config --get core.hooksPath >/dev/null; then
        echo "ℹ️  Skipping pre-commit hook install because core.hooksPath is set"
    else
        echo "⚙️  Installing pre-commit hooks..."
        pre-commit install
    fi
fi

# Ensure dependencies are installed
if [ ! -d node_modules ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Run all pre-commit checks
echo "✅ Running pre-commit checks..."
pre-commit run --all-files

echo "🎉 All pre-commit checks passed!"
