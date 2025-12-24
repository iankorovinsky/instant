#!/usr/bin/env node

const { spawn } = require('child_process');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const path = require('path');
const fs = require('fs');

// Get project root (2 levels up from this script)
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Service definitions
const SERVICES = [
  {
    id: 'temporal-server',
    name: 'Temporal Server',
    cmd: 'temporal',
    args: ['server', 'start-dev'],
    cwd: PROJECT_ROOT,
    color: 'cyan',
  },
  {
    id: 'temporal-worker',
    name: 'Temporal Worker',
    cmd: 'go',
    args: ['run', 'main.go'],
    cwd: path.join(PROJECT_ROOT, 'services/temporal/worker'),
    color: 'blue',
  },
  {
    id: 'go-api',
    name: 'Go API',
    cmd: 'go',
    args: ['run', 'main.go'],
    cwd: path.join(PROJECT_ROOT, 'services/api'),
    color: 'green',
  },
  {
    id: 'python-agent',
    name: 'Python Agent',
    cmd: 'uv',
    args: ['run', 'fastapi', 'dev'],
    cwd: path.join(PROJECT_ROOT, 'agent'),
    color: 'yellow',
  },
  {
    id: 'nextjs-client',
    name: 'Next.js Client',
    cmd: 'bunx',
    args: ['next', 'dev'],
    cwd: path.join(PROJECT_ROOT, 'client'),
    color: 'magenta',
  },
];

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Instant Services',
  fullUnicode: true,
});

// Create grid layout: 1 row, 12 columns
const grid = new contrib.grid({
  rows: 1,
  cols: 12,
  screen: screen,
});

// Left sidebar - process list (2 columns wide)
const sidebar = grid.set(0, 0, 1, 2, blessed.list, {
  label: ' Services ',
  keys: true,
  vi: true,
  mouse: true,
  style: {
    selected: {
      bg: 'blue',
      fg: 'white',
      bold: true,
    },
    item: {
      fg: 'white',
    },
  },
  items: SERVICES.map(s => s.name),
});

// Create log views for each service (right side, 10 columns wide)
const logs = {};
SERVICES.forEach((service) => {
  logs[service.id] = grid.set(0, 2, 1, 10, contrib.log, {
    label: ` ${service.name} `,
    fg: service.color,
    selectedFg: service.color,
    style: {
      border: {
        fg: service.color,
      },
    },
  });
  // Hide all initially
  logs[service.id].hide();
});

let currentView = SERVICES[0].id;

// Show first service by default
logs[currentView].show();

// Color helper function
const colorize = (text, color) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };
  return `${colors[color] || ''}${text}${colors.reset}`;
};

// Spawn processes
const processes = {};

SERVICES.forEach((service) => {
  const log = logs[service.id];
  
  log.log(colorize(`Starting ${service.name}...`, 'yellow'));
  log.log(`Command: ${service.cmd} ${service.args.join(' ')}`);
  log.log(`CWD: ${service.cwd}`);
  log.log('');

  const proc = spawn(service.cmd, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: false,
  });

  processes[service.id] = proc;

  // Handle process errors
  proc.on('error', (err) => {
    log.log(colorize(`Error starting ${service.name}: ${err.message}`, 'red'));
    if (err.code === 'ENOENT') {
      log.log(colorize(`Command '${service.cmd}' not found. Please install it.`, 'red'));
    }
  });

  proc.on('exit', (code, signal) => {
    if (signal) {
      log.log(colorize(`Process ${service.name} exited with signal ${signal}`, 'yellow'));
    } else {
      log.log(colorize(`Process ${service.name} exited with code ${code}`, code === 0 ? 'green' : 'red'));
    }
  });

  // Pipe stdout
  proc.stdout.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line) => line.trim());
    lines.forEach((line) => log.log(line));
  });

  // Pipe stderr
  proc.stderr.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line) => line.trim());
    lines.forEach((line) => log.log(colorize(line, 'red')));
  });
});

// Function to switch view
const switchView = (selectedId) => {
  if (selectedId !== currentView && logs[selectedId]) {
    currentView = selectedId;

    // Hide all logs
    Object.values(logs).forEach((log) => log.hide());

    // Show selected log
    logs[currentView].show();
    screen.render();
  }
};

// Handle sidebar selection
sidebar.on('select', (item) => {
  const selectedName = sidebar.getItem(item).content.trim();
  const selectedService = SERVICES.find((s) => s.name === selectedName);
  if (selectedService) {
    switchView(selectedService.id);
  }
});

// Auto-switch on arrow key navigation
const originalUp = sidebar.up.bind(sidebar);
const originalDown = sidebar.down.bind(sidebar);

sidebar.up = function () {
  const oldIndex = this.selected;
  originalUp();
  if (this.selected !== oldIndex) {
    const selectedService = SERVICES[this.selected];
    if (selectedService) {
      switchView(selectedService.id);
    }
  }
};

sidebar.down = function () {
  const oldIndex = this.selected;
  originalDown();
  if (this.selected !== oldIndex) {
    const selectedService = SERVICES[this.selected];
    if (selectedService) {
      switchView(selectedService.id);
    }
  }
};

// Focus sidebar for navigation
sidebar.focus();

// Quit handler
const quit = () => {
  // Kill all processes
  Object.values(processes).forEach((proc) => {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    // Force kill if still running
    Object.values(processes).forEach((proc) => {
      if (proc && !proc.killed) {
        proc.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 1000);
};

screen.key(['q', 'C-c'], quit);

// Initial selection
sidebar.select(0);
screen.render();

