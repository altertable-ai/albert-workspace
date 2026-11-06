# OpenClaw setup

The [example configuration](albert.config.example.json5) uses local EmbeddingGemma
embeddings for semantic memory search. Chat keeps its existing model and sign-in.

On the Gateway host, install the provider version matching [OpenClaw](VERSION):

```sh
openclaw plugins install @openclaw/llama-cpp-provider@2026.10.5 --pin --accept-capabilities
openclaw config set memory.search.provider local
openclaw models auth login --provider llama-cpp --method local
```

Decline the chat-model download, then accept the embedding-only setup. It installs
a verified CPU runtime and the roughly 329 MB embedding model, and saves the
host’s managed service paths. Keep those generated settings when merging the
example configuration.

Rebuild and check the index after switching providers:

```sh
openclaw config validate
openclaw memory status --index --agent main
openclaw memory search --agent main --query "Which releases still need publishing?"
```

Confirm `Provider: local`, `Embeddings: ready`, and `Dirty: no`. The initial
rebuild takes longer than later updates; it does not delete memory notes or
conversation history.
