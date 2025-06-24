// Grenache P2P Exchange Node
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');
const OrderBook = require('./orderbook');

class ExchangeNode {
  constructor(grapeUrl) {
    this.link = new Link({ grape: grapeUrl });
    this.link.start();
    this._initServer();
    this._initClient();
    this.orderBook = new OrderBook();
  }

  _initServer() {
    this.peer = new PeerRPCServer(this.link, {});
    this.peer.init();

    const port = 1024 + Math.floor(Math.random() * 1000);
    this.service = this.peer.transport('server');
    this.service.listen(port);

    this._announceInterval = setInterval(() => {
      this.link.announce('exchange_orders', this.service.port, {});
    }, 1000);

    this.service.on('request', (rid, key, payload, handler) => {
      if (!payload) {
        handler.reply(null, { status: 'invalid request' });
        return;
      }
      switch (payload.type) {
        case 'order':
          this.orderBook.addOrder(payload.order);
          const trades = this.orderBook.matchOrders();
          handler.reply(null, { status: 'order received', trades });
          break;
        case 'getOrders':
          handler.reply(null, this.orderBook.getOrders());
          break;
        default:
          handler.reply(null, { status: 'unknown request' });
      }
    });
  }

  _initClient() {
    this.client = new PeerRPCClient(this.link, {});
    this.client.init();
  }

  async submitOrder(side, price, quantity) {
    const order = {
      id: Math.random().toString(36).slice(2),
      side,
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      timestamp: Date.now()
    };

    return new Promise((resolve) => {
      this.client.map(
        'exchange_orders',
        { type: 'order', order },
        { timeout: 10000 },
        (err, data) => {
          if (err) return resolve([{ error: err.message }]);
          if (!data) return resolve([]);
          // data is an array of responses from peers
          const results = data.map((resp, idx) => ({ peer: `peer${idx}`, ...resp }));
          resolve(results);
        }
      );
    });
  }

  getOrderBook() {
    return this.orderBook.getOrders();
  }

  close() {
    if (this._announceInterval) clearInterval(this._announceInterval);
    if (this.service && typeof this.service.close === 'function') this.service.close();
    if (this.link && typeof this.link.stop === 'function') this.link.stop();
    if (this.client && typeof this.client.stop === 'function') this.client.stop();
    if (this.peer && typeof this.peer.stop === 'function') this.peer.stop();
  }

  // Used in tests to reset the order book
  resetOrderBook() {
    this.orderBook = new OrderBook();
  }
}

module.exports = ExchangeNode; 