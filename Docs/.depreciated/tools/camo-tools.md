# camo Tools

A comprehensive toolset for processing camoMetaData syntax files.

## Features

- Syntax validation and linting
- Multiple export formats (HTML, Markdown, Graphviz DOT)
- Live preview server with syntax highlighting
- Command-line interface for all operations

## Installation

### Development Installation

```bash
# Install in development mode with all dev tools
pip install -e ".[dev]"
```

### Regular Installation

```bash
pip install -e .
```

## Usage

Once installed, the following commands are available:

```bash
# Process a camoMetaData file
camoMetaData example.bman --html --markdown --dot --preview

# Lint a camoMetaData file
bmanlint example.bman

# Format a camoMetaData file
bmanfmt example.bman
```

## Development

This project uses several development tools configured in pyproject.toml:

- **Black**: Code formatting

  ```bash
  black src/
  ```

- **isort**: Import sorting

  ```bash
  isort src/
  ```

- **Flake8**: Code linting

  ```bash
  flake8 src/
  ```

- **mypy**: Static type checking

  ```bash
  mypy src/
  ```

- **pytest**: Testing
  ```bash
  pytest
  ```

## Project Structure

- `src/`: Core source code
- `src/exporters/`: Output format generators
- `src/static/`: Static assets (CSS, etc.) for preview server
- `src/github_actions/`: Linting and formatting tools