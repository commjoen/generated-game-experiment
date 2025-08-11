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

# Install pre-commit hooks if not installed
if [ ! -f .git/hooks/pre-commit ]; then
    echo "⚙️  Installing pre-commit hooks..."
    pre-commit install
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
