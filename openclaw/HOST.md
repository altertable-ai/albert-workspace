# François host checklist

OpenClaw **2026.10.5**. Merge `albert.config.example.json5` into
`~/.openclaw/openclaw.json`. Set `agents.entries.main.workspace` to this
checkout. Heartbeat settings live only under `agents.defaults.heartbeat`.
`skipBootstrap: true`. `heartbeat.lightContext: false`.

`openclaw cron` and `openclaw automations` are the same CLI. Use `cron` below.

1. Deploy the merged workspace to the live `main` checkout.
2. Apply the config and restart the Gateway.
3. Run `openclaw doctor --fix`.
4. Inspect heartbeat scratch:
   `openclaw cron scratch <heartbeat-monitor-id>`
   (list ids with `openclaw cron list --all`). If scratch still contains the old
   `HEARTBEAT.md` body, replace it:
   `openclaw cron scratch <id> --set "Due work and notifications only."`
5. Confirm dreaming is on and timezone `Europe/Paris`.
6. Fill in `<SLACK_CHANNEL_ID>` (François must set this). Create the jobs
   (isolated, no `--light-context`, Europe/Paris). Daily uses `--no-deliver` so
   it does not fall back to `announce -> last`:

```bash
openclaw cron create "0 8 * * *" \
  --name "Albert daily full sync" \
  --tz "Europe/Paris" \
  --session isolated \
  --timeout-seconds 1800 \
  --no-deliver \
  --message "Run bun scripts/sync-workspace.ts on the live main checkout if needed. Then skills/routine-sync in full mode. If repositories.config.json changed, run bun scripts/subscribe-repos.ts. Stay in rules/safety.md. Reply NO_REPLY when the pass is clean."

openclaw cron create "0 9 * * 5" \
  --name "Albert weekly report" \
  --tz "Europe/Paris" \
  --session isolated \
  --timeout-seconds 1800 \
  --announce \
  --channel slack \
  --to "<SLACK_CHANNEL_ID>" \
  --message "Run skills/ops-report for the past seven days. Post once to this Slack channel."
```

7. `/context detail` in a fresh Albert chat: injected `AGENTS.md` from this
   workspace, not a bootstrap stub.
8. Idle heartbeat: `heartbeat_respond` `notify=false` or `NO_REPLY`. No GitHub
   comments for those tokens.
