require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const StellarSdk = require('stellar-sdk');
const Transaction = require('./models/Transaction');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/decentralized-wallet', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Initialize Stellar Server
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const sourceKeys = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET_KEY);

// Basic route to confirm server is running
app.get('/', (req, res) => {
    res.send('Decentralized Wallet Backend is running!');
});

// Route to create a new wallet
app.post('/create-wallet', (req, res) => {
    const pair = StellarSdk.Keypair.random();
    const publicKey = pair.publicKey();
    const secret = pair.secret();

    res.json({
        publicKey: publicKey,
        secret: secret,
    });
});

// Route to check balance
app.get('/balance/:publicKey', async (req, res) => {
    const publicKey = req.params.publicKey;

    try {
        const account = await server.loadAccount(publicKey);
        const balances = account.balances.map(balance => ({
            asset: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
            balance: balance.balance,
        }));

        res.json({ publicKey, balances });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            res.status(404).json({ error: 'The account does not exist or is unfunded. Please ensure the account is funded before checking the balance.' });
        } else {
            res.status(400).json({ error: 'Unable to fetch balance. Check the public key and try again.' });
        }
    }
});

// Route to send payment
app.post('/send-payment', async (req, res) => {
    const { sourceSecret, destinationPublicKey, amount } = req.body;

    try {
        if (amount <= 0) {
            return res.status(400).json({ error: 'The amount must be a positive number greater than 0.' });
        }

        if (!StellarSdk.StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
            return res.status(400).json({ error: 'Invalid destination public key format. Please provide a valid Stellar public key.' });
        }

        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();

        const account = await server.loadAccount(sourcePublicKey);

        const nativeBalance = account.balances.find(balance => balance.asset_type === 'native').balance;
        if (parseFloat(nativeBalance) < parseFloat(amount)) {
            return res.status(400).json({ error: 'Insufficient funds. The source account does not have enough XLM to complete this transaction.' });
        }

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: destinationPublicKey,
                asset: StellarSdk.Asset.native(),
                amount: amount.toString(),
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);

        const result = await server.submitTransaction(transaction);

        const newTransaction = new Transaction({
            sourcePublicKey: sourcePublicKey,
            destinationPublicKey: destinationPublicKey,
            amount: amount.toString(),
            transactionId: result.hash,
        });

        await newTransaction.save();

        res.json({ success: true, result });

    } catch (error) {
        if (error.response && error.response.data && error.response.data.extras) {
            const extras = error.response.data.extras;

            if (extras.result_codes && extras.result_codes.transaction === 'tx_insufficient_balance') {
                return res.status(400).json({ error: 'Insufficient funds. The source account does not have enough XLM to complete this transaction.' });
            }

            if (extras.result_codes.operations && extras.result_codes.operations.includes('op_no_destination')) {
                return res.status(400).json({ error: 'The destination account does not exist. Please provide a valid and funded destination public key.' });
            }
        }

        res.status(400).json({ error: 'Payment failed. Check the transaction details and try again.' });
    }
});

// Route to create escrow payment
app.post('/create-escrow', async (req, res) => {
    const { sourceSecret, escrowPublicKey, amount } = req.body;

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: escrowPublicKey,
                asset: StellarSdk.Asset.native(),
                amount: amount.toString(),
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Escrow creation failed. Check the transaction details and try again.' });
    }
});

// Route to add a signer for multi-signature accounts
app.post('/add-signer', async (req, res) => {
    const { sourceSecret, signerPublicKey, weight } = req.body;

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.setOptions({
                signer: {
                    ed25519PublicKey: signerPublicKey,
                    weight: weight
                }
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Failed to add signer. Check the transaction details and try again.' });
    }
});

// Route to create an offer on the Stellar DEX
app.post('/create-offer', async (req, res) => {
    const { sourceSecret, sellingAssetCode, buyingAssetCode, amount, price } = req.body;

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const sellingAsset = new StellarSdk.Asset(sellingAssetCode, sourcePublicKey);
        const buyingAsset = new StellarSdk.Asset(buyingAssetCode, sourcePublicKey);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.manageSellOffer({
                selling: sellingAsset,
                buying: buyingAsset,
                amount: amount.toString(),
                price: price.toString(),
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Failed to create offer. Check the transaction details and try again.' });
    }
});

// Route to add a trustline for a specific asset
app.post('/add-trustline', async (req, res) => {
    const { sourceSecret, assetCode, assetIssuer } = req.body;

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const asset = new StellarSdk.Asset(assetCode, assetIssuer);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.changeTrust({
                asset: asset,
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Failed to add trustline. Check the details and try again.' });
    }
});

// Route to merge one account into another
app.post('/merge-account', async (req, res) => {
    const { sourceSecret, destinationPublicKey } = req.body;

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.accountMerge({
                destination: destinationPublicKey
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Failed to merge account. Check the details and try again.' });
    }
});


// Route to merge one account into another
app.post('/merge-account', async (req, res) => {
    const { sourceSecret, destinationPublicKey } = req.body;

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.accountMerge({
                destination: destinationPublicKey
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Failed to merge account. Check the details and try again.' });
    }
});

// Route to resolve a federated address to a public key
app.get('/resolve-federated-address/:federatedAddress', async (req, res) => {
    const federatedAddress = req.params.federatedAddress;

    try {
        const result = await server.accounts()
            .forAccount(federatedAddress)
            .call();

        res.json({ publicKey: result.account_id });

    } catch (error) {
        res.status(400).json({ error: 'Failed to resolve federated address. Check the address and try again.' });
    }
});

// Route to split payment across multiple accounts
app.post('/split-payment', async (req, res) => {
    const { sourceSecret, splits } = req.body; // splits: [{ destination: publicKey, amount: '10' }, ...]

    try {
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();
        const account = await server.loadAccount(sourcePublicKey);

        const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        });

        splits.forEach(split => {
            transactionBuilder.addOperation(StellarSdk.Operation.payment({
                destination: split.destination,
                asset: StellarSdk.Asset.native(),
                amount: split.amount.toString(),
            }));
        });

        const transaction = transactionBuilder.setTimeout(30).build();
        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({ success: true, result });

    } catch (error) {
        res.status(400).json({ error: 'Failed to split payment. Check the details and try again.' });
    }
});

// Route to get transaction history
app.get('/transaction-history/:publicKey', async (req, res) => {
    const publicKey = req.params.publicKey;

    try {
        const transactions = await Transaction.find({ sourcePublicKey: publicKey });

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'No transaction history found for this account.' });
        }

        res.json({ publicKey, transactions });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while retrieving transaction history.' });
    }
});

// Route to get transaction analytics
app.get('/transaction-analytics/:publicKey', async (req, res) => {
    const publicKey = req.params.publicKey;

    try {
        const transactions = await Transaction.find({ sourcePublicKey: publicKey });

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'No transaction history found for this account.' });
        }

        const totalXlmSent = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        const averageTxSize = totalXlmSent / transactions.length;

        res.json({
            totalXlmSent: totalXlmSent.toFixed(2),
            averageTxSize: averageTxSize.toFixed(2),
            transactionCount: transactions.length
        });

    } catch (error) {
        res.status(500).json({ error: 'An error occurred while retrieving transaction analytics.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
