
## zetachain new

```
Usage: zetachain new [options]

Create a new universal contract project.

Options:
  --verbose                Enable verbose logging
  --output <directory>     Specify custom output directory or name
  --project <projectName>  Specify the example project to use and skip the
                           prompt
  -h, --help               display help for command

```

## zetachain accounts

```
Usage: zetachain accounts [options] [command]

Account management commands

Options:
  -h, --help        display help for command

Commands:
  create [options]  Create a new account
  delete [options]  Delete an existing account
  import [options]  Import an existing account using either a private key or a
                    mnemonic
  list [options]    List all available accounts
  show [options]    Show details of an existing account

```

## zetachain accounts create

```
Usage: zetachain accounts create [options]

Create a new account

Options:
  --type <type>  Account type (choices: "evm", "solana", "sui", "bitcoin",
                 "ton")
  --name <name>  Account name (default: "default")
  -h, --help     display help for command

```

## zetachain accounts delete

```
Usage: zetachain accounts delete [options]

Delete an existing account

Options:
  --type <type>  Account type (choices: "evm", "solana", "sui", "bitcoin",
                 "ton")
  --name <name>  Account name
  -h, --help     display help for command

```

## zetachain accounts import

```
Usage: zetachain accounts import [options]

Import an existing account using either a private key or a mnemonic

Options:
  --type <type>        Account type (choices: "evm", "solana", "sui", "bitcoin",
                       "ton")
  --name <name>        Account name (default: "default")
  --private-key <key>  Private key in hex format
  --mnemonic <phrase>  Mnemonic phrase
  -h, --help           display help for command

```

## zetachain accounts list

```
Usage: zetachain accounts list [options]

List all available accounts

Options:
  --json      Output in JSON format
  -h, --help  display help for command

```

## zetachain accounts show

```
Usage: zetachain accounts show [options]

Show details of an existing account

Options:
  --type <type>  Account type (choices: "evm", "solana", "sui", "bitcoin",
                 "ton")
  --name <name>  Account name
  -h, --help     display help for command

```

## zetachain query

```
Usage: zetachain query [options] [command]

Query commands

Options:
  -h, --help          display help for command

Commands:
  balances [options]  Fetch native and ZETA token balances
  cctx [options]      Query cross-chain transaction data in real-time

```

## zetachain query balances

```
Usage: zetachain query balances [options]

Fetch native and ZETA token balances

Options:
  --evm <address>      Fetch balances for a specific EVM address
  --solana <address>   Fetch balances for a specific Solana address
  --bitcoin <address>  Fetch balances for a specific Bitcoin address
  --sui <address>      Fetch balances for a specific Sui address
  --ton <address>      Fetch balances for a specific TON address
  --name <name>        Account name
  --network <network>  Network to use (choices: "mainnet", "testnet", default:
                       "testnet")
  --json               Output balances as JSON
  -h, --help           display help for command

```

## zetachain query cctx

```
Usage: zetachain query cctx [options]

Query cross-chain transaction data in real-time

Options:
  -h, --hash <hash>   Inbound transaction hash
  -r, --rpc <rpc>     RPC endpoint (default:
                      "https://zetachain-athens.blockpi.network/lcd/v1/public")
  -d, --delay <ms>    Delay between polling rounds in milliseconds (default:
                      "2000")
  -t, --timeout <ms>  Timeout duration in milliseconds (default: indefinite)
                      (default: "0")
  --help              display help for command

```

## zetachain zetachain

```
Usage: zetachain zetachain|z [options] [command]

ZetaChain commands

Options:
  -h, --help                   display help for command

Commands:
  call [options]               Call a contract on a connected chain from
                               ZetaChain
  withdraw [options]           Withdraw tokens from ZetaChain to a connected
                               chain
  withdraw-and-call [options]  Withdraw tokens from ZetaChain and call a
                               contract on a connected chain

```

## zetachain zetachain call

```
Usage: zetachain zetachain call [options]

Call a contract on a connected chain from ZetaChain

Options:
  --zrc20 <address>                 The address of ZRC-20 to pay fees
  --receiver <address>              The address of the receiver contract on a
                                    connected chain. Non-hex strings will be
                                    automatically encoded to hex.
  --name <name>                     Account name (default: "default")
  --network <network>               Network to use (choices: "mainnet",
                                    "testnet", default: "testnet")
  --private-key <key>               Private key for signing transactions
  --gateway-zetachain <address>     Gateway contract address on ZetaChain
  --revert-address <address>        Revert address (default:
                                    "0x0000000000000000000000000000000000000000")
  --abort-address <address>         Abort address (default:
                                    "0x0000000000000000000000000000000000000000")
  --call-on-revert                  Whether to call on revert (default: false)
  --on-revert-gas-limit <limit>     Gas limit for the revert transaction
                                    (default: "7000000")
  --revert-message <message>        Revert message (default: "0x")
  --tx-options-gas-limit <limit>    Gas limit for the transaction (default:
                                    "7000000")
  --tx-options-gas-price <price>    Gas price for the transaction (default:
                                    "10000000000")
  --call-options-gas-limit <limit>  Gas limit for the call (default: "7000000")
  --call-options-is-arbitrary-call  Call any function (default: false)
  --yes                             Skip confirmation prompt (default: false)
  --function <function>             Function to call (example: "hello(string)")
  --types <types...>                List of parameter types (e.g. uint256
                                    address)
  --values <values...>              Parameter values for the function call
  --data <data>                     Raw data for non-EVM chains like Solana
  -h, --help                        display help for command

```

## zetachain zetachain withdraw

```
Usage: zetachain zetachain withdraw [options]

Withdraw tokens from ZetaChain to a connected chain

Options:
  --zrc20 <address>                 The address of ZRC-20 to pay fees
  --receiver <address>              The address of the receiver contract on a
                                    connected chain. Non-hex strings will be
                                    automatically encoded to hex.
  --name <name>                     Account name (default: "default")
  --network <network>               Network to use (choices: "mainnet",
                                    "testnet", default: "testnet")
  --private-key <key>               Private key for signing transactions
  --gateway-zetachain <address>     Gateway contract address on ZetaChain
  --revert-address <address>        Revert address (default:
                                    "0x0000000000000000000000000000000000000000")
  --abort-address <address>         Abort address (default:
                                    "0x0000000000000000000000000000000000000000")
  --call-on-revert                  Whether to call on revert (default: false)
  --on-revert-gas-limit <limit>     Gas limit for the revert transaction
                                    (default: "7000000")
  --revert-message <message>        Revert message (default: "0x")
  --tx-options-gas-limit <limit>    Gas limit for the transaction (default:
                                    "7000000")
  --tx-options-gas-price <price>    Gas price for the transaction (default:
                                    "10000000000")
  --call-options-gas-limit <limit>  Gas limit for the call (default: "7000000")
  --call-options-is-arbitrary-call  Call any function (default: false)
  --yes                             Skip confirmation prompt (default: false)
  --amount <amount>                 The amount of tokens to withdraw
  -h, --help                        display help for command

```

## zetachain zetachain withdraw-and-call

