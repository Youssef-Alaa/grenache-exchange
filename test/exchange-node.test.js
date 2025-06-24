// Integration tests for ExchangeNode
const { expect } = require('chai');
const { spawn } = require('child_process');
const ExchangeNode = require('../exchange-node.js');

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

describe('ExchangeNode Integration', function() {
  this.timeout(120000); // Increase timeout for more rounds and delays to test race conditions
  let nodeA, nodeB, nodeC;
  let grape1, grape2;

  before(async function() {
    // Start grape nodes as in the terminal
    grape1 = spawn('grape', ['--dp', '20001', '--aph', '30001', '--bn', '127.0.0.1:20002']);
    grape2 = spawn('grape', ['--dp', '20002', '--aph', '40001', '--bn', '127.0.0.1:20001']);

    await delay(1000); // Wait for grapes to bootstrap

    nodeA = new ExchangeNode('http://127.0.0.1:30001');
    nodeB = new ExchangeNode('http://127.0.0.1:40001');
    nodeC = new ExchangeNode('http://127.0.0.1:30001');
    await delay(1000); // Wait for nodes to initialize
  });

  after(function(done) {
    if (nodeA) nodeA.close();
    if (nodeB) nodeB.close();
    if (nodeC) nodeC.close();

    const grapes = [grape1, grape2].filter(Boolean);
    if (grapes.length === 0) return done();

    let exited = 0;
    grapes.forEach(grape => {
      grape.once('exit', () => {
        exited++;
        if (exited === grapes.length) done();
      });
      grape.kill();
    });
  });

  beforeEach(() => {
    nodeA.resetOrderBook();
    nodeB.resetOrderBook();
    nodeC.resetOrderBook();
  });

  it('should submit an order and receive a local trade', async () => {
    const res = await nodeA.submitOrder('buy', 100, 1);
    expect(res).to.be.an('array');
    expect(res[0]).to.have.property('status');
  });

  it('should retrieve the order book', async () => {
    await nodeA.submitOrder('buy', 100, 1);
    const book = nodeA.getOrderBook();
    expect(book.buys).to.have.lengthOf(1);
  });

  it('should handle unknown requests gracefully', done => {
    nodeA.service.emit('request', 1, 'exchange_orders', { type: 'unknown' }, {
      reply: (err, res) => {
        expect(res.status).to.equal('unknown request');
        done();
      }
    });
  });

  it('should match orders between two nodes', async () => {
    await nodeA.submitOrder('buy', 101, 1);
    await nodeB.submitOrder('sell', 100, 1);
    const bookA = nodeA.getOrderBook();
    const bookB = nodeB.getOrderBook();
    expect(bookA.buys).to.have.lengthOf(0);
    expect(bookA.sells).to.have.lengthOf(0);
    expect(bookB.buys).to.have.lengthOf(0);
    expect(bookB.sells).to.have.lengthOf(0);
  });

  it('should add the remainder of a partially matched order to the orderbook (integration)', async () => {
    await nodeA.submitOrder('buy', 101, 3);
    await nodeB.submitOrder('sell', 101, 1);
    const bookA = nodeA.getOrderBook();
    const bookB = nodeB.getOrderBook();
    // After matching, buy order should have 2 units left on both nodes
    expect(bookA.buys).to.have.lengthOf(1);
    expect(bookA.buys[0].quantity).to.equal(2);
    expect(bookA.sells.length).to.equal(0);
    expect(bookB.buys).to.have.lengthOf(1);
    expect(bookB.buys[0].quantity).to.equal(2);
    expect(bookB.sells.length).to.equal(0);
  });

//   it('should demonstrate a race condition with multiple nodes, many orders, and random delays', async () => {
//     let raceDetected = false;
//     for (let round = 0; round < 10; round++) {
//       nodeA.resetOrderBook();
//       nodeB.resetOrderBook();
//       nodeC.resetOrderBook();
//       const allPromises = [];
//       // Each node submits 5 buy and 5 sell orders in parallel, with random delays
//       for (let i = 0; i < 5; i++) {
//         allPromises.push(new Promise(res => setTimeout(() => res(nodeA.submitOrder('buy', 100, 1)), Math.floor(Math.random() * 100))));
//         allPromises.push(new Promise(res => setTimeout(() => res(nodeA.submitOrder('sell', 100, 1)), Math.floor(Math.random() * 100))));
//         allPromises.push(new Promise(res => setTimeout(() => res(nodeB.submitOrder('buy', 100, 1)), Math.floor(Math.random() * 100))));
//         allPromises.push(new Promise(res => setTimeout(() => res(nodeB.submitOrder('sell', 100, 1)), Math.floor(Math.random() * 100))));
//         allPromises.push(new Promise(res => setTimeout(() => res(nodeC.submitOrder('buy', 100, 1)), Math.floor(Math.random() * 100))));
//         allPromises.push(new Promise(res => setTimeout(() => res(nodeC.submitOrder('sell', 100, 1)), Math.floor(Math.random() * 100))));
//       }
//       await Promise.all(allPromises);
//       // Wait a bit for all processing to finish
//       await delay(1500);
//       const bookA = nodeA.getOrderBook();
//       const bookB = nodeB.getOrderBook();
//       const bookC = nodeC.getOrderBook();
//       const allEmpty =
//         bookA.buys.length === 0 && bookA.sells.length === 0 &&
//         bookB.buys.length === 0 && bookB.sells.length === 0 &&
//         bookC.buys.length === 0 && bookC.sells.length === 0;
//       if (!allEmpty) {
//         raceDetected = true;
//         console.warn(`Race condition detected in round ${round + 1}: at least one orderbook is not empty when it should be.`);
//         break;
//       }
//     }
//     expect(raceDetected).to.equal(true);
//   });
}); 