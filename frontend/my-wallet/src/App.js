import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [destinationKey, setDestinationKey] = useState('');
  const [amount, setAmount] = useState('');
  const [escrowKey, setEscrowKey] = useState('');
  const [signerKey, setSignerKey] = useState('');
  const [signerWeight, setSignerWeight] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [assetIssuer, setAssetIssuer] = useState('');
  const [federatedAddress, setFederatedAddress] = useState('');
  const [resolvedPublicKey, setResolvedPublicKey] = useState('');
  const [splitPayments, setSplitPayments] = useState([{ destination: '', amount: '' }]);

  const createWallet = async () => {
    try {
      const response = await axios.post('http://localhost:3000/create-wallet');
      setPublicKey(response.data.publicKey);
      setSecretKey(response.data.secret);
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  const checkBalance = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/balance/${publicKey}`);
      setBalance(response.data.balances);
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  const sendPayment = async () => {
    try {
      const response = await axios.post('http://localhost:3000/send-payment', {
        sourceSecret: secretKey,
        destinationPublicKey: destinationKey,
        amount: amount,
      });
      alert('Payment sent successfully!');
    } catch (error) {
      console.error('Error sending payment:', error);
    }
  };

  const viewTransactionHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/transaction-history/${publicKey}`);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error retrieving transaction history:', error);
    }
  };

  const createEscrow = async () => {
    try {
      const response = await axios.post('http://localhost:3000/create-escrow', {
        sourceSecret: secretKey,
        escrowPublicKey: escrowKey,
        amount: amount,
      });
      alert('Escrow payment created successfully!');
    } catch (error) {
      console.error('Error creating escrow:', error);
    }
  };

  const addSigner = async () => {
    try {
      const response = await axios.post('http://localhost:3000/add-signer', {
        sourceSecret: secretKey,
        signerPublicKey: signerKey,
        weight: signerWeight,
      });
      alert('Signer added successfully!');
    } catch (error) {
      console.error('Error adding signer:', error);
    }
  };

  const addTrustline = async () => {
    try {
      const response = await axios.post('http://localhost:3000/add-trustline', {
        sourceSecret: secretKey,
        assetCode: assetCode,
        assetIssuer: assetIssuer,
      });
      alert('Trustline added successfully!');
    } catch (error) {
      console.error('Error adding trustline:', error);
    }
  };

  const mergeAccount = async () => {
    try {
      const response = await axios.post('http://localhost:3000/merge-account', {
        sourceSecret: secretKey,
        destinationPublicKey: destinationKey,
      });
      alert('Account merged successfully!');
    } catch (error) {
      console.error('Error merging account:', error);
    }
  };

  const resolveFederatedAddress = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/resolve-federated-address/${federatedAddress}`);
      setResolvedPublicKey(response.data.publicKey);
    } catch (error) {
      console.error('Error resolving federated address:', error);
    }
  };

  const splitPayment = async () => {
    try {
      const response = await axios.post('http://localhost:3000/split-payment', {
        sourceSecret: secretKey,
        splits: splitPayments,
      });
      alert('Split payment sent successfully!');
    } catch (error) {
      console.error('Error splitting payment:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Decentralized Wallet</h1>
      </header>
      <main>
        <section className="wallet-section">
          <h2>Create Wallet</h2>
          <button className="primary-btn" onClick={createWallet}>Create Wallet</button>
          {publicKey && <p className="key-display">Public Key: <span>{publicKey}</span></p>}
          {secretKey && <p className="key-display">Secret Key: <span>{secretKey}</span></p>}
        </section>

        <section className="balance-section">
          <h2>Check Balance</h2>
          <button className="primary-btn" onClick={checkBalance}>Check Balance</button>
          {balance && (
            <ul className="balance-list">
              {balance.map((b, index) => (
                <li key={index}>{b.asset}: {b.balance}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="payment-section">
          <h2>Send Payment</h2>
          <input
            type="text"
            placeholder="Destination Public Key"
            value={destinationKey}
            onChange={(e) => setDestinationKey(e.target.value)}
            className="primary-input"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="primary-input"
          />
          <button className="primary-btn" onClick={sendPayment}>Send Payment</button>
        </section>

        {/* Add sections for new features like escrow, signer, trustline, etc. */}
        <section className="escrow-section">
          <h2>Create Escrow Payment</h2>
          <input
            type="text"
            placeholder="Escrow Public Key"
            value={escrowKey}
            onChange={(e) => setEscrowKey(e.target.value)}
            className="primary-input"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="primary-input"
          />
          <button className="primary-btn" onClick={createEscrow}>Create Escrow</button>
        </section>

        <section className="signer-section">
          <h2>Add Signer</h2>
          <input
            type="text"
            placeholder="Signer Public Key"
            value={signerKey}
            onChange={(e) => setSignerKey(e.target.value)}
            className="primary-input"
          />
          <input
            type="number"
            placeholder="Signer Weight"
            value={signerWeight}
            onChange={(e) => setSignerWeight(e.target.value)}
            className="primary-input"
          />
          <button className="primary-btn" onClick={addSigner}>Add Signer</button>
        </section>

        <section className="trustline-section">
          <h2>Add Trustline</h2>
          <input
            type="text"
            placeholder="Asset Code"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
            className="primary-input"
          />
          <input
            type="text"
            placeholder="Asset Issuer"
            value={assetIssuer}
            onChange={(e) => setAssetIssuer(e.target.value)}
            className="primary-input"
          />
          <button className="primary-btn" onClick={addTrustline}>Add Trustline</button>
        </section>

        <section className="merge-section">
          <h2>Merge Account</h2>
          <input
            type="text"
            placeholder="Destination Public Key"
            value={destinationKey}
            onChange={(e) => setDestinationKey(e.target.value)}
            className="primary-input"
          />
          <button className="primary-btn" onClick={mergeAccount}>Merge Account</button>
        </section>

        <section className="federated-section">
          <h2>Resolve Federated Address</h2>
          <input
            type="text"
            placeholder="Federated Address"
            value={federatedAddress}
            onChange={(e) => setFederatedAddress(e.target.value)}
            className="primary-input"
          />
                    <button className="primary-btn" onClick={resolveFederatedAddress}>Resolve Address</button>
          {resolvedPublicKey && <p>Resolved Public Key: {resolvedPublicKey}</p>}
        </section>

        <section className="split-payment-section">
          <h2>Split Payment</h2>
          {splitPayments.map((split, index) => (
            <div key={index}>
              <input
                type="text"
                placeholder="Destination Public Key"
                value={split.destination}
                onChange={(e) => {
                  const newSplits = [...splitPayments];
                  newSplits[index].destination = e.target.value;
                  setSplitPayments(newSplits);
                }}
                className="primary-input"
              />
              <input
                type="number"
                placeholder="Amount"
                value={split.amount}
                onChange={(e) => {
                  const newSplits = [...splitPayments];
                  newSplits[index].amount = e.target.value;
                  setSplitPayments(newSplits);
                }}
                className="primary-input"
              />
            </div>
          ))}
          <button
            className="primary-btn"
            onClick={() => setSplitPayments([...splitPayments, { destination: '', amount: '' }])}
          >
            Add Split
          </button>
          <button className="primary-btn" onClick={splitPayment}>Send Split Payment</button>
        </section>
      </main>
    </div>
  );
}

export default App;