```
Usage: zetachain zetachain withdraw-and-call [options]

Withdraw tokens from ZetaChain and call a contract on a connected chain

Options:
  --zrc20 <address>                 The address of ZRC-20 to pay fees
  --receiver <address>              The address of the receiver contract on a
                                    connected chain. Non-hex strings will be
                                    automatically encoded to hex.
  --name <name>                     Account name (default: "default")
  --network <network>               Network to use (choices: "mainnet",
                                    "testnet", default: "testnet")
  --private-key <key>               Private key for signing transactions
  --gateway-zetachain <address>     Gateway contract address on ZetaChain
  --revert-address <address>        Revert address (default:
                                    "0x0000000000000000000000000000000000000000")
  --abort-address <address>         Abort address (default:
                                    "0x0000000000000000000000000000000000000000")
  --call-on-revert                  Whether to call on revert (default: false)
  --on-revert-gas-limit <limit>     Gas limit for the revert transaction
                                    (default: "7000000")
  --revert-message <message>        Revert message (default: "0x")
  --tx-options-gas-limit <limit>    Gas limit for the transaction (default:
                                    "7000000")
  --tx-options-gas-price <price>    Gas price for the transaction (default:
                                    "10000000000")
  --call-options-gas-limit <limit>  Gas limit for the call (default: "7000000")
  --call-options-is-arbitrary-call  Call any function (default: false)
  --yes                             Skip confirmation prompt (default: false)
  --amount <amount>                 The amount of tokens to withdraw
  --function <function>             Function to call (example: "hello(string)")
  --types <types...>                List of parameter types (e.g. uint256
                                    address)
  --values <values...>              Parameter values for the function call
  --data <data>                     Raw data for non-EVM chains like Solana
  -h, --help                        display help for command

```

## zetachain evm

```
Usage: zetachain evm [options] [command]

EVM commands

Options:
  -h, --help                  display help for command

Commands:
  call [options]              Call a contract on ZetaChain from an
                              EVM-compatible chain
  deposit-and-call [options]  Deposit tokens and call a contract on ZetaChain
                              from an EVM-compatible chain
  deposit [options]           Deposit tokens to ZetaChain from an EVM-compatible
                              chain

```

## zetachain evm call

```
Usage: zetachain evm call [options]

Call a contract on ZetaChain from an EVM-compatible chain

Options:
  --chain-id <chainId>           Chain ID of the network
  --receiver <address>           Receiver address on ZetaChain
  --name <name>                  Account name (default: "default")
  --private-key <key>            Private key for signing transactions
  --rpc <url>                    RPC URL for the source chain
  --gateway <address>            EVM Gateway address
  --revert-address <address>     Address to revert to in case of failure
                                 (default: signer address)
  --abort-address <address>      Address to receive funds if aborted (default:
                                 "0x0000000000000000000000000000000000000000")
  --call-on-revert               Whether to call revert address on failure
                                 (default: false)
  --on-revert-gas-limit <limit>  Gas limit for revert operation (default:
                                 "200000")
  --revert-message <message>     Message to include in revert (default: "")
  --gas-limit <limit>            Gas limit for the transaction
  --gas-price <price>            Gas price for the transaction
  --yes                          Skip confirmation prompt (default: false)
  --types <types...>             List of parameter types (e.g. uint256 address)
  --values <values...>           Parameter values for the function call
  -h, --help                     display help for command

```

## zetachain evm deposit-and-call

```
Usage: zetachain evm deposit-and-call [options]

Deposit tokens and call a contract on ZetaChain from an EVM-compatible chain

Options:
  --chain-id <chainId>           Chain ID of the network
  --receiver <address>           Receiver address on ZetaChain
  --name <name>                  Account name (default: "default")
  --private-key <key>            Private key for signing transactions
  --rpc <url>                    RPC URL for the source chain
  --gateway <address>            EVM Gateway address
  --revert-address <address>     Address to revert to in case of failure
                                 (default: signer address)
  --abort-address <address>      Address to receive funds if aborted (default:
                                 "0x0000000000000000000000000000000000000000")
  --call-on-revert               Whether to call revert address on failure
                                 (default: false)
  --on-revert-gas-limit <limit>  Gas limit for revert operation (default:
                                 "200000")
  --revert-message <message>     Message to include in revert (default: "")
  --gas-limit <limit>            Gas limit for the transaction
  --gas-price <price>            Gas price for the transaction
  --yes                          Skip confirmation prompt (default: false)
  --amount <amount>              Amount of tokens to deposit
  --erc20 <address>              ERC20 token address (optional for native token
                                 deposits)
  --types <types...>             List of parameter types (e.g. uint256 address)
  --values <values...>           Parameter values for the function call
  -h, --help                     display help for command

```

