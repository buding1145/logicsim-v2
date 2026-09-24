// 量词功能单元测试：直接加载 LogicParser.js 并断言结果
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'public', 'LogicParser.js'), 'utf8');
eval(src);

let pass = 0, fail = 0;
function check(name, cond) {
    if (cond) { pass++; console.log('PASS  ' + name); }
    else { fail++; console.log('FAIL  ' + name); }
}
// 语义等价判断：枚举两个表达式全部变量的所有赋值，比较真值
function collectVars(t, set) {
    if (typeof t === 'string') {
        if (t !== '0' && t !== '1') set.add(t);
        return set;
    }
    collectVars(t.S, set); collectVars(t['0'], set); collectVars(t['1'], set);
    return set;
}
function evalTree(t, env) {
    if (typeof t === 'string') {
        if (t === '0') return 0;
        if (t === '1') return 1;
        return env[t];
    }
    return evalTree(t.S, env) ? evalTree(t['1'], env) : evalTree(t['0'], env);
}
function truthVector(t, vars) {
    const rows = [];
    for (let mask = 0; mask < (1 << vars.length); mask++) {
        const env = {};
        vars.forEach((v, i) => env[v] = (mask >> i) & 1);
        rows.push(evalTree(t, env));
    }
    return rows.join('');
}
// 解析结果：对象=公式树，字符串=变量名（合法）或错误消息（需区分）
function isParseError(t) {
    return typeof t === 'string' && /^(Empty String|Format Error|use wrong Name)/.test(t);
}
function equiv(exprA, exprB) {
    const tA = LogicParser(exprA), tB = LogicParser(exprB);
    if (isParseError(tA) || isParseError(tB)) return false;
    // 变量集合可能不同（如 ∀a(a∨b) 只剩 b），统一并入所有变量再比
    const all = Array.from(new Set([...collectVars(tA, new Set()), ...collectVars(tB, new Set())])).sort();
    const vA = truthVector(tA, all), vB = truthVector(tB, all);
    return vA === vB;
}
function isConst(expr, v) { // v: 0 或 1
    const t = LogicParser(expr);
    if (isParseError(t)) return false;
    const set = collectVars(t, new Set());
    if (set.size > 0) return false; // 量化后不应残留被消去的变量
    return evalTree(t, {}) === v;
}

// 原有功能回归
check('回归: a b . 解析成功', typeof LogicParser('a b .') === 'object');
check('回归: 空串报错', LogicParser('') === 'Empty String!');
check('回归: 参数不足报错', typeof LogicParser('a .') === 'string');
check('回归: a b , 等价于 b a ,', equiv('a b ,', 'b a ,'));

// 量词语义
check('∀a a ≡ 0（常量假）', isConst('a a ∀', 0));
check('∃a a ≡ 1（常量真）', isConst('a a ∃', 1));
check('∀a (a∨b) ≡ b', equiv('a b , a ∀', 'b'));
check('∃b (a∧b) ≡ a', equiv('a b . b ∃', 'a'));
check('∀a (a∨¬a) ≡ 1（排中律）', isConst('a a < , a ∀', 1));
check('∃a (a∧¬a) ≡ 0（矛盾律）', isConst('a a < . a ∃', 0));
check('∀a∀b (a∧b) ≡ 0', isConst('a b . b ∀ a ∀', 0));
check('∃a∃b (a∧b) ≡ 1', isConst('a b . b ∃ a ∃', 1));
check('∀a (a→b) ≡ b（∀a(¬a∨b)）', equiv('a b > a ∀', 'b'));
check('嵌套量词: ∀x∃y (x=y) ≡ 1', isConst('x y = y ∃ x ∀', 1));
check('嵌套量词: ∃x∀y (x=y) ≡ 0', isConst('x y = y ∀ x ∃', 0));

// 量词错误处理
check('量词参数不足报错', typeof LogicParser('a ∀') === 'string');
check('量词缺公式报错', typeof LogicParser('∀') === 'string');
check('量词作用于常量报错', typeof LogicParser('a 1 ∀') === 'string');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
