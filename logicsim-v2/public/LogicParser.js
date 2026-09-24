function LogicParser(npn) {
    var andM = function (a, b) {
        return {
            "S": a,
            "0": "0",
            "1": {
                "S": b,
                "0": "0",
                "1": "1"
            }
        }
    };
    var orM = function (a, b) {
        return {
            "S": a,
            "0": {
                "S": b,
                "0": "0",
                "1": "1"
            },
            "1": "1"
        }
    };
    var notM = function (a) {
        return {
            "S": a,
            "0": "1",
            "1": "0"
        }
    };
    var infM = function (a, b) {
        return {
            "S": a,
            "0": "1",
            "1": {
                "S": b,
                "0": "0",
                "1": "1"
            }
        }
    };
    var equalM = function (a, b) {
        return {
            "S": a,
            "0": {
                "S": b,
                "0": "1",
                "1": "0"
            },
            "1": {
                "S": b,
                "0": "0",
                "1": "1"
            }
        }
    };
    /* 量词支持（新增）：把公式树 t 中变量 name 约束为常量 v（"0"/"1"）
       即香农展开的代入操作，供全称量词 ∀ 与存在量词 ∃ 使用 */
    var restrictT = function (t, name, v) {
        if ("string" == typeof (t)) {
            return t == name ? v : t;
        }
        var s = restrictT(t.S, name, v);
        if ("0" == s) { return restrictT(t["0"], name, v); }
        if ("1" == s) { return restrictT(t["1"], name, v); }
        return {
            "S": s,
            "0": restrictT(t["0"], name, v),
            "1": restrictT(t["1"], name, v)
        };
    };
    /* 全称量词：forallM(x, F) = F[x:=0] 与 F[x:=1] */
    var forallM = function (x, f) {
        return andM(restrictT(f, x, "0"), restrictT(f, x, "1"));
    };
    /* 存在量词：existsM(x, F) = F[x:=0] 或 F[x:=1] */
    var existsM = function (x, f) {
        return orM(restrictT(f, x, "0"), restrictT(f, x, "1"));
    };
    var state = 0;
    var nstate = 0;
    /* state is
       0: tic
       1: toc
       we parse:
       ".": "and",
       ",": "or",
       ">": "infer",
       "<": "not"
       "=": "equal"
       "∀": "forall"（新增，用法："F x ∀"）
       "∃": "exists"（新增，用法："F x ∃"）
     */
    if ("" == npn) { return "Empty String!" };
    for (var e = [], s = npn.split(/(\.|,|<|>|=|∀|∃|\s)/), t = 0;
        t < s.length; t++) {
        var n = s[t];
        if ("" == n) { }
        else if (n.match(/\s/)) {
            if (1 == state) { state = 0; nstate++; }
        }
        else if (n.match(/\./)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed"
            }
            else {
                e.push(andM(temp2, temp1));
                nstate--;
            }
        }
        else if (n.match(/,/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed"
            }
            else {
                e.push(orM(temp2, temp1));
                nstate--;
            }
        }
        else if (n.match(/</)) {
            var temp1 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1) {
                return "Format Error: arguments less than needed"
            }
            else {
                e.push(notM(temp1));
            }
        }
        else if (n.match(/>/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed"
            }
            else {
                e.push(infM(temp2, temp1));
                nstate--;
            }
        }
        else if (n.match(/=/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed"
            }
            else {
                e.push(equalM(temp2, temp1));
                nstate--;
            }
        }
        else if ("∀" == n || "∃" == n) {
            /* 量词（新增）："F x ∀" 表示 ∀x.F，"F x ∃" 表示 ∃x.F */
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed"
            }
            else if ("string" != typeof (temp1) || "0" == temp1 || "1" == temp1) {
                return "Format Error: quantifier needs a variable name, e.g. \"a b . a ∀\""
            }
            else {
                e.push("∀" == n ? forallM(temp1, temp2) : existsM(temp1, temp2));
                nstate--;
            }
        }
        else {
            if (0 == state) {
                state = 1;
                e.push(n);
            }

        }

    };
    if (nstate > 1) { return "Format Error: arguments more than needed" };
    return e.pop();
};

function ModelGen(np) {
    /* 0:"<"
       1:">" */
    var result = {
        value: [],
        order: []
    };
    if ("string" == typeof (np)) {
        if ("1" == np) {
            result.value = [{ ".": ">" }];
            result.order = [];
        } else if ("0" == np) {
            result.value = [{ ".": "<" }];
            result.order = [];
        } else {
            var temp1 = { ".": ">" };
            var temp2 = { ".": "<" };
            temp1[np] = ">";
            temp2[np] = "<";
            result.value = [temp1, temp2];
            result.order = [np];
        }

    }
    else {
        var result1 = ModelGen(np.S);

        if (0 == result1.order.length) {
            if ("<" == result1.value[0]["."]) {
                result = ModelGen(np[0]);
            } else {
                result = ModelGen(np[1]);
            }
        }
        else {
            var myset = new Set(result1.order);

            var result2 = ModelGen(np[0]);
            var intersection2 = result2.order.filter(x => myset.has(x));

            var result3 = ModelGen(np[1]);
            var intersection3 = result3.order.filter(x => myset.has(x));

            var all0 = false;
            var all1 = false;

            for (let x of result1.value) {
                if ("<" == x["."]) {
                    for (let y of result2.value) {
                        var YesOrNot = true;
                        for (let z of intersection2) {
                            if (undefined != x[z] && undefined != y[z] && x[z] != y[z]) {
                                YesOrNot = false;
                                break;
                            }
                        };
                        if (YesOrNot) {
                            var newValue = {};
                            for (var k in x) {
                                var item = x[k];
                                newValue[k] = item;
                            }
                            for (let alpha of result2.order) {
                                if (undefined != y[alpha]) {
                                    newValue[alpha] = y[alpha];
                                }
                            };
                            newValue["."] = y["."];
                            if (">" == newValue["."]) {
                                all1 = true;
                            } else {
                                all0 = true;
                            };
                            result.value.push(newValue);
                        }
                    }
                }
                else {
                    for (let y of result3.value) {
                        var YesOrNot = true;
                        for (let z of intersection3) {
                            if (undefined != x[z] && undefined != y[z] && x[z] != y[z]) {
                                YesOrNot = false;
                                break;
                            }
                        };
                        if (YesOrNot) {
                            var newValue = {};
                            for (var k in x) {
                                var item = x[k];
                                newValue[k] = item;
                            }
                            for (let alpha of result3.order) {
                                if (undefined != y[alpha]) {
                                    newValue[alpha] = y[alpha];
                                }
                            };
                            newValue["."] = y["."];
                            if (">" == newValue["."]) {
                                all1 = true;
                            } else {
                                all0 = true;
                            };
                            result.value.push(newValue);
                        }
                    }
                }
            };
            if (all0 && !all1) {
                result = {
                    value: [{ ".": "<" }],
                    order: []
                }
            } else if (all1 && !all0) {
                result = {
                    value: [{ ".": ">" }],
                    order: []
                }
            }
            else {
                var tempOrder = new Set(
                    result1.order.concat(result2.order).concat(result3.order)
                );
                result.order = Array.from(tempOrder);
            }
        }
    }
    return result;
}

function ViewGen(pn) {
    var countKey = 2;
    var result = {
        nodeArray: [
            { "key": "0", "type": "0", "name": "Zero" },
            { "key": 1, "type": "1", "name": "One" },
            { "key": 2, "type": "Export", "name": "Out" }
        ],
        linkArray: []
    }
    function ViewGen0(pnp, NodeKey, PortId) {
        if (1 == pnp.value.length) {
            if ("<" == pnp.value[0]["."]) {
                return {
                    nodeArray: [],
                    linkArray: [{ "from": "0", "frompid": "OUT", "to": NodeKey, "topid": PortId }]
                };
            } else {
                return {
                    nodeArray: [],
                    linkArray: [{ "from": 1, "frompid": "OUT", "to": NodeKey, "topid": PortId }]
                };
            }
        }
        else {
            var CName = "";
            for (CName0 of pnp.order) {
                if (pnp.value.length == pnp.value.filter(function (x) { return undefined != x[CName0] }).length) {
                    CName = CName0;
                }
            }

            if ("" != CName) {
                var TempOrder = pnp.order.filter(function(x){
                    return x  != CName
                });

                var pnp1 = {
                    value: pnp.value.filter(function (x) { return "<" == x[CName] }),
                    order: TempOrder
                };
                var pnp2 = {
                    value: pnp.value.filter(function (x) { return ">" == x[CName] }),
                    order: TempOrder
                };

                countKey++;
                var NodeKeyNow = countKey;
                var NodeLink1 = ViewGen0(pnp1, NodeKeyNow, "0");
                var NodeLink2 = ViewGen0(pnp2, NodeKeyNow, "1");

                return {
                    nodeArray: [{ "key": NodeKeyNow, "type": "SEL" }].concat(NodeLink1.nodeArray, NodeLink2.nodeArray),
                    linkArray: [{ "from": NodeKeyNow, "frompid": "N", "to": NodeKey, "topid": PortId },
                    { "from": CName, "frompid": "OUT", "to": NodeKeyNow, "topid": "SI" }].concat(NodeLink1.linkArray, NodeLink2.linkArray)
                };
            }
        }
    };
    for (x of pn.order) {
        result.nodeArray = result.nodeArray.concat({ "key": x, "type": "Import", "name": x })
    }
    var temp = ViewGen0(pn, countKey, "OUT");
    result.nodeArray = result.nodeArray.concat(temp.nodeArray);
    result.linkArray = result.linkArray.concat(temp.linkArray);
    return result;
}