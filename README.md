# ascii-diagram-generator

A zero-dependency CLI tool and interactive Web Studio to generate clean ASCII architecture boxes, linear flowcharts, and multi-actor sequence diagrams from plain text.

## What it does

Parses a minimal DSL and renders beautifully formatted ASCII art boxes, flowcharts, and sequence lifelines directly in the terminal or in your browser with real-time editing and copy-to-clipboard support.

## Features

- **Interactive Web Studio**: Live DSL editor with instant ASCII preview, template inserts, and export.
- **Zero dependencies**: Pure Node.js and standard Web APIs.
- **Multiple diagram types**:
  - **Boxes**: Highlight services, ports, and metadata with centered titles and subtitles.
  - **Flowcharts**: `A -> B -> C` pipelines connected with directional arrows.
  - **Sequence diagrams**: Multi-participant lifelines with request-response message arrows.
- **CLI & Web support**: Seamlessly use via command line or in your browser.

## Setup

Requires Node.js (v14+). No external dependencies.

```bash
cd ascii-diagram-generator
```

## Run command

### Launch Web Studio
```bash
node index.js --web
# Open http://localhost:3000
```
*(Or open `index.html` directly in your browser)*

### CLI Usage
```bash
node index.js sample-workflow.txt
```

## Example usage

```bash
# Launch web studio on custom port
node index.js --web 8080

# Render from text file to terminal
node index.js sample-workflow.txt
```
