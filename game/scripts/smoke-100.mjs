#!/usr/bin/env node
/**
 * 100-case smoke suite for the salt-bread ordering app.
 *
 * Covers the pure logic that drives the customer-facing flow:
 *   - price/status formatters
 *   - cart math (add/remove/total/count)
 *   - category filtering
 *   - order-item shape conversion
 *   - checkout guards
 *   - status badge color picking
 *   - payment redirect parsing
 *
 * Run: node scripts/smoke-100.mjs
 */

// -------- Replicated production logic (kept in sync with src) --------

function formatPrice(krw) {
  return krw.toLocaleString('ko-KR') + '원';
}

function statusLabel(s) {
  return ({
    pending: '결제 대기',
    paid: '주문 접수',
    preparing: '준비 중',
    ready: '픽업 가능',
    picked_up: '픽업 완료',
    cancelled: '취소됨',
    failed: '결제 실패',
  })[s] ?? s;
}

const STATUS_COLOR = {
  pending: '#999',
  paid: '#FF8C00',
  preparing: '#FB8C00',
  ready: '#43A047',
  picked_up: '#888',
  cancelled: '#C62828',
  failed: '#C62828',
};

function inc(cart, id) {
  return { ...cart, [id]: (cart[id] || 0) + 1 };
}
function dec(cart, id) {
  const next = { ...cart };
  if (next[id] > 1) next[id] -= 1;
  else delete next[id];
  return next;
}
function lines(menus, cart) {
  return menus.filter((m) => cart[m.id] > 0).map((m) => ({ item: m, qty: cart[m.id] }));
}
function total(ls) {
  return ls.reduce((s, l) => s + l.item.price * l.qty, 0);
}
function itemCount(ls) {
  return ls.reduce((s, l) => s + l.qty, 0);
}
function filterByCategory(menus, cat) {
  return cat === 'all' ? menus : menus.filter((m) => m.category === cat);
}
function toOrderItems(ls) {
  return ls.map((l) => ({
    menuItemId: l.item.id,
    name: l.item.name,
    price: l.item.price,
    qty: l.qty,
    image: l.item.image,
  }));
}
function canCheckout(ls) {
  return ls.length > 0 && total(ls) > 0 && itemCount(ls) > 0;
}
function parsePaymentParams(search) {
  const p = new URLSearchParams(search);
  const status = p.get('payment');
  if (!status) return null;
  if (status === 'success') {
    const orderId = p.get('orderId');
    const paymentKey = p.get('paymentKey');
    const amount = parseInt(p.get('amount') || '0', 10);
    if (orderId && paymentKey && amount) {
      return { kind: 'success', orderId, paymentKey, amount };
    }
    return { kind: 'invalid' };
  }
  if (status === 'fail') {
    return { kind: 'fail', message: p.get('message') || '결제가 취소되었거나 실패했습니다.' };
  }
  return { kind: 'invalid' };
}
function pickupNumberDisplay(n) {
  if (n === null || n === undefined) return null;
  return String(n).padStart(4, '0');
}
function orderName(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].name;
  const restQty = items.reduce((c, it) => c + it.qty, 0) - items[0].qty;
  return `${items[0].name} 외 ${restQty}개`;
}