## zetachain evm deposit

```
Usage: zetachain evm deposit [options]

Deposit tokens to ZetaChain from an EVM-compatible chain

Options:
  --chain-id <chainId>           Chain ID of the network
  --receiver <address>           Receiver address on ZetaChain
  --name <name>                  Account name (default: "default")
  --private-key <key>            Private key for signing transactions
  --rpc <url>                    RPC URL for the source chain
  --gateway <address>            EVM Gateway address
  --revert-address <address>     Address to revert to in case of failure
                                 (default: signer address)
  --abort-address <address>      Address to receive funds if aborted (default:
                                 "0x0000000000000000000000000000000000000000")
  --call-on-revert               Whether to call revert address on failure
                                 (default: false)
  --on-revert-gas-limit <limit>  Gas limit for revert operation (default:
                                 "200000")
  --revert-message <message>     Message to include in revert (default: "")
  --gas-limit <limit>            Gas limit for the transaction
  --gas-price <price>            Gas price for the transaction
  --yes                          Skip confirmation prompt (default: false)
  --amount <amount>              Amount of tokens to deposit
  --erc20 <address>              ERC20 token address (optional for native token
                                 deposits)
  -h, --help                     display help for command

```

## zetachain solana

```
Usage: zetachain solana [options] [command]

Solana commands

Options:
  -h, --help                  display help for command

Commands:
  call [options]              Call a universal contract on ZetaChain
  deposit-and-call [options]  Deposit tokens from Solana and call a universal
                              contract on ZetaChain
  deposit [options]           Deposit tokens from Solana
  encode [options]            Encode payload data for Solana

```

## zetachain solana call

```
Usage: zetachain solana call [options]

Call a universal contract on ZetaChain

Options:
  --recipient <recipient>                   EOA or contract address on ZetaChain
  --mnemonic <mnemonic>                     Mnemonic
  --name <name>                             Name of the wallet (default: "default")
  --private-key <privateKey>                Private key in base58 or hex format (with optional 0x prefix)
  --network <network>                       Solana network (choices: "devnet", "localnet", "mainnet")
  --revert-address <revertAddress>          Revert address
  --abort-address <abortAddress>            Abort address (default: "0x0000000000000000000000000000000000000000")
  --call-on-revert                          Call on revert (default: false)
  --revert-message <revertMessage>          Revert message (default: "")
  --on-revert-gas-limit <onRevertGasLimit>  On revert gas limit (default: "0")
  --types <types...>                        List of parameter types (e.g. uint256 address)
  --values <values...>                      Parameter values for the function call
  -h, --help                                display help for command

```

## zetachain solana deposit-and-call

```
Usage: zetachain solana deposit-and-call [options]

Deposit tokens from Solana and call a universal contract on ZetaChain

Options:
  --recipient <recipient>                   EOA or contract address on ZetaChain
  --mnemonic <mnemonic>                     Mnemonic
  --name <name>                             Name of the wallet (default: "default")
  --private-key <privateKey>                Private key in base58 or hex format (with optional 0x prefix)
  --network <network>                       Solana network (choices: "devnet", "localnet", "mainnet")
  --revert-address <revertAddress>          Revert address
  --abort-address <abortAddress>            Abort address (default: "0x0000000000000000000000000000000000000000")
  --call-on-revert                          Call on revert (default: false)
  --revert-message <revertMessage>          Revert message (default: "")
  --on-revert-gas-limit <onRevertGasLimit>  On revert gas limit (default: "0")
  --amount <amount>                         Amount of tokens to deposit
  --token-program <tokenProgram>            Token program (default: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
  --types <types...>                        List of parameter types (e.g. uint256 address)
  --values <values...>                      Parameter values for the function call
  --mint <mint>                             SPL token mint address
  -h, --help                                display help for command

```

## zetachain solana deposit

