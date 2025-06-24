# Grenache P2P Exchange

A simplified peer-to-peer (P2P) distributed exchange using Grenache for node communication and a custom in-memory order book for order matching.

## Overview

This project implements a basic P2P exchange where each node maintains its own order book. Orders are submitted to a node and distributed to other nodes via Grenache. Orders are matched locally, and any remainder is kept in the order book.


## Requirements
- Node.js (v20+ recommended)
- Grenache Grape (for DHT bootstrapping)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Grenache Grape globally (if not already):**
   ```bash
   npm install -g grenache-grape
   ```

3. **Start two Grape nodes in separate terminals:**
   ```bash
   grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
   grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
   ```
   Or use the provided npm script:
   ```bash
   npm run start:grape
   ```

## Usage

You can create and run exchange nodes by importing the `ExchangeNode` class from `exchange-node.js`

```js
const ExchangeNode = require('./exchange-node.js');
const node = new ExchangeNode('http://127.0.0.1:30001');
```

- **Submit an order:**
  ```js
  node.submitOrder('buy', 100, 1); // side, price, quantity
  ```
- **Get the current order book:**
  ```js
  node.getOrderBook();
  ```
- **Close the node:**
  ```js
  node.close();
  ```

## Testing

- **Run all integration and unit tests:**
  ```bash
  npm test
  ```
  This runs the integration tests in `test/exchange-node.test.js` using Mocha.

- **Test files:**
  - `test/exchange-node.test.js`: Integration tests for node communication, order matching, and distributed state.
  - `test/orderbook.test.js`: Unit tests for the in-memory order book logic.

## Project Structure

- `exchange-node.js` — Main ExchangeNode class (Order handling, Grenache Server and Client)
- `orderbook.js` — In-memory order book and matching engine
- `test/` — Unit and integration tests

## Limitations & Future Work

### Current Limitations & Issues
- No persistent storage: All order books are in-memory and will be lost if a node restarts.
- No authentication or security: Any node can join and submit orders; there is no access control.
- No order cancellation or amendment: Once submitted, orders cannot be canceled or modified.
- No advanced error handling: Network failures, node crashes, or malformed messages may not be gracefully handled.
- Race conditions: While some tests check for race conditions, the distributed nature may still allow for inconsistent order books under heavy load or network delays. 
  > Note: I have tried to mimic and reproduce race conditions using randomized, concurrent order submissions in tests, but could not reliably trigger them in this implementation.

### Avoiding Race Conditions
To address race conditions in this project, practical solutions could include:
- Implementing message sequencing or versioning for orders, so nodes can detect and resolve out-of-order or conflicting updates.
- Introducing a centralized matching coordinator or leader node to serialize order matching decisions.
- Using distributed transaction queues or atomic broadcast mechanisms to ensure all nodes process orders in the same order.

These approaches can help ensure order book consistency across nodes and minimize the risk of race conditions in a distributed exchange environment.

### Future Work & Improvements
- Add persistent storage (e.g., database or file-based) for order books and trades.
- Implement authentication and access control for nodes and order submission.
- Add support for order cancellation and modification.
- Improve error handling and add logging for better observability.
- Optimize for performance and scalability in larger networks.