// -------- Test runner --------

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    failures.push({ name, message: err.message });
  }
}
function eq(actual, expected, label = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${label} expected ${e}, got ${a}`);
  }
}
function truthy(v, label = '') {
  if (!v) throw new Error(`${label} expected truthy, got ${JSON.stringify(v)}`);
}
function falsy(v, label = '') {
  if (v) throw new Error(`${label} expected falsy, got ${JSON.stringify(v)}`);
}

// -------- Fixtures --------

const menus = [
  { id: 'plain', name: '솔트빵 플레인', price: 3500, category: 'bread', image: '/x.png' },
  { id: 'everything', name: '에브리띵 솔트빵', price: 4200, category: 'bread', image: '/x.png' },
  { id: 'olive', name: '올리브 치즈 솔트빵', price: 4500, category: 'bread', image: '/x.png' },
  { id: 'basil', name: '바질 토마토 솔트빵', price: 4500, category: 'bread', image: '/x.png' },
  { id: 'garlic', name: '갈릭 버터 솔트빵', price: 4200, category: 'bread', image: '/x.png' },
  { id: 'cold-brew', name: '콜드브루', price: 5500, category: 'drink', image: '/x.png' },
  { id: 'latte', name: '콜드브루 라떼', price: 6000, category: 'drink', image: '/x.png' },
  { id: 'milktea', name: '밀크티', price: 7000, category: 'drink', image: '/x.png' },
  { id: 'hotteok', name: '호떡', price: 3000, category: 'tteok', image: '/x.png' },
  { id: 'choco', name: '초코번', price: 3800, category: 'other', image: '/x.png' },
];

// =================================================================
// 1. formatPrice — 10 cases (1-10)
// =================================================================
test('1. formatPrice 0', () => eq(formatPrice(0), '0원'));
test('2. formatPrice 100', () => eq(formatPrice(100), '100원'));
test('3. formatPrice 1000', () => eq(formatPrice(1000), '1,000원'));
test('4. formatPrice 3500', () => eq(formatPrice(3500), '3,500원'));
test('5. formatPrice 12345', () => eq(formatPrice(12345), '12,345원'));
test('6. formatPrice 100000', () => eq(formatPrice(100000), '100,000원'));
test('7. formatPrice 1234567', () => eq(formatPrice(1234567), '1,234,567원'));
test('8. formatPrice large', () => eq(formatPrice(99999999), '99,999,999원'));
test('9. formatPrice negative', () => eq(formatPrice(-500), '-500원'));
test('10. formatPrice fractional rounded by Intl', () => truthy(formatPrice(3500.99).includes('3,500')));

// =================================================================
// 2. statusLabel — 8 cases (11-18)
// =================================================================
test('11. statusLabel pending', () => eq(statusLabel('pending'), '결제 대기'));
test('12. statusLabel paid', () => eq(statusLabel('paid'), '주문 접수'));
test('13. statusLabel preparing', () => eq(statusLabel('preparing'), '준비 중'));
test('14. statusLabel ready', () => eq(statusLabel('ready'), '픽업 가능'));
test('15. statusLabel picked_up', () => eq(statusLabel('picked_up'), '픽업 완료'));
test('16. statusLabel cancelled', () => eq(statusLabel('cancelled'), '취소됨'));
test('17. statusLabel failed', () => eq(statusLabel('failed'), '결제 실패'));
test('18. statusLabel unknown falls back', () => eq(statusLabel('unknown'), 'unknown'));

// =================================================================
// 3. Status color map — 7 cases (19-25)
// =================================================================
test('19. color pending', () => eq(STATUS_COLOR.pending, '#999'));
test('20. color paid', () => eq(STATUS_COLOR.paid, '#FF8C00'));
test('21. color preparing', () => eq(STATUS_COLOR.preparing, '#FB8C00'));
test('22. color ready', () => eq(STATUS_COLOR.ready, '#43A047'));
test('23. color picked_up', () => eq(STATUS_COLOR.picked_up, '#888'));
test('24. color cancelled', () => eq(STATUS_COLOR.cancelled, '#C62828'));
test('25. color failed', () => eq(STATUS_COLOR.failed, '#C62828'));

// =================================================================
// 4. Cart add / remove / quantity transitions — 20 cases (26-45)
// =================================================================
test('26. inc on empty cart adds 1', () => eq(inc({}, 'plain'), { plain: 1 }));
test('27. inc twice yields qty 2', () => eq(inc(inc({}, 'plain'), 'plain'), { plain: 2 }));
test('28. inc different ids independent', () => eq(inc(inc({}, 'a'), 'b'), { a: 1, b: 1 }));
test('29. dec single item removes key', () => eq(dec({ plain: 1 }, 'plain'), {}));
test('30. dec qty 2 → 1', () => eq(dec({ plain: 2 }, 'plain'), { plain: 1 }));
test('31. dec missing id no-op', () => eq(dec({ plain: 1 }, 'nope'), { plain: 1 }));
test('32. dec on empty no-op', () => eq(dec({}, 'plain'), {}));
test('33. inc-dec restores empty', () => eq(dec(inc({}, 'plain'), 'plain'), {}));
test('34. inc 5x', () => {
  let c = {};
  for (let i = 0; i < 5; i++) c = inc(c, 'plain');
  eq(c, { plain: 5 });
});
test('35. inc many distinct', () => {
  let c = {};
  for (let i = 0; i < 10; i++) c = inc(c, menus[i].id);
  eq(Object.keys(c).length, 10);
});
test('36. dec all the way down', () => {
  let c = { plain: 3 };
  c = dec(c, 'plain');
  c = dec(c, 'plain');
  c = dec(c, 'plain');
  eq(c, {});
});
test('37. inc then dec keeps other items', () => {
  let c = { a: 2, b: 1 };
  c = dec(c, 'b');
  eq(c, { a: 2 });
});
test('38. inc preserves original immutably', () => {
  const c0 = { a: 1 };
  inc(c0, 'a');
  eq(c0, { a: 1 });
});
test('39. dec preserves original immutably', () => {
  const c0 = { a: 2 };
  dec(c0, 'a');
  eq(c0, { a: 2 });
});
test('40. inc large qty 100', () => {
  let c = {};
  for (let i = 0; i < 100; i++) c = inc(c, 'plain');
  eq(c.plain, 100);
});
test('41. dec from large qty', () => {
  let c = { plain: 100 };
  for (let i = 0; i < 50; i++) c = dec(c, 'plain');
  eq(c.plain, 50);
});
test('42. inc with falsy starting value', () => eq(inc({ plain: 0 }, 'plain'), { plain: 1 }));
test('43. dec qty 0 removes key', () => eq(dec({ plain: 0 }, 'plain'), {}));
test('44. mixed inc/dec sequence', () => {
  let c = {};
  c = inc(c, 'a');
  c = inc(c, 'b');
  c = inc(c, 'a');
  c = dec(c, 'b');
  eq(c, { a: 2 });
});
test('45. inc returns new object reference', () => {
  const c0 = {};
  truthy(inc(c0, 'a') !== c0, 'reference');
});

// =================================================================
// 5. lines / total / itemCount — 20 cases (46-65)
// =================================================================
test('46. lines empty cart empty', () => eq(lines(menus, {}), []));
test('47. lines single item', () => {
  const ls = lines(menus, { plain: 2 });
  eq(ls.length, 1);
  eq(ls[0].item.id, 'plain');
  eq(ls[0].qty, 2);
});
test('48. lines preserves menu order', () => {
  const ls = lines(menus, { latte: 1, plain: 1 });
  eq(ls.map((l) => l.item.id), ['plain', 'latte']);
});
test('49. lines skips zero qty', () => {
  const ls = lines(menus, { plain: 0, latte: 2 });
  eq(ls.map((l) => l.item.id), ['latte']);
});
test('50. lines skips missing menu', () => {
  const ls = lines(menus, { 'not-a-real-id': 5, plain: 1 });
  eq(ls.length, 1);
});
test('51. total empty 0', () => eq(total([]), 0));
test('52. total single', () => eq(total(lines(menus, { plain: 1 })), 3500));
test('53. total double qty', () => eq(total(lines(menus, { plain: 2 })), 7000));
test('54. total mixed', () => eq(total(lines(menus, { plain: 1, latte: 1 })), 9500));
test('55. total 3 items', () => eq(total(lines(menus, { plain: 2, latte: 1, milktea: 1 })), 20000));
test('56. itemCount empty 0', () => eq(itemCount([]), 0));
test('57. itemCount single', () => eq(itemCount(lines(menus, { plain: 1 })), 1));
test('58. itemCount qty 5', () => eq(itemCount(lines(menus, { plain: 5 })), 5));
test('59. itemCount mixed', () => eq(itemCount(lines(menus, { plain: 2, latte: 3, milktea: 1 })), 6));
test('60. total all menus qty 1', () => {
  const cart = Object.fromEntries(menus.map((m) => [m.id, 1]));
  const expected = menus.reduce((s, m) => s + m.price, 0);
  eq(total(lines(menus, cart)), expected);
});
test('61. total all menus qty 2', () => {
  const cart = Object.fromEntries(menus.map((m) => [m.id, 2]));
  const expected = menus.reduce((s, m) => s + m.price, 0) * 2;
  eq(total(lines(menus, cart)), expected);
});
test('62. itemCount all menus qty 3', () => {
  const cart = Object.fromEntries(menus.map((m) => [m.id, 3]));
  eq(itemCount(lines(menus, cart)), menus.length * 3);
});
test('63. total handles large qty', () => eq(total(lines(menus, { plain: 100 })), 350000));
test('64. total handles fractional? -> integer multiplication', () => eq(total(lines(menus, { milktea: 7 })), 49000));
test('65. lines + total round-trip independent of cart key order', () => {
  const cartA = { plain: 1, latte: 1 };
  const cartB = { latte: 1, plain: 1 };
  eq(total(lines(menus, cartA)), total(lines(menus, cartB)));
});

// =================================================================
// 6. Category filtering — 8 cases (66-73)
// =================================================================
test('66. filter all returns all', () => eq(filterByCategory(menus, 'all').length, menus.length));
test('67. filter bread', () => {
  const r = filterByCategory(menus, 'bread');
  eq(r.length, 5);
  truthy(r.every((m) => m.category === 'bread'));
});
test('68. filter drink', () => {
  const r = filterByCategory(menus, 'drink');
  eq(r.length, 3);
});
test('69. filter tteok', () => {
  const r = filterByCategory(menus, 'tteok');
  eq(r.length, 1);
  eq(r[0].id, 'hotteok');
});
test('70. filter other', () => eq(filterByCategory(menus, 'other').length, 1));
test('71. filter empty unknown category', () => eq(filterByCategory(menus, 'zzz').length, 0));
test('72. filter does not mutate source', () => {
  filterByCategory(menus, 'bread');
  eq(menus.length, 10);
});
test('73. filter by specific category returns new array', () => truthy(filterByCategory(menus, 'bread') !== menus));

// =================================================================
// 7. toOrderItems shape — 6 cases (74-79)
// =================================================================
test('74. toOrderItems empty', () => eq(toOrderItems([]), []));
test('75. toOrderItems single', () => {
  const items = toOrderItems(lines(menus, { plain: 2 }));
  eq(items, [{ menuItemId: 'plain', name: '솔트빵 플레인', price: 3500, qty: 2, image: '/x.png' }]);
});
test('76. toOrderItems preserves qty', () => {
  const items = toOrderItems(lines(menus, { plain: 3, latte: 1 }));
  eq(items.find((i) => i.menuItemId === 'plain').qty, 3);
});
test('77. toOrderItems total matches reduce', () => {
  const items = toOrderItems(lines(menus, { plain: 2, milktea: 1 }));
  const sum = items.reduce((s, it) => s + it.price * it.qty, 0);
  eq(sum, 14000);
});
test('78. toOrderItems strips internal category field', () => {
  const items = toOrderItems(lines(menus, { plain: 1 }));
  falsy(Object.prototype.hasOwnProperty.call(items[0], 'category'));
});
test('79. toOrderItems image carried through', () => {
  const items = toOrderItems(lines(menus, { plain: 1 }));
  eq(items[0].image, '/x.png');
});

// =================================================================
// 8. canCheckout guard — 5 cases (80-84)
// =================================================================
test('80. canCheckout empty false', () => falsy(canCheckout([])));
test('81. canCheckout single true', () => truthy(canCheckout(lines(menus, { plain: 1 }))));
test('82. canCheckout multi true', () => truthy(canCheckout(lines(menus, { plain: 2, latte: 1 }))));
test('83. canCheckout zero-priced single false (price=0 → total=0)', () => {
  const free = [{ item: { id: 'x', name: 'x', price: 0 }, qty: 1 }];
  falsy(canCheckout(free));
});
test('84. canCheckout qty 0 false', () => {
  const empty = [{ item: { id: 'x', name: 'x', price: 100 }, qty: 0 }];
  falsy(canCheckout(empty));
});

// =================================================================
// 9. orderName composition — 4 cases (85-88)
// =================================================================
test('85. orderName empty empty', () => eq(orderName([]), ''));
test('86. orderName single', () => {
  const items = toOrderItems(lines(menus, { plain: 1 }));
  eq(orderName(items), '솔트빵 플레인');
});
test('87. orderName two distinct', () => {
  const items = toOrderItems(lines(menus, { plain: 1, latte: 1 }));
  eq(orderName(items), '솔트빵 플레인 외 1개');
});
test('88. orderName single qty 3 (still single line, no "외")', () => {
  const items = toOrderItems(lines(menus, { plain: 3 }));
  eq(orderName(items), '솔트빵 플레인');
});

// =================================================================
// 10. parsePaymentParams — 6 cases (89-94)
// =================================================================
test('89. parsePayment empty', () => eq(parsePaymentParams(''), null));
test('90. parsePayment no payment key', () => eq(parsePaymentParams('?foo=bar'), null));
test('91. parsePayment success', () => {
  eq(
    parsePaymentParams('?payment=success&orderId=abc&paymentKey=K&amount=3500'),
    { kind: 'success', orderId: 'abc', paymentKey: 'K', amount: 3500 },
  );
});
test('92. parsePayment success missing amount → invalid', () => {
  eq(parsePaymentParams('?payment=success&orderId=abc&paymentKey=K'), { kind: 'invalid' });
});
test('93. parsePayment fail uses default message', () => {
  eq(
    parsePaymentParams('?payment=fail'),
    { kind: 'fail', message: '결제가 취소되었거나 실패했습니다.' },
  );
});
test('94. parsePayment fail with custom message', () => {
  eq(
    parsePaymentParams('?payment=fail&message=Network%20error'),
    { kind: 'fail', message: 'Network error' },
  );
});

// =================================================================
// 11. Pickup number display — 4 cases (95-98)
// =================================================================
test('95. pickup null', () => eq(pickupNumberDisplay(null), null));
test('96. pickup 1', () => eq(pickupNumberDisplay(1), '0001'));
test('97. pickup 42', () => eq(pickupNumberDisplay(42), '0042'));
test('98. pickup 9999', () => eq(pickupNumberDisplay(9999), '9999'));

// =================================================================
// 12. End-to-end scenarios — 2 cases (99-100)
// =================================================================
test('99. e2e: browse → add → adjust → checkout payload', () => {
  // user opens the menu, filters bread
  const breads = filterByCategory(menus, 'bread');
  eq(breads.length, 5);
  // adds 2 plain, 1 olive
  let cart = {};
  cart = inc(cart, 'plain');
  cart = inc(cart, 'plain');
  cart = inc(cart, 'olive');
  // realizes they want 1 plain
  cart = dec(cart, 'plain');
  // adds a drink
  cart = inc(cart, 'latte');
  const ls = lines(menus, cart);
  // 3 lines? plain 1, olive 1, latte 1 — but lines() sorts by menu order: plain, olive, latte
  eq(ls.map((l) => l.item.id), ['plain', 'olive', 'latte']);
  eq(itemCount(ls), 3);
  eq(total(ls), 3500 + 4500 + 6000);
  // checkout payload
  const items = toOrderItems(ls);
  truthy(canCheckout(ls));
  eq(orderName(items), '솔트빵 플레인 외 2개');
});
test('100. e2e: payment success → orderId surfaced', () => {
  const r = parsePaymentParams('?payment=success&orderId=ORDER_42&paymentKey=PK_TEST&amount=14000');
  eq(r.kind, 'success');
  eq(r.orderId, 'ORDER_42');
  eq(r.amount, 14000);
});

// -------- Report --------

console.log('');
console.log('=========================================');
console.log(` Salt-Bread Ordering — 100-case smoke run `);
console.log('=========================================');
console.log(` passed: ${passed}`);
console.log(` failed: ${failed}`);
console.log(` total : ${passed + failed}`);
if (failures.length) {
  console.log('');
  console.log('Failures:');
  for (const f of failures) {
    console.log(`  ✗ ${f.name}`);
    console.log(`     ${f.message}`);
  }
  process.exit(1);
}
console.log('  ✓ all green');
