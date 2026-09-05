#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const path = require('path');

function startWebServer(port = 3000) {
  const htmlPath = path.join(__dirname, 'index.html');
  const server = http.createServer((req, res) => {
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('Web UI not found');
    }
  });

  server.listen(port, () => {
    console.log(`ASCII Diagram Studio running at http://localhost:${port}`);
  });
}

function renderBox(title, subtitle = '') {
  const content = subtitle ? `${title}\n${subtitle}` : title;
  const lines = content.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length), 10);
  const width = maxLen + 4;

  const top = '┌' + '─'.repeat(width) + '┐';
  const bottom = '└' + '─'.repeat(width) + '┘';

  const middle = lines.map(line => {
    const pad = width - line.length - 2;
    const padLeft = Math.floor(pad / 2);
    const padRight = pad - padLeft;
    return `│ ${' '.repeat(padLeft)}${line}${' '.repeat(padRight)} │`;
  });

  return [top, ...middle, bottom].join('\n');
}

function renderFlowchart(steps) {
  const boxes = steps.map(s => {
    const len = s.length;
    const top = '┌' + '─'.repeat(len + 2) + '┐';
    const mid = `│ ${s} │`;
    const bot = '└' + '─'.repeat(len + 2) + '┘';
    return [top, mid, bot];
  });

  const arrow = '  ───>  ';
  const arrowMid = '  ───>  ';
  const emptySpace = '        ';

  const outputLines = ['', '', ''];

  boxes.forEach((box, index) => {
    outputLines[0] += box[0];
    outputLines[1] += box[1];
    outputLines[2] += box[2];

    if (index < boxes.length - 1) {
      outputLines[0] += emptySpace;
      outputLines[1] += arrowMid;
      outputLines[2] += emptySpace;
    }
  });

  return outputLines.join('\n');
}

function renderSequence(messages) {
  // messages: [{ from: 'Client', to: 'Server', label: 'GET /users' }, ...]
  const participants = Array.from(new Set(messages.flatMap(m => [m.from, m.to])));
  if (participants.length === 0) return '';

  const colWidth = 18;
  const colCenters = participants.map((p, i) => i * colWidth + Math.floor(colWidth / 2));

  // Render headers
  let headerBoxesTop = '';
  let headerBoxesMid = '';
  let headerBoxesBot = '';

  participants.forEach(p => {
    const boxWidth = Math.min(colWidth - 2, Math.max(p.length + 2, 8));
    const pad = Math.floor((colWidth - boxWidth) / 2);
    const textPad = boxWidth - 2 - p.length;
    const lPad = Math.floor(textPad / 2);
    const rPad = textPad - lPad;

    const top = ' '.repeat(pad) + '┌' + '─'.repeat(boxWidth - 2) + '┐' + ' '.repeat(colWidth - pad - boxWidth);
    const mid = ' '.repeat(pad) + '│' + ' '.repeat(lPad) + p + ' '.repeat(rPad) + '│' + ' '.repeat(colWidth - pad - boxWidth);
    const bot = ' '.repeat(pad) + '└' + '─'.repeat(boxWidth - 2) + '┘' + ' '.repeat(colWidth - pad - boxWidth);

    headerBoxesTop += top;
    headerBoxesMid += mid;
    headerBoxesBot += bot;
  });

  const lifelines = () => participants.map(() => {
    const pad = Math.floor(colWidth / 2);
    return ' '.repeat(pad) + '│' + ' '.repeat(colWidth - pad - 1);
  }).join('');

  const result = [headerBoxesTop, headerBoxesMid, headerBoxesBot, lifelines()];

  messages.forEach(m => {
    const fromIdx = participants.indexOf(m.from);
    const toIdx = participants.indexOf(m.to);
    const leftIdx = Math.min(fromIdx, toIdx);
    const rightIdx = Math.max(fromIdx, toIdx);

    const leftPos = colCenters[leftIdx];
    const rightPos = colCenters[rightIdx];
    const spanWidth = rightPos - leftPos;

    const isLeftToRight = fromIdx < toIdx;
    let arrowLine = '';

    if (isLeftToRight) {
      arrowLine = '─'.repeat(spanWidth - 1) + '>';
    } else {
      arrowLine = '<' + '─'.repeat(spanWidth - 1);
    }

    // Position the label above arrow
    const labelPad = Math.max(0, Math.floor((spanWidth - m.label.length) / 2));
    let labelRow = ' '.repeat(leftPos) + ' '.repeat(labelPad) + m.label;
    let arrowRow = ' '.repeat(leftPos) + arrowLine;

    // Overlay vertical lifelines on the left and right positions
    participants.forEach((p, idx) => {
      const pos = colCenters[idx];
      if (idx < leftIdx || idx > rightIdx) {
        if (labelRow.length <= pos) labelRow = labelRow.padEnd(pos, ' ') + '│';
        else labelRow = labelRow.substring(0, pos) + '│' + labelRow.substring(pos + 1);

        if (arrowRow.length <= pos) arrowRow = arrowRow.padEnd(pos, ' ') + '│';
        else arrowRow = arrowRow.substring(0, pos) + '│' + arrowRow.substring(pos + 1);
      }
    });

    result.push(labelRow);
    result.push(arrowRow);
    result.push(lifelines());
  });

  return result.join('\n');
}

function parseDiagramDSL(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const outputs = [];

  let currentType = null;
  let buffer = [];

  for (const line of lines) {
    if (line.startsWith('flowchart:')) {
      currentType = 'flowchart';
      buffer = [];
    } else if (line.startsWith('sequence:')) {
      currentType = 'sequence';
      buffer = [];
    } else if (line.startsWith('box:')) {
      const parts = line.replace('box:', '').trim().split('|').map(s => s.trim());
      outputs.push(renderBox(parts[0], parts[1] || ''));
    } else if (currentType === 'flowchart') {
      const steps = line.split('->').map(s => s.trim()).filter(Boolean);
      if (steps.length > 1) {
        outputs.push(renderFlowchart(steps));
      }
    } else if (currentType === 'sequence') {
      const match = line.match(/^(.+?)\s*->\s*(.+?)\s*:\s*(.+)$/);
      if (match) {
        buffer.push({ from: match[1].trim(), to: match[2].trim(), label: match[3].trim() });
      }
    }
  }

  if (currentType === 'sequence' && buffer.length > 0) {
    outputs.push(renderSequence(buffer));
  }

  return outputs.join('\n\n');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--web')) {
    const portIndex = args.indexOf('--web');
    const port = parseInt(args[portIndex + 1], 10) || 3000;
    startWebServer(port);
    return;
  }

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
ASCII Diagram Generator
Convert simple text descriptions into clean ASCII flowcharts and sequence diagrams.

Usage:
  node index.js <file.txt>
  node index.js --web [port]

DSL Syntax:
  box: Title | Subtitle

  flowchart:
    Client -> Proxy -> Backend -> DB

  sequence:
    Client -> API: POST /login
    API -> AuthDB: Verify Token
    AuthDB -> API: Token Valid
    API -> Client: 200 OK (JWT)
`);
    process.exit(0);
  }

  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File '${filePath}' does not exist.`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const rendered = parseDiagramDSL(content);
  console.log('\n' + rendered + '\n');
}

if (require.main === module) {
  main();
}

module.exports = { renderBox, renderFlowchart, renderSequence, parseDiagramDSL };
