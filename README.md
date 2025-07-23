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

## ✅ Requirements

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