```
Usage: zetachain solana deposit [options]

Deposit tokens from Solana

Options:
  --recipient <recipient>                   EOA or contract address on ZetaChain
  --mnemonic <mnemonic>                     Mnemonic
  --name <name>                             Name of the wallet (default: "default")
  --private-key <privateKey>                Private key in base58 or hex format (with optional 0x prefix)
  --network <network>                       Solana network (choices: "devnet", "localnet", "mainnet")
  --revert-address <revertAddress>          Revert address
  --abort-address <abortAddress>            Abort address (default: "0x0000000000000000000000000000000000000000")
  --call-on-revert                          Call on revert (default: false)
  --revert-message <revertMessage>          Revert message (default: "")
  --on-revert-gas-limit <onRevertGasLimit>  On revert gas limit (default: "0")
  --amount <amount>                         Amount of tokens to deposit
  --token-program <tokenProgram>            Token program (default: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
  --mint <mint>                             SPL token mint address
  -h, --help                                display help for command

```

## zetachain solana encode

```
Usage: zetachain solana encode [options]

Encode payload data for Solana

Options:
  --connected <address>     Connected PDA account address
  --data <data>             Data to encode
  --gateway <address>       Gateway program address
  --mint <address>          Mint address for SPL token operations
  --accounts <accounts...>  Additional accounts in format 'address:isWritable'
  -h, --help                display help for command

```

## zetachain sui

```
Usage: zetachain sui [options] [command]

Sui commands

Options:
  -h, --help                  display help for command

Commands:
  deposit-and-call [options]  Deposit tokens from Sui and call a contract on
                              ZetaChain
  deposit [options]           Deposit tokens from Sui
  encode [options]            Encode payload data for SUI

```

## zetachain sui deposit-and-call

```
Usage: zetachain sui deposit-and-call [options]

Deposit tokens from Sui and call a contract on ZetaChain

Options:
  --mnemonic <mnemonic>               Mnemonic for the account
  --private-key <privateKey>          Private key for the account
  --gateway-object <gatewayObject>    Gateway object ID
  --gateway-package <gatewayPackage>  Gateway package ID
  --receiver <receiver>               Receiver address on ZetaChain
  --amount <amount>                   Amount to deposit in decimal format
  --chain-id <chainId>                Chain ID (choices: "0103", "101", "103",
                                      default: "103")
  --coin-type <coinType>              Coin type to deposit (default:
                                      "0x2::sui::SUI")
  --network <network>                 Network to use (choices: "localnet",
                                      "mainnet", "testnet")
  --gas-budget <gasBudget>            Gas budget in MIST (default: "10000000")
  --name <name>                       Account name (default: "default")
  --decimals <number>                 Number of decimals for the coin type
                                      (default: "9")
  --values <values...>                Parameter values for the function call
  --types <types...>                  List of parameter types (e.g. uint256
                                      address)
  -h, --help                          display help for command

```

## zetachain sui deposit

```
Usage: zetachain sui deposit [options]

Deposit tokens from Sui

Options:
  --mnemonic <mnemonic>               Mnemonic for the account
  --private-key <privateKey>          Private key for the account
  --gateway-object <gatewayObject>    Gateway object ID
  --gateway-package <gatewayPackage>  Gateway package ID
  --receiver <receiver>               Receiver address on ZetaChain
  --amount <amount>                   Amount to deposit in decimal format
  --chain-id <chainId>                Chain ID (choices: "0103", "101", "103",
                                      default: "103")
  --coin-type <coinType>              Coin type to deposit (default:
                                      "0x2::sui::SUI")
  --network <network>                 Network to use (choices: "localnet",
                                      "mainnet", "testnet")
  --gas-budget <gasBudget>            Gas budget in MIST (default: "10000000")
  --name <name>                       Account name (default: "default")
  --decimals <number>                 Number of decimals for the coin type
                                      (default: "9")
  -h, --help                          display help for command

```

## zetachain sui encode

```
Usage: zetachain sui encode [options]

Encode payload data for SUI

Options:
  --data <data>                        Data to encode
  --type-arguments <typeArguments...>  Type arguments for the encoding
  --objects <objects...>               Objects to include in the encoding
                                       (comma-separated)
  -h, --help                           display help for command

```

## zetachain ton

```
Usage: zetachain ton [options] [command]

TON commands

Options:
  -h, --help                  display help for command

Commands:
  deposit-and-call [options]  Deposit TON and call a universal contract on
                              ZetaChain
  deposit [options]           Deposit TON to an EOA or a contract on ZetaChain

```

## zetachain ton deposit-and-call

```
Usage: zetachain ton deposit-and-call [options]

Deposit TON and call a universal contract on ZetaChain

Options:
  --mnemonic <mnemonic>  Mnemonic for the account
  --name <name>          Name of the account (default: "default")
  --gateway <gateway>    Gateway contract address (default: testnet) (default:
                         "0:7a4d41496726aadb227cf4d313c95912f1fe6cc742c18ebde306ff59881d8816")
  --receiver <receiver>  Receiver address
  --rpc <rpc>            RPC endpoint (default: testnet) (default:
                         "https://testnet.toncenter.com/api/v2/jsonRPC")
  --api-key <apiKey>     API key
  --amount <amount>      Amount in TON
  --types <types...>     ABI types
  --values <values...>   Values corresponding to types
  --data <data>          Data to call the contract with
  -h, --help             display help for command

```

## zetachain ton deposit

```
Usage: zetachain ton deposit [options]

Deposit TON to an EOA or a contract on ZetaChain

Options:
  --mnemonic <mnemonic>  Mnemonic for the account
  --name <name>          Name of the account (default: "default")
  --gateway <gateway>    Gateway contract address (default: testnet) (default:
                         "0:7a4d41496726aadb227cf4d313c95912f1fe6cc742c18ebde306ff59881d8816")
  --receiver <receiver>  Receiver address
  --rpc <rpc>            RPC endpoint (default: testnet) (default:
                         "https://testnet.toncenter.com/api/v2/jsonRPC")
  --api-key <apiKey>     API key
  --amount <amount>      Amount in TON
  -h, --help             display help for command

```

## zetachain bitcoin

```
Usage: zetachain bitcoin|b [options] [command]

Bitcoin-related commands

Options:
  -h, --help     display help for command

Commands:
  inscription|i  Make a transaction using inscriptions
  memo|m         Make a transaction using a memo (OP_RETURN)

```

## zetachain bitcoin inscription

```
Usage: zetachain bitcoin inscription|i [options] [command]

Make a transaction using inscriptions

Options:
  -h, --help                  display help for command

Commands:
  call [options]              Call a contract on ZetaChain
  deposit-and-call [options]  Deposit BTC and call a contract on ZetaChain
  deposit [options]           Deposit BTC to ZetaChain
  encode [options]            Encode data for Bitcoin transactions using ABI
                              encoding

```

## zetachain bitcoin inscription call

```
Usage: zetachain bitcoin inscription call [options]

Call a contract on ZetaChain

Options:
  --yes                       Skip confirmation prompt (default: false)
  -r, --receiver <address>    ZetaChain receiver address
  -g, --gateway <address>     Bitcoin gateway (TSS) address (default:
                              "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur")
  --private-key <key>         Bitcoin private key
  --name <name>               Account name (default: "default")
  --revert-address <address>  Revert address
  --format <format>           Encoding format (choices: "ABI", "CompactLong",
                              "CompactShort", default: "ABI")
  --data <data>               Pass raw data
  --bitcoin-api <url>         Bitcoin API (default:
                              "https://mempool.space/signet/api")
  --gas-price-api <url>       ZetaChain API (default:
                              "https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/gasPrice/18333")
  -t, --types <types...>      ABI types
  -v, --values <values...>    Values corresponding to types
  -h, --help                  display help for command

```

## zetachain bitcoin inscription deposit-and-call

```
Usage: zetachain bitcoin inscription deposit-and-call [options]

Deposit BTC and call a contract on ZetaChain

Options:
  --yes                       Skip confirmation prompt (default: false)
  -r, --receiver <address>    ZetaChain receiver address
  -g, --gateway <address>     Bitcoin gateway (TSS) address (default:
                              "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur")
  --private-key <key>         Bitcoin private key
  --name <name>               Account name (default: "default")
  --revert-address <address>  Revert address
  --format <format>           Encoding format (choices: "ABI", "CompactLong",
                              "CompactShort", default: "ABI")
  --data <data>               Pass raw data
  --bitcoin-api <url>         Bitcoin API (default:
                              "https://mempool.space/signet/api")
  --gas-price-api <url>       ZetaChain API (default:
                              "https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/gasPrice/18333")
  -t, --types <types...>      ABI types
  -v, --values <values...>    Values corresponding to types
  -a, --amount <btcAmount>    BTC amount to send (in BTC)
  -h, --help                  display help for command

```

## zetachain bitcoin inscription deposit

```
Usage: zetachain bitcoin inscription deposit [options]

Deposit BTC to ZetaChain

Options:
  --yes                       Skip confirmation prompt (default: false)
  -r, --receiver <address>    ZetaChain receiver address
  -g, --gateway <address>     Bitcoin gateway (TSS) address (default:
                              "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur")
  --private-key <key>         Bitcoin private key
  --name <name>               Account name (default: "default")
  --revert-address <address>  Revert address
  --format <format>           Encoding format (choices: "ABI", "CompactLong",
                              "CompactShort", default: "ABI")
  --data <data>               Pass raw data
  --bitcoin-api <url>         Bitcoin API (default:
                              "https://mempool.space/signet/api")
  --gas-price-api <url>       ZetaChain API (default:
                              "https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/gasPrice/18333")
  -a, --amount <btcAmount>    BTC amount to send (in BTC)
  -h, --help                  display help for command

```

## zetachain bitcoin inscription encode

```
Usage: zetachain bitcoin inscription encode [options]

Encode data for Bitcoin transactions using ABI encoding

Options:
  -r, --receiver <address>        Receiver address
  -t, --types <types...>          ABI types (e.g. string uint256) (default: [])
  -v, --values <values...>        Values corresponding to types (default: [])
  -a, --revert-address <address>  Bitcoin revert address
  -o, --op-code <code>            Operation code (choices: "Call", "Deposit",
                                  "DepositAndCall", "Invalid", default:
                                  "DepositAndCall")
  -f, --format <format>           Encoding format (choices: "ABI",
                                  "CompactLong", "CompactShort", default: "ABI")
  -h, --help                      display help for command

```

## zetachain bitcoin memo

```
Usage: zetachain bitcoin memo|m [options] [command]

Make a transaction using a memo (OP_RETURN)

Options:
  -h, --help                  display help for command

Commands:
  call [options]              Call a contract on ZetaChain
  deposit-and-call [options]  Deposit BTC and call a contract on ZetaChain
  deposit [options]           Deposit BTC to ZetaChain

```

## zetachain bitcoin memo call

```
Usage: zetachain bitcoin memo call [options]

Call a contract on ZetaChain

Options:
  --yes                     Skip confirmation prompt (default: false)
  -r, --receiver <address>  ZetaChain receiver address
  -g, --gateway <address>   Bitcoin gateway (TSS) address (default:
                            "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur")
  -d, --data <data>         Pass raw data
  --network-fee <fee>       Network fee (in sats) (default: "1750")
  -h, --help                display help for command

```

## zetachain bitcoin memo deposit-and-call

```
Usage: zetachain bitcoin memo deposit-and-call [options]

Deposit BTC and call a contract on ZetaChain

Options:
  --yes                     Skip confirmation prompt (default: false)
  -r, --receiver <address>  ZetaChain receiver address
  -g, --gateway <address>   Bitcoin gateway (TSS) address (default:
                            "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur")
  -d, --data <data>         Pass raw data
  --network-fee <fee>       Network fee (in sats) (default: "1750")
  -a, --amount <btcAmount>  BTC amount to send (in BTC)
  -h, --help                display help for command

```

