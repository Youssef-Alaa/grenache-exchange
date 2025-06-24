// Simple in-memory order book for buy and sell orders
class OrderBook {
  constructor() {
    this.buys = [];
    this.sells = [];
  }

  // Add a new order to the book and keep it sorted
  addOrder(order) {
    if (order.side === 'buy') {
      this.buys.push(order);
      // Highest price first, then earliest timestamp
      this.buys.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    } else if (order.side === 'sell') {
      this.sells.push(order);
      // Lowest price first, then earliest timestamp
      this.sells.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
    }
  }

  // Match buy and sell orders, return list of trades that happened
  matchOrders() {
    const trades = [];
    while (
      this.buys.length &&
      this.sells.length &&
      this.buys[0].price >= this.sells[0].price
    ) {
      const buy = this.buys[0];
      const sell = this.sells[0];
      const quantity = Math.min(buy.quantity, sell.quantity);
      trades.push({
        price: sell.price,
        quantity,
        buyOrderId: buy.id,
        sellOrderId: sell.id
      });
      buy.quantity -= quantity;
      sell.quantity -= quantity;
      if (buy.quantity === 0) this.buys.shift();
      if (sell.quantity === 0) this.sells.shift();
    }
    return trades;
  }

  getOrders() {
    return {
      buys: this.buys,
      sells: this.sells
    };
  }
}

module.exports = OrderBook; 