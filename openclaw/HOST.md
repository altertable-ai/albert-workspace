# François host checklist

OpenClaw **2026.10.5** (`da0c264`). Merge the keys in
`albert.config.example.json5` into `~/.openclaw/openclaw.json`. Point
`agents.entries.main.workspace` at this checkout. `skipBootstrap: true`.
`heartbeat.lightContext: false` always.

1. Deploy the merged workspace to the live `main` checkout.
2. Apply the config and restart the Gateway.
3. Run `openclaw doctor --fix`.
4. Inspect heartbeat scratch (`openclaw cron scratch` or Control UI). If it
   still contains the old `HEARTBEAT.md` body, **replace** it with a short
   due-work note. Do not keep the migrated file as the standing prompt.
5. Confirm dreaming is on (`plugins.entries.memory-core.config.dreaming`) and
   timezone `Europe/Paris`.
6. Create the recurring jobs (isolated session, **no** `--light-context`,
   Europe/Paris):

```bash
openclaw automations create "0 8 * * *" \
  --name "Albert daily full sync" \
  --tz "Europe/Paris" \
  --session isolated \
  --timeout-seconds 1800 \
  --message "Run bun scripts/sync-workspace.ts on the live main checkout if needed. Then skills/routine-sync in full mode. If repositories.config.json changed, run bun scripts/subscribe-repos.ts. Stay in rules/safety.md. Reply NO_REPLY when the pass is clean."

openclaw automations create "0 9 * * 5" \
  --name "Albert weekly report" \
  --tz "Europe/Paris" \
  --session isolated \
  --timeout-seconds 1800 \
  --announce \
  --message "Run skills/ops-report for the past seven days. Post once where François expects the weekly summary."
```

7. `/context detail` in a fresh Albert chat: injected `AGENTS.md` from this
   workspace, not a bootstrap stub.
8. Idle heartbeat: `heartbeat_respond` `notify=false` or `NO_REPLY`. No GitHub
   comments for those tokens.
