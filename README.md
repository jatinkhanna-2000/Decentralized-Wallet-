# Decentralized-Wallet-

Decentralized Wallet System
Overview
This decentralized wallet system is built on the Stellar blockchain, offering a range of features for managing digital assets. Users can create wallets, check balances, send payments, and set up escrow accounts. The wallet also supports advanced features like adding signers for multi-signature accounts, managing trust lines, merging accounts, resolving federated addresses, and splitting payments across multiple recipients. Additionally, users can view detailed transaction history and analytics to track their account activity.

Features
Create Wallet: Generate a new Stellar wallet with a public and secret key.
Check Balance: Retrieve the balance of an existing wallet.
Send Payment: Transfer XLM or other assets between wallets.
Create Escrow Payment: Set up an escrow account for secure transactions.
Add Signer: Add a signer to a multi-signature account.
Add Trustline: Add trustlines for different assets in a wallet.
Merge Account: Merge one Stellar account into another.
Resolve Federated Address: Resolve a federated address to a public key.
Split Payment: Split a payment across multiple recipients.
View Transaction History: Display past transactions associated with a wallet.
Transaction Analytics: Analyze transaction history to display metrics like total XLM sent, average transaction size, etc.
Installation
Prerequisites
Node.js (v14 or higher)
MongoDB
Git
Steps
Clone the Repository

bash
Copy code
git clone https://github.com/jatinkhanna-2000/Decentralized-Wallet-.git
cd Decentralized-Wallet-
Install Dependencies

bash
Copy code
npm install
Set Up Environment Variables

Create a .env file in the root directory.
Add the following variables:
bash
Copy code
STELLAR_SECRET_KEY=<Your_Stellar_Secret_Key>
MONGO_URI=mongodb://localhost:27017/decentralized-wallet
PORT=3000
Run the Backend Server

bash
Copy code
node app.js
This will start the server on http://localhost:3000.

Run the Frontend

Navigate to the frontend directory:
bash
Copy code
cd frontend
Install frontend dependencies:
bash
Copy code
npm install
Start the frontend server:
bash
Copy code
npm start
The frontend will be available at http://localhost:3000.
Usage
Create Wallet
Click on the "Create Wallet" button to generate a new Stellar wallet. The public and secret keys will be displayed.
Check Balance
Enter the public key and click "Check Balance" to view the account balance.
Send Payment
Enter the destination public key and the amount, then click "Send Payment" to transfer XLM or other assets.
Create Escrow Payment
Enter the escrow public key and the amount, then click "Create Escrow" to set up an escrow payment.
Add Signer
Enter the signer public key and weight, then click "Add Signer" to add a signer to a multi-signature account.
Add Trustline
Enter the asset code and issuer, then click "Add Trustline" to add a trustline to your wallet.
Merge Account
Enter the destination public key, then click "Merge Account" to merge one account into another.
Resolve Federated Address
Enter the federated address, then click "Resolve Address" to resolve it to a public key.
Split Payment
Enter multiple destination public keys and amounts, then click "Send Split Payment" to split the payment.
View Transaction History
Click "View Transaction History" to display past transactions associated with the wallet.
Transaction Analytics
Analyze transaction data by clicking "View Transaction Analytics."
Contributing
If you'd like to contribute to this project, please fork the repository, create a new branch, and submit a pull request. Contributions are welcome!

License
This project is licensed under the MIT License. See the LICENSE file for details.

This README provides a comprehensive guide for users and developers on how to install, use, and contribute to the project.
