# ascii-diagram-generator

A zero-dependency CLI tool to generate clean ASCII architecture boxes, linear flowcharts, and multi-actor sequence diagrams from human-readable text definitions.

## What it does

Parses a minimal DSL (Domain-Specific Language) and outputs beautifully aligned Unicode / ASCII box diagrams, dataflow pipelines, and interactive sequence lifelines directly to standard output.

## Features

- **Zero dependencies**: Pure Node.js standard library.
- **Multiple diagram types**:
  - **Boxes**: Highlight services, ports, and metadata with centered titles and subtitles.
  - **Flowcharts**: `A -> B -> C` pipelines connected with clean directional arrows.
  - **Sequence diagrams**: Multi-participant lifelines with request-response message arrows.
- **Easy DSL**: Plain text syntax that is easy to write, diff, and maintain in Git.

## Setup

Requires Node.js (v14+). No external dependencies.

```bash
cd ascii-diagram-generator
```

## Run command

```bash
node index.js sample-workflow.txt
```

Or via npm:
```bash
npm start
```

## Example usage

Create a file `diagram.txt`:

```text
box: Payment Service | v2.4.0

flowchart:
  Order -> Checkout -> Stripe -> Receipt

sequence:
  Client -> API: POST /charge
  API -> Stripe: Create PaymentIntent
  Stripe -> API: Succeeded
  API -> Client: 200 Paid
```

Render it:
```bash
node index.js diagram.txt
```
