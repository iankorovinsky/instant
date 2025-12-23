# Temporal Service Files

This directory contains systemd service configuration files for running Temporal Server and workers on Linux servers.

## Files

- `temporal-server.service` - Systemd service file for the Temporal Server (runs `temporal server start-dev`)
- `temporal-worker.service` - Systemd service file for the Temporal Worker process

## Usage

To use these service files on a Linux server:

1. Copy the service file to `/etc/systemd/system/`:
   ```bash
   sudo cp temporal-server.service /etc/systemd/system/
   sudo cp temporal-worker.service /etc/systemd/system/
   ```

2. Reload systemd to recognize the new services:
   ```bash
   sudo systemctl daemon-reload
   ```

3. Enable the services to start on boot:
   ```bash
   sudo systemctl enable temporal-server.service
   sudo systemctl enable temporal-worker.service
   ```

4. Start the services:
   ```bash
   sudo systemctl start temporal-server
   sudo systemctl start temporal-worker
   ```

5. Check status:
   ```bash
   sudo systemctl status temporal-server
   sudo systemctl status temporal-worker
   ```