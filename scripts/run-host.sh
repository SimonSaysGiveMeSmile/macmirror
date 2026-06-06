#!/bin/bash
# Run the Lumen host (Milestone 0 verify). Run this in YOUR OWN Terminal app
# so macOS attributes Screen Recording + Accessibility to Terminal and shows
# the permission prompts. Logs to ~/lumen.log.
export PATH="$HOME/.local/bin:$PATH:/usr/sbin:/sbin"
echo "Web UI will be at: https://localhost:47990  (login: admin / macmirror)"
echo "Logging to ~/lumen.log — Ctrl+C to stop."
exec lumen 2>&1 | tee ~/lumen.log
