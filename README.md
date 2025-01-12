The provided code integrates RainbowKit with Abstract's Global Wallet (AGW) in a Next.js application, enabling users to:
- Connect their AGW
- Create a session key for the AGW sponsored by the Abstract Paymaster
- Sponsored mint ERC20 tokens without manual approval for each transaction due to the session keys
- Revoke the session key for the AGW sponsored by the Abstract Paymaster
- Disconnect their AGW

### Implementation steps:

1. Set Up the Abstract Global Wallet with RainbowKit ([original instructions](https://github.com/Abstract-Foundation/examples/blob/main/agw-rainbowkit-nextjs/README.md))

    This example showcases how to use the Abstract Global Wallet react SDK with [RainbowKit](https://www.rainbowkit.com/) inside a [Next.js](https://nextjs.org/) application.

    1. Get a copy of the `agw-rainbowkit-nextjs` example directory from the Abstract Examples repository:

       ```bash
       mkdir -p agw-rainbowkit-nextjs && curl -L https://codeload.github.com/Abstract-Foundation/examples/tar.gz/main | tar -xz --strip=2 -C agw-rainbowkit-nextjs examples-main/agw-rainbowkit-nextjs && cd agw-rainbowkit-nextjs
       ```

    2. Install dependencies

       ```bash
       npm install
       ```

    3. Run the development server

       ```bash
       npm run dev
       ```

      Visit [http://localhost:3000](http://localhost:3000) to see the app.

2. Implement Session Key Creation:
   - After user login, utilize AGW's session key API to create a session key with permissions for token minting.
   - Store the session key
   - For detailed guidance, refer to [Abstract's documentation on session keys](https://docs.abs.xyz/abstract-global-wallet/agw-client/session-keys/overview)

3. Mint ERC20 Tokens Using the Session Key:
   - Set up a function to interact with the ERC20 contract's minting function.
   - Use the session key to sign and send the mint transaction on behalf of the user.