## zetachain bitcoin memo deposit

```
Usage: zetachain bitcoin memo deposit [options]

Deposit BTC to ZetaChain

Options:
  --yes                     Skip confirmation prompt (default: false)
  -r, --receiver <address>  ZetaChain receiver address
  -g, --gateway <address>   Bitcoin gateway (TSS) address (default:
                            "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur")
  -d, --data <data>         Pass raw data
  --network-fee <fee>       Network fee (in sats) (default: "1750")
  -a, --amount <btcAmount>  BTC amount to send (in BTC)
  -h, --help                display help for command

```

## zetachain localnet

```
Usage: zetachain localnet [options] [command]

Local development environment

Options:
  -h, --help       display help for command

Commands:
  start [options]  Start localnet
  stop             Stop localnet
  check [options]  Check if localnet is running
  ton              TON commands

```

## zetachain localnet start

```
Usage: zetachain localnet start [options]

Start localnet

Options:
  -p, --port <number>      Port to run anvil on (default: "8545")
  -a, --anvil <string>     Additional arguments to pass to anvil (default: "-q")
  -f, --force-kill         Force kill any process on the port without prompting
                           (default: false)
  -s, --stop-after-init    Stop the localnet after successful initialization
                           (default: false)
  -e, --exit-on-error      Exit with an error if a call is reverted (default:
                           false)
  -v, --verbosity <level>  Logger verbosity level (choices: "emerg", "alert",
                           "crit", "error", "warning", "notice", "info",
                           "debug", default: "info")
  --chains [chains...]     Chains to launch when starting localnet (choices:
                           "ton", "solana", "sui", default: [])
  -h, --help               display help for command

```

## zetachain localnet stop

```
Usage: zetachain localnet stop [options]

Stop localnet

Options:
  -h, --help  display help for command

```

## zetachain localnet check

```
Usage: zetachain localnet check [options]

Check if localnet is running

Options:
  -d, --delay <number>  Seconds to wait before checking localnet (default: "3")
  -h, --help            display help for command

```

## zetachain localnet ton

```
Usage: zetachain localnet ton [options] [command]

TON commands

Options:
  -h, --help          display help for command

Commands:
  balance [options]   Show balance by address
  faucet [options]    Request TON from faucet
  wallet [options]    Create & fund a wallet
  withdraw [options]  Withdraw TON from gateway
  help [command]      display help for command

```

## zetachain localnet ton balance

```
Usage: zetachain localnet ton balance [options]

Show balance by address

Options:
  -a, --address <address>  Address
  -h, --help               display help for command

```

## zetachain localnet ton faucet

```
Usage: zetachain localnet ton faucet [options]

Request TON from faucet

Options:
  -a, --address <address>  Address
  -m, --amount <amount>    Amount in TON (default: "100")
  -h, --help               display help for command

```

## zetachain localnet ton wallet

```
Usage: zetachain localnet ton wallet [options]

Create & fund a wallet

Options:
  -m, --amount <amount>  Amount to topup in TON (default: "100")
  -h, --help             display help for command

```

## zetachain localnet ton withdraw

```
Usage: zetachain localnet ton withdraw [options]

Withdraw TON from gateway

Options:
  -a, --address <address>  Recipient
  -m, --amount <amount>    Amount in TON (default: "1")
  -k, --private-key <key>  Sender's private key on Zeta
  -g, --gateway <gateway>  Gateway address on ZEVM
  -t, --token <token>      TON.TON token address on ZEVM
  -p, --port <port>        Anvil port (default: "8545")
  -h, --help               display help for command

```

## zetachain docs

```
Usage: zetachain docs [options]

Display help information for all available commands and their subcommands

Options:
  -h, --help  display help for command

```
