# ZetaChain CLI

A command-line interface for building and interacting with
[ZetaChain](https://www.zetachain.com) universal applications. Seamlessly
interact with EVM, Solana, Bitcoin, Sui, and TON, all from one CLI.

## ✨ Features

- Scaffold new ZetaChain universal apps from templates
- Spin up a local multi-chain development environment (EVM, Solana, etc.) in one
  command
- Query cross-chain fees, contracts, balances, cross-chain transaction, tokens,
  and more
- Make cross-chain calls between Solana, Sui, Bitcoin, TON, and universal apps
  on ZetaChain
- Transfer supported tokens across connected chains

## ✅ Prerequisites

- Node.js ≥ 18
- Git (for template cloning)
- (Optional) Docker ≥ 24 for `localnet`

## 🚀 Quick Start

Run without installing:

```bash
npx zetachain@next new
```

Or install globally:

```bash
npm install -g zetachain@latest
```

Use `zetachain@next` for bleeding-edge builds.

## 📘 Examples

Create a new project:

```bash
zetachain new
```

Start localnet:

```bash
zetachain localnet start
```

Query cross-chain balances:

```bash
zetachain query balances
```

## 🤖 MCP Server Installation

The ZetaChain CLI can be used as an MCP (Model Context Protocol) server, allowing AI assistants like Claude Code and Cursor to execute ZetaChain commands.

### Local Installation (Recommended)

Install locally for full access to your filesystem, accounts, and localnet:

```bash
npm install -g zetachain
zetachain mcp install --client claude    # for Claude Code
# or
zetachain mcp install --client cursor    # for Cursor
```

Then restart your AI editor to activate the MCP server.

**Check installation status:**
```bash
zetachain mcp list
```

**Remove:**
```bash
zetachain mcp remove --client claude
```

### Cloud Installation (Smithery)

For quick setup without local installation, visit [Smithery](https://smithery.ai/server/@zeta-chain/cli) and click "One-Click Install".

⚠️ **Note**: The cloud version runs on remote servers and cannot access your local files, accounts, or localnet.

## 🧭 CLI Reference

For full command documentation:

```bash
zetachain docs
```

Or use `--help` with any command:

```bash
zetachain accounts --help
```

## 🤝 Contributing

We welcome contributions! Please open issues or submit pull requests.

## 📚 Learn More

- [ZetaChain Docs](https://www.zetachain.com/docs)
- [CLI Docs](https://www.zetachain.com/docs/reference/cli/)
- [Join Discord](https://discord.gg/zetachain)
