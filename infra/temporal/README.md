# Temporal Service Files

This directory contains systemd service configuration files for running Temporal Server and workers on Linux servers.

## Files

- `temporal-server.service` - Systemd service file for the Temporal Server (runs `temporal server start-dev`)
- `temporal-worker.service` - Systemd service file for the Temporal Worker process

## Prerequisites

### Temporal CLI Installation

The Temporal CLI must be installed on the server. Common installation paths:

- **User install**: `~/.temporalio/bin/temporal` (recommended for development)
- **System install**: `/usr/local/bin/temporal`

Update the `ExecStart` path in `temporal-server.service` to match your installation path.

### Go Installation (for building worker)

If building the worker on the server, install Go:

```bash
sudo apt update
sudo apt install golang-go
```

Or install the latest version from [go.dev](https://go.dev/dl/).

### Build Worker Binary

The worker service expects a built binary. You have two options:

**Option 1: Cross-compile on your development machine (recommended)**

```bash
# On your Mac/Linux dev machine
cd /path/to/instant
GOOS=linux GOARCH=amd64 go build -o temporal-worker ./services/temporal/worker/

# Copy to server
scp temporal-worker user@server:~/instant/temporal-worker
```

**Option 2: Build on the server**

```bash
# On the Ubuntu server
cd ~/instant
go mod tidy
go build -o temporal-worker ./services/temporal/worker/
```

Make sure the binary is executable:

```bash
chmod +x ~/instant/temporal-worker
```

## Configuration

### Service File Configuration

Before copying service files to the server, update the following paths:

**temporal-server.service**:
- `ExecStart`: Path to Temporal CLI (e.g., `/home/ian/.temporalio/bin/temporal`)
- `User`: Your username (e.g., `ian`)
- `Group`: Your user group (e.g., `ian`)

**temporal-worker.service**:
- `WorkingDirectory`: Path to your project directory (e.g., `/home/ian/instant`)
- `ExecStart`: Path to the worker binary (e.g., `/home/ian/instant/temporal-worker`)
- `User`: Your username (e.g., `ian`)
- `Group`: Your user group (e.g., `ian`)

**Note**: The service files use the actual user account (not a `temporal` user) because:
1. The user install path is in the user's home directory
2. It simplifies permissions and file access

## Usage

To use these service files on a Linux server:

1. **Update service file paths** (see Configuration above)

2. **Copy the service files to `/etc/systemd/system/`**:
   ```bash
   sudo cp temporal-server.service /etc/systemd/system/
   sudo cp temporal-worker.service /etc/systemd/system/
   ```

3. **Reload systemd** to recognize the new services:
   ```bash
   sudo systemctl daemon-reload
   ```

4. **Enable the services** to start on boot:
   ```bash
   sudo systemctl enable temporal-server.service
   sudo systemctl enable temporal-worker.service
   ```

5. **Start the services**:
   ```bash
   sudo systemctl start temporal-server
   sudo systemctl start temporal-worker
   ```

6. **Check status**:
   ```bash
   sudo systemctl status temporal-server
   sudo systemctl status temporal-worker
   ```

7. **View logs**:
   ```bash
   sudo journalctl -u temporal-server -f
   sudo journalctl -u temporal-worker -f
   ```

## Troubleshooting

### Temporal Server

**Service fails to start with "Failed to determine user credential"**:
- Check that the `User` and `Group` in the service file match an existing user
- Verify the user account exists: `id <username>`

**Service fails with "No such file or directory"**:
- Verify the Temporal CLI path is correct: `which temporal` or `ls ~/.temporalio/bin/temporal`
- Update `ExecStart` path in the service file

### Temporal Worker

**Service fails with status 203/EXEC**:
- Binary architecture mismatch: Make sure you built for Linux (`GOOS=linux GOARCH=amd64`)
- Binary not executable: Run `chmod +x /path/to/temporal-worker`
- Binary path incorrect: Verify the path in `ExecStart` matches the actual location

**Service fails with status 1/FAILURE**:
- Check logs: `sudo journalctl -u temporal-worker -n 50`
- Verify Temporal server is running: `sudo systemctl status temporal-server`
- Verify worker can connect to Temporal (check for connection errors in logs)

**Missing dependencies**:
- Run `go mod tidy` in the project directory
- Ensure Go is properly installed and in PATH

## Accessing Temporal UI

Temporal dev server runs on `localhost:7233` by default. To access from your local machine:

1. **SSH port forwarding**:
   ```bash
   ssh -L 7234:localhost:7233 user@server
   ```

2. **Access in browser**: `http://localhost:7234`

Keep the SSH session open to maintain the port forward, or use `-N` flag for background forwarding:

```bash
ssh -N -L 7234:localhost:7233 user@server
```