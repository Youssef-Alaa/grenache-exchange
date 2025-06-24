// Unit tests for OrderBook
const { expect } = require('chai');
const OrderBook = require('../orderbook');

describe('OrderBook', () => {
  let ob;
  beforeEach(() => {
    ob = new OrderBook();
  });

  it('should add buy orders and sort by price descending, then timestamp ascending', () => {
    ob.addOrder({ id: '1', side: 'buy', price: 100, quantity: 1, timestamp: 1 });
    ob.addOrder({ id: '2', side: 'buy', price: 101, quantity: 1, timestamp: 2 });
    ob.addOrder({ id: '3', side: 'buy', price: 100, quantity: 1, timestamp: 0 });
    expect(ob.buys.map(o => o.id)).to.eql(['2', '3', '1']);
  });

  it('should add sell orders and sort by price ascending, then timestamp ascending', () => {
    ob.addOrder({ id: '1', side: 'sell', price: 100, quantity: 1, timestamp: 1 });
    ob.addOrder({ id: '2', side: 'sell', price: 99, quantity: 1, timestamp: 2 });
    ob.addOrder({ id: '3', side: 'sell', price: 100, quantity: 1, timestamp: 0 });
    expect(ob.sells.map(o => o.id)).to.eql(['2', '3', '1']);
  });

  it('should match orders and return trades', () => {
    ob.addOrder({ id: 'b1', side: 'buy', price: 101, quantity: 2, timestamp: 1 });
    ob.addOrder({ id: 's1', side: 'sell', price: 100, quantity: 1, timestamp: 2 });
    const trades = ob.matchOrders();
    expect(trades).to.have.lengthOf(1);
    expect(trades[0]).to.include({ price: 100, quantity: 1, buyOrderId: 'b1', sellOrderId: 's1' });
    expect(ob.buys[0].quantity).to.equal(1);
    expect(ob.sells.length).to.equal(0);
  });

  it('should handle partial fills and update order book', () => {
    ob.addOrder({ id: 'b1', side: 'buy', price: 101, quantity: 1, timestamp: 1 });
    ob.addOrder({ id: 's1', side: 'sell', price: 100, quantity: 2, timestamp: 2 });
    const trades = ob.matchOrders();
    expect(trades).to.have.lengthOf(1);
    expect(trades[0].quantity).to.equal(1);
    expect(ob.sells[0].quantity).to.equal(1);
    expect(ob.buys.length).to.equal(0);
  });

  it('should return correct order book state', () => {
    ob.addOrder({ id: 'b1', side: 'buy', price: 101, quantity: 1, timestamp: 1 });
    ob.addOrder({ id: 's1', side: 'sell', price: 102, quantity: 1, timestamp: 2 });
    const book = ob.getOrders();
    expect(book.buys).to.have.lengthOf(1);
    expect(book.sells).to.have.lengthOf(1);
  });
}); 