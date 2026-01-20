#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const path = require('path');
const fs = require('fs');

// Get project root (2 levels up from this script)
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Port mappings for services
const SERVICE_PORTS = {
  'temporal-server': [7233, 8088], // Temporal server + UI
  'go-api': [8080],
  'python-agent': [8000],
  'nextjs-client': [3000],
};

// Check if air is installed (for hot reload)
function hasAir() {
  try {
    const result = execSync('which air', { stdio: 'pipe', encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

const AIR_AVAILABLE = hasAir();

// Service definitions
const SERVICES = [
  {
    id: 'temporal-server',
    name: 'Temporal Server',
    cmd: 'temporal',
    args: ['server', 'start-dev'],
    cwd: PROJECT_ROOT,
    color: 'cyan',
    ports: SERVICE_PORTS['temporal-server'],
  },
  {
    id: 'temporal-worker',
    name: 'Temporal Worker',
    cmd: AIR_AVAILABLE ? 'air' : 'go',
    args: AIR_AVAILABLE ? [] : ['run', 'main.go'],
    cwd: path.join(PROJECT_ROOT, 'services/temporal/worker'),
    color: 'blue',
    ports: [],
  },
  {
    id: 'go-api',
    name: 'Go API',
    cmd: AIR_AVAILABLE ? 'air' : 'go',
    args: AIR_AVAILABLE ? [] : ['run', 'main.go'],
    cwd: path.join(PROJECT_ROOT, 'services/api'),
    color: 'green',
    ports: SERVICE_PORTS['go-api'],
  },
  {
    id: 'python-agent',
    name: 'Python Agent',
    cmd: 'uv',
    args: ['run', 'fastapi', 'dev'],
    cwd: path.join(PROJECT_ROOT, 'agent'),
    color: 'yellow',
    ports: SERVICE_PORTS['python-agent'],
  },
  {
    id: 'nextjs-client',
    name: 'Next.js Client',
    cmd: 'bunx',
    args: ['next', 'dev'],
    cwd: path.join(PROJECT_ROOT, 'client'),
    color: 'magenta',
    ports: SERVICE_PORTS['nextjs-client'],
  },
];

// Function to kill process on a port
function killProcessOnPort(port) {
  try {
    // Find process using the port (macOS/Linux)
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (result) {
      const pids = result.split('\n').filter(pid => pid.trim());
      pids.forEach(pid => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
          console.log(`Killed process ${pid} on port ${port}`);
        } catch (err) {
          // Process might have already exited
        }
      });
      return true;
    }
  } catch (err) {
    // No process found on port, which is fine
    return false;
  }
  return false;
}

// Function to kill processes on all service ports
function killPortProcesses() {
  const killed = [];
  SERVICES.forEach(service => {
    if (service.ports && service.ports.length > 0) {
      service.ports.forEach(port => {
        if (killProcessOnPort(port)) {
          killed.push({ port, service: service.name });
        }
      });
    }
  });
  return killed;
}

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
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'cyan'
      },
      style: {
        inverse: true
      }
    },
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

// Kill processes on ports before starting services
const killedPorts = killPortProcesses();
if (killedPorts.length > 0) {
  const startupLog = logs[SERVICES[0].id];
  startupLog.log(colorize('Port cleanup:', 'yellow'));
  killedPorts.forEach(({ port, service }) => {
    startupLog.log(colorize(`  Killed process on port ${port} (${service})`, 'yellow'));
  });
  startupLog.log('');
  screen.render();
}

// Spawn processes
const processes = {};

SERVICES.forEach((service) => {
  const log = logs[service.id];
  
  log.log(colorize(`Starting ${service.name}...`, 'yellow'));
  const cmdDisplay = service.args.length > 0 
    ? `${service.cmd} ${service.args.join(' ')}`
    : service.cmd;
  log.log(`Command: ${cmdDisplay}`);
  log.log(`CWD: ${service.cwd}`);
  if (AIR_AVAILABLE && (service.id === 'go-api' || service.id === 'temporal-worker')) {
    log.log(colorize('Hot reload: enabled (air)', 'green'));
  } else if (service.id === 'go-api' || service.id === 'temporal-worker') {
    log.log(colorize('Hot reload: disabled (install air: go install github.com/air-verse/air@latest)', 'yellow'));
  }
  if (service.ports && service.ports.length > 0) {
    log.log(`Ports: ${service.ports.join(', ')}`);
  }
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
    // Remove focus from previous log
    if (logs[currentView]) {
      logs[currentView].detach();
    }
    
    currentView = selectedId;

    // Hide all logs
    Object.values(logs).forEach((log) => log.hide());

    // Show selected log
    logs[currentView].show();
    
    // Focus on log for scrolling
    logs[currentView].focus();
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

// Focus sidebar for navigation (can Tab to log view for scrolling)
sidebar.focus();

// Add Tab key to switch focus between sidebar and log view
screen.key(['tab'], () => {
  if (screen.focused === sidebar) {
    logs[currentView].focus();
  } else {
    sidebar.focus();
  }
  screen.render();
});

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

// Add scroll keys for log views
SERVICES.forEach((service) => {
  const log = logs[service.id];
  log.key(['pageup', 'C-b'], () => {
    log.scroll(-Math.floor(log.height * 0.8));
    screen.render();
  });
  log.key(['pagedown', 'C-f'], () => {
    log.scroll(Math.floor(log.height * 0.8));
    screen.render();
  });
  log.key(['up', 'k'], () => {
    log.scroll(-1);
    screen.render();
  });
  log.key(['down', 'j'], () => {
    log.scroll(1);
    screen.render();
  });
  log.key(['home', 'g'], () => {
    log.setScrollPerc(0);
    screen.render();
  });
  log.key(['end', 'G'], () => {
    log.setScrollPerc(100);
    screen.render();
  });
});

// Initial selection
sidebar.select(0);
screen.render();

