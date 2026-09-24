var app = app || {};

var origin = {
    nodeArray: [],
    linkArray: []
};

var chosedElement = {
    Nodes: new Set([]),
    Links: new Set([]),
    Routing: new Set([])
}

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: 800,
    height: 600,
    gridSize: 10,
    drawGrid: true,
    background: {
        color: 'rgba(150, 250, 200, 0.3)'
    }

});

var startPoint = { x: 0, y: 0 };
var newScale = 1;
var originSize = { height: 0, width: 0, tx: 0, ty: 0 };
var mainContainer = $(".main-container");
var paperContainer = $("#paper-container");
var paperContent = $("#paper");

var VarPad = 50;

var miniScale = 0.1;
var miniMap = $(".mini-map");
var miniPaper = $("#mini-paper");
var miniPaperJ = new joint.dia.Paper({
    el: document.getElementById('mini-paper'),
    model: graph,
    width: 800 * miniScale,
    height: 600 * miniScale,
    background: {
        color: 'rgba(150, 250, 200, 0.3)'
    }

});
var miniView = $("#mini-view");
var appResize = $("#app-resize");


miniView.css({
    border: "2px solid #31d0c6",
    position: "absolute",
    backgroundColor: "rgba(250, 200, 200, 0.2)",
    cursor: "move"
});
var centerPivot = {
    left: (mainContainer.width() / 2 - paperContainer.position.left) * miniScale,
    top: (mainContainer.height() / 2 - paperContainer.position.top) * miniScale
};
var miniResize = $("#mini-resize");
var rightContainer = $(".right-container");

function setContainerAndMini() {
    var newWidth = paper.options.width + 200;
    var newHeight = paper.options.height + 100;
    var newTop = 0;
    var newLeft = 0;
    if (newWidth > (2 * newHeight)) {
        newHeight = newWidth / 2;
        newLeft = (newWidth - paper.options.width) / 2;
        newTop = (newHeight - paper.options.height) / 2;
    } else {
        newWidth = 2 * newHeight;
        newLeft = (newWidth - paper.options.width) / 2;
        newTop = (newHeight - paper.options.height) / 2;
    };
    paperContent.css({
        left: newLeft,
        top: newTop
    });

    miniScale = 300 / newWidth;
    paperContainer.css({ height: newHeight, width: newWidth });

    miniPaperJ.setDimensions(miniScale * paper.options.width, miniScale * paper.options.height);
    miniPaperJ.scaleContentToFit({ padding: VarPad * miniScale })


    miniPaper.css("left", miniScale * newLeft);
    miniPaper.css("top", miniScale * newTop);
    miniView.css({
        height: miniScale * mainContainer.height(), width: miniScale * mainContainer.width(),
        left: -1 * miniScale * paperContainer.position().left,
        top: -1 * miniScale * paperContainer.position().top
    });
}


miniMap.on(
    {
        "mousedown": function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            miniView.css({
                left: Math.round(evt.pageX - (miniView.width() / 2)),
                top: Math.round(evt.pageY - (miniView.height() / 2)),
            });
            paperContainer.css({
                left: -1 * Math.round(miniView.position().left / miniScale),
                top: -1 * Math.round(miniView.position().top / miniScale)
            });
            $("body").on("mousemove", function (evt) {
                miniView.css({
                    left: Math.round(evt.pageX - (miniView.width() / 2)),
                    top: Math.round(evt.pageY - (miniView.height() / 2)),
                });
                paperContainer.css({
                    left: -1 * Math.round(miniView.position().left / miniScale),
                    top: -1 * Math.round(miniView.position().top / miniScale)
                });

            });
            $("body").on("mouseup", function (evt) {
                $(this).off("mousemove mouseup");
            })
        }
    }
);
miniView.on(
    {
        "mousedown": function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var tempX = evt.pageX;
            var tempY = evt.pageY;
            var tempLT = miniView.position();
            $("body").on("mousemove", function (evt) {
                miniView.css({
                    left: evt.pageX - tempX + tempLT.left,
                    top: evt.pageY - tempY + tempLT.top,
                });
                paperContainer.css({
                    left: -1 * Math.round(miniView.position().left / miniScale),
                    top: -1 * Math.round(miniView.position().top / miniScale)
                });

            });
            $("body").on("mouseup", function (evt) {
                $(this).off("mousemove mouseup");
            })
        }
    }
);
var contentSize = paper.getContentBBox();
var ERKeyNow = undefined;
const ERMask = joint.highlighters.mask;
const ERMaskRect = joint.dia.HighlighterView.extend({

    tagName: 'rect',

    attributes: {
        'stroke': 'red',
        'fill': '#fff000',
        'fill-opacity': 0.5,
        'pointer-events': 'none'
    },

    options: {
        padding: 5
    },

    // Method called to highlight a CellView
    highlight(_cellView, _node) {
        const { padding } = this.options;
        const bbox = _cellView.model.getBBox();
        // Highlighter is always rendered relatively to the CellView origin
        bbox.x = bbox.y = 0;
        // Increase the size of the highlighter
        bbox.inflate(padding);
        this.vel.attr(bbox.toJSON());
    },

    // Method called to unhighlight a CellView
    unhighlight(_cellView, _node) {
        // Cleaning required when the highlighter adds
        // attributes/nodes to the CellView or Paper.
        // This highlighter only renders a rectangle.
    }

});

const ERHighlightLink = function (id) {
    ERMask.add(paper.findViewByModel(id), 'body', 'highlight-red', {
        deep: true,
        attrs: {
            'stroke': '#FF4365',
            'stroke-width': 2
        }
    });
    ERMaskRect.add(graph.getCell(id).findView(miniPaperJ), 'root', 'highlight-mini', {
        layer: 'front' // "layer" is an option inherited from the base class
    });
    graph.getLinks().filter(function (cell) { return cell.attributes.source.id == id || cell.attributes.target.id == id }).forEach(function (cell) {
        chosedElement.Links.add(cell.id);
        ERMask.add(cell.findView(paper), 'line', 'highlight-yellow', {
            padding: 1,
            deep: true,
            attrs: {
                'stroke': '#fff000',
                'stroke-width': 2
            }
        });
    });
};
const ERUnhighlight = function (id) {
    if (undefined != graph.getCell(id)) {
        joint.dia.HighlighterView.remove(graph.getCell(id).findView(paper));
        joint.dia.HighlighterView.remove(graph.getCell(id).findView(miniPaperJ));
    }
};

paper.on({
    'cell:pointerup': function (cellView) {
        var contentSize2 = paper.getContentBBox();
        var changex = Math.abs(contentSize2.width - contentSize.width);
        var changey = Math.abs(contentSize2.height - contentSize.height);

        if (changex > 20 * newScale || changey > 20 * newScale) {
            VarPad = 50 * newScale;
            paper.fitToContent({
                padding: VarPad,
                allowNewOrigin: "any"
            });
            setContainerAndMini();
            contentSize = contentSize2;
        }
        else {

        }

    },
    'blank:pointerdown': function (evt) {
        startPoint.x = evt.clientX;
        startPoint.y = evt.clientY;
        var nowOffSet = paperContainer.position();
        $("body").on("mousemove", function (evt) {
            var changes = {
                x: evt.clientX - startPoint.x,
                y: evt.clientY - startPoint.y
            };
            var newtop = nowOffSet.top + changes.y;
            var newleft = nowOffSet.left + changes.x;

            paperContainer.css({
                top: newtop,
                left: newleft
            });

            miniView.css({
                height: miniScale * mainContainer.height(), width: miniScale * mainContainer.width(),
                left: -1 * miniScale * paperContainer.position().left,
                top: -1 * miniScale * paperContainer.position().top
            });

        });
        $("body").on("mouseup", function (evt) {
            $(this).off("mousemove mouseup");
        });


    },
    'blank:pointerdblclick': function (evt) {
        /*highlight off */

        chosedElement.Nodes.forEach(ERUnhighlight);

        chosedElement.Links.forEach(ERUnhighlight);
        chosedElement.Routing.forEach(ERUnhighlight);
        chosedElement.Nodes.clear();

        chosedElement.Links.clear();
        chosedElement.Routing.clear();
        /* graph.getCells().forEach(function (cell) {
            joint.dia.HighlighterView.remove(cell.findView(paper));
        }) */
    },
    'element:mouseenter': function (elementView) {
        var model = elementView.model;
        var bbox = model.getBBox();
        var ellipseRadius = (1 - Math.cos(g.toRad(45)));
        var offset = model.attr(['pointers', 'pointerShape']) === 'ellipse'
            ? { x: -ellipseRadius * bbox.width / 2, y: ellipseRadius * bbox.height / 2 }
            : { x: -3, y: 3 };

        elementView.addTools(new joint.dia.ToolsView({
            tools: [
                new joint.elementTools.Remove({
                    useModelGeometry: true,
                    y: '0%',
                    x: '100%',
                    offset: offset
                }),
                new joint.elementTools.Boundary({
                    focusOpacity: 0.5,
                    padding: 10,
                    useModelGeometry: true
                })
            ]
        }));
    },
    'link:mouseenter': function (linkView) {
        linkView.addTools(new joint.dia.ToolsView({
            tools: [
                new joint.linkTools.Remove({
                    useModelGeometry: true,
                    y: '0%',
                    x: '100%',
                    offset: 1.0
                }),
                new joint.linkTools.Boundary({
                    focusOpacity: 0.5,
                    padding: 3,
                    useModelGeometry: true
                })
            ]
        }));
    },
    'element:pointerclick': function (elementView) {
        ERKeyNow = elementView.model.id;
        chosedElement.Nodes.add(ERKeyNow);
        ERHighlightLink(ERKeyNow);

        var ERName = document.getElementById("ERName");
        ERName.value = JSON.stringify(elementView.model.attr().label.text.split("\n"));
        //ERName.style = "width:" + ERName.value.length * 0.5 + "em";

        var ERMemo = document.getElementById("ERMemo");
        ERMemo.value = elementView.model.attr().name.text;

    },
    'cell:mouseleave': function (cellView) {
        cellView.removeTools();
    },
    'blank:contextmenu': function (evt, x, y) {
        alert("position:" + "\n left:" + x + "\n top:" + y);
    }/* ,
    'cell:mouseover': function (cellView, evt) {
        var pos = paper.clientToLocalPoint(evt.clientX, evt.clientY);
        document.getElementById("pointx").textContent = pos.x;
        document.getElementById("pointy").textContent = pos.y;
    },
    'blank:mouseover': function (evt) {
        var pos = paper.clientToLocalPoint(evt.clientX, evt.clientY);
        document.getElementById("pointx").textContent = pos.x;
        document.getElementById("pointy").textContent = pos.y;
    } */
});
function viewScale(rate) {
    originSize = {
        width: paper.options.width,
        height: paper.options.height,
        tx: paper.translate().tx,
        ty: paper.translate().ty
    };
    var centerX = mainContainer.width() / 2;
    var centerY = mainContainer.height() / 2;
    centerPivot = {
        left: (centerX - paperContainer.position().left) * miniScale,
        top: (centerY - paperContainer.position().top) * miniScale
    }

    newScale = newScale * rate;
    if (newScale > 0.1 && newScale < 10) {
        //paper.scale(newScale, newScale, p.x, p.y);
        originSize = {
            width: rate * originSize.width,
            height: rate * originSize.height,
            tx: rate * originSize.tx,
            ty: rate * originSize.ty
        };
        VarPad = 50 * newScale;
        paper.setDimensions(originSize.width, originSize.height);
        paper.scaleContentToFit({ padding: VarPad });
        //paper.translate(originSize.tx, originSize.ty);

        setContainerAndMini();
        paperContainer.css({
            left: centerX - (centerPivot.left / miniScale),
            top: centerY - (centerPivot.top / miniScale)
        });
        miniView.css({
            left: -1 * miniScale * paperContainer.position().left,
            top: -1 * miniScale * paperContainer.position().top
        });
    }
    else {
        newScale = newScale / rate;
    }
}
//paper.$el
mainContainer.on('mousewheel DOMMouseScroll', function (e) {
    //function onMouseWheel(e){
    e.preventDefault();
    // e = e.originalEvent;
    // e.stopPropagation();
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) / 10;
    var rate = (newScale + delta) / newScale;
    var p = paper.clientToLocalPoint({ x: e.clientX, y: e.clientY });
    viewScale(rate);
    //console.log(' delta' + delta + ' ' + 'offsetX' + p.x + 'offsety' + p.y + 'newScale' + newScale)
});

miniResize.on(
    {
        "mousedown": function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            centerPivot = {
                left: miniView.width() / 2 + miniView.position().left,
                top: miniView.height() / 2 + miniView.position().top
            };
            $("body").on("mousemove", function (evt) {
                var rate = miniView.width() / (2 * (evt.pageX - centerPivot.left));
                if ((10 / rate) > newScale) {
                    viewScale(rate);
                } else {
                    rate = 10 / newScale;
                    viewScale(rate);
                }
            });
            $("body").on("mouseup", function (evt) {
                $(this).off("mousemove mouseup");
            })
        }
    }
);

appResize.on({
    "mousedown": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var tempX = evt.pageX;
        var tempRight1 = parseInt(appResize.css("right").split("px")[0]);
        $("body").on("mousemove", function (evt) {
            var xDelta = Math.round(tempX - evt.pageX) + tempRight1;
            appResize.css({
                right: xDelta
            });
            rightContainer.css({
                width: xDelta
            });
            mainContainer.css({
                right: xDelta + 6
            })

        });
        $("body").on("mouseup", function (evt) {
            $(this).off("mousemove mouseup");
        })
    }
})

app.ResizeBlock = function () {
    if (rightContainer.width() < 280) {
        appResize.css({
            right: 300
        });
        rightContainer.css({
            width: 300
        });
        mainContainer.css({
            right: 306
        });
        appResize.children().css({ "background-image": "url(assets/box-arrow-in-right.svg)" });
    } else {
        appResize.css({
            right: 0
        });
        rightContainer.css({
            width: 0
        });
        mainContainer.css({
            right: 6
        });
        appResize.children().css({ "background-image": "url(assets/box-arrow-in-left.svg)" });
    }
}

$("body").on('keydown', function (e) {
    // e.preventDefault();
    // e = e.originalEvent;
    // e.stopPropagation();
    if (e.altKey) {
        var delta = 0.2;
        if (38 == e.which) {
            var rate = (newScale + delta) / newScale;
            viewScale(rate);
        } else if (40 == e.which) {
            var rate = (newScale - delta) / newScale;
            viewScale(rate);
        } else if (219 == e.which || 221 == e.which) {
            app.ResizeBlock();
        }
    }
    //console.log(' delta' + delta + ' ' + 'offsetX' + p.x + 'offsety' + p.y + 'newScale' + newScale)
});


const status = document.getElementById('status');

app.makeNode = function (theKey, theLabel, theName, theColor, theImgPath, thePorts) {
    var portColor = "#61549c";
    var theWidth = 100;
    var theHeight = 100;
    return new joint.shapes.standard.Rectangle({
        id: theKey,
        size: { width: theWidth, height: theHeight },
        attrs: {
            label: {
                text: theLabel,
                fontSize: 12,
                fontFamily: 'monospace',
                fill: 'white',
                fontWeight: 'bold'
            },
            body: {
                fill: theColor,
                width: "100%",
                height: "100%",
                rx: 5,
                ry: 5,
                stroke: 'none'
            },
            image: {
                "xlink:href": theImgPath,
                width: 50,
                height: 50, x: theWidth / 2 - 25, y: theHeight / 2 - 25
            },
            name: {
                text: theName,
                fontSize: 12,
                fontFamily: 'monospace',
                fill: 'white',
                fontWeight: 'bold'
            }
        },
        markup: [

            {
                tagName: 'rect',
                selector: 'body',
            },
            {
                tagName: 'text',
                selector: 'label',
                attributes: {
                    y: -2 * theHeight / 5
                }
            },
            {
                tagName: "image",
                selector: "image"
            },
            {
                tagName: 'text',
                selector: 'name',
                attributes: {
                    transform: "matrix(1,0,0,1," + theWidth / 2 + "," + 8 * theHeight / 10 + ")",
                    "text-anchor": "middle",

                }
            }],
        ports: {
            groups: {
                in: {
                    attrs: {
                        portBody: { magnet: true, fill: portColor, stokeWidth: 0 },
                        portLabel: { fill: portColor, fontSize: 11, fontWeight: "Normal" }
                    },
                    markup: [{
                        tagName: "rect",
                        selector: "portBody",
                        attributes: {
                            height: 10,
                            width: 10,
                            x: -5,
                            y: -5
                        }
                    },
                    {
                        tagName: "text",
                        selector: "portLabel",
                        attributes: {
                            x: 6,
                            y: 3
                        }
                    }],
                    position: { name: "left" }
                },
                out: {
                    attrs: {
                        portBody: { magnet: true, fill: portColor, stokeWidth: 0 },
                        portLabel: { fill: portColor, fontSize: 11, fontWeight: "Normal" }
                    },
                    markup: [{
                        tagName: "rect",
                        selector: "portBody",
                        attributes: {
                            height: 10,
                            width: 10,
                            x: -5,
                            y: -5
                        }
                    },
                    {
                        tagName: "text",
                        selector: "portLabel",
                        attributes: {
                            x: -6,
                            y: 3,
                            "text-anchor": "end"
                        }
                    }],
                    position: { name: "right" }
                }
            },
            items: thePorts
        }
    });
};
app.nodeCreate = function (theNode) {
    var result = {};
    if ("0" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            theNode.type,
            theNode.name,
            "#FE854F",
            "assets/zero.svg",
            [{ group: "out", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("1" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            theNode.type,
            theNode.name,
            "#31D0C6",
            "assets/one.svg",
            [{ group: "out", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("Import" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            theNode.type,
            theNode.name,
            "#ff0000",
            "assets/input.svg",
            [{ group: "out", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("Export" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            theNode.type,
            theNode.name,
            "#ff00ff",
            "assets/output.svg",
            [{ group: "in", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("SEL" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            theNode.type,
            "",
            "#ffcccc",
            "assets/SEL.svg",
            [{
                group: "in", id: "SI",
                attrs: { portLabel: { text: "SI" } }
            },
            {
                group: "in", id: "0", attrs: { portLabel: { text: "0" } }
            },
            {
                group: "in", id: "1", attrs: { portLabel: { text: "1" } }
            },
            { group: "out", id: "SO", attrs: { portLabel: { text: "SO" } } },
            { group: "out", id: "N", attrs: { portLabel: { text: "N" } } },
            { group: "out", id: "P", attrs: { portLabel: { text: "P" } } }]

        );
    };
    return result;
};
app.linkCreate = function (theNode) {
    return new joint.shapes.standard.Link(
        {
            source: { id: theNode.from, magnet: "portBody", port: theNode.frompid },
            target: { id: theNode.to, magnet: "portBody", port: theNode.topid },
            smooth: true,
            connector: { name: "jumpover", args: { size: 5 } },
            router: {
                name: 'metro',
                args: {
                    step: 10,
                    startDirections: ["right"],
                    endDirections: ["left"]
                }
            }
        })
};
app.ELCreate = function (GraphDesc) {
    var result = [];
    for (oneNode of GraphDesc.nodeArray) {
        result.push(app.nodeCreate(oneNode));
    }
    for (oneLink of GraphDesc.linkArray) {
        result.push(app.linkCreate(oneLink));
    }
    return result;
};
app.ELDump = function (JsonCells) {
    var result = {
        nodeArray: [],
        linkArray: []
    };
    for (oneElem of JsonCells) {
        if ("standard.Link" == oneElem.type) {
            result.linkArray.push({
                "from": oneElem.source.id,
                "frompid": oneElem.source.port,
                "to":oneElem.target.id,
                "topid":oneElem.target.port
            });
        }
        else {
            if("SEL" == oneElem.attrs.label.text){
                result.nodeArray.push({
                    "key":oneElem.id,
                    "type":"SEL"
                });
            }else{
                result.nodeArray.push({
                    "key":oneElem.id,
                    "type":oneElem.attrs.label.text,
                    "name":oneElem.attrs.name.text
                });
            }
        }
    };
    return result;
}


app.parseLogic = function () {
    var exprText = document.getElementById("ReversePol").value;
    var resultParsed = LogicParser(exprText);
    if ("string" == typeof (resultParsed)) {
        status.textContent = resultParsed;
        status.style.color = "red";
    } else {
        var viewModel = ViewGen(ModelGen(resultParsed));
        origin = viewModel;
        document.getElementById("myModel").value = JSON.stringify(origin);
        status.textContent = "Reverse Polish Expression has been parsed.";
        status.style.color = "black";
    }
};

/* ============ 2026 改造新增：示例一键运行 ============ */
app.loadExample = function (expr) {
    document.getElementById("ReversePol").value = expr;
    app.parseLogic();
    app.load();
};

/* ============ 2026 改造新增：真值表生成 ============ */
/* 收集公式树中的变量名（叶子 "0"/"1" 为常量） */
function truthCollectVars(t, set) {
    if ("string" == typeof (t)) {
        if ("0" != t && "1" != t) { set.add(t); }
        return;
    }
    truthCollectVars(t.S, set);
    truthCollectVars(t["0"], set);
    truthCollectVars(t["1"], set);
}

/* 在给定赋值 env 下求值公式树 */
function truthEval(t, env) {
    if ("string" == typeof (t)) {
        if ("0" == t) { return 0; }
        if ("1" == t) { return 1; }
        return env[t];
    }
    return truthEval(t.S, env) ? truthEval(t["1"], env) : truthEval(t["0"], env);
}

app.showTruth = function () {
    var exprText = document.getElementById("ReversePol").value;
    var box = document.getElementById("truthTable");
    var parsed = LogicParser(exprText);
    /* 解析器用特定字符串返回错误；单个变量名也是合法的字符串结果 */
    if ("string" == typeof (parsed) && /^(Empty String|Format Error|use wrong Name)/.test(parsed)) {
        status.textContent = parsed;
        status.style.color = "red";
        box.innerHTML = "";
        return;
    }
    var varSet = new Set([]);
    truthCollectVars(parsed, varSet);
    var vars = Array.from(varSet).sort();
    if (vars.length > 10) {
        box.innerHTML = "<div class='truth-note'>变量超过 10 个（共 " + vars.length +
            " 个），真值表行数过多，仅显示前 10 个变量的 1024 行。</div>";
        vars = vars.slice(0, 10);
    }
    var html = "<table><tr>";
    for (var i = 0; i < vars.length; i++) { html += "<th>" + vars[i] + "</th>"; }
    html += "<th>输出</th></tr>";
    var rowCount = 1 << vars.length;
    for (var mask = 0; mask < rowCount; mask++) {
        var env = {};
        for (var j = 0; j < vars.length; j++) { env[vars[j]] = (mask >> (vars.length - 1 - j)) & 1; }
        var out = truthEval(parsed, env);
        html += "<tr>";
        for (var k = 0; k < vars.length; k++) { html += "<td>" + env[vars[k]] + "</td>"; }
        html += "<td class='out-" + out + "'>" + out + "</td></tr>";
    }
    html += "</table>";
    box.innerHTML = html;
    status.textContent = "真值表已生成：" + vars.length + " 个变量，共 " + rowCount + " 行。";
    status.style.color = "black";
};

app.updateGraph = function () {
    graph.resetCells(app.ELCreate(origin));
    joint.layout.DirectedGraph.layout(graph, {
        setLinkVertices: false,
        nodeSep: 100,
        edgeSep: 50,
        rankSep: 100,
        rankDir: "LR"
    });
    newScale = 1;
    paper.fitToContent({
        padding: 50,
        allowNewOrigin: "any"
    });
    setContainerAndMini();
    paperContainer.css({
        left: Math.round((mainContainer.width() - paperContainer.width()) / 2),
        top: Math.round((mainContainer.height() - paperContainer.height()) / 2),
        position: "absolute"
    });
    miniView.css({
        height: miniScale * mainContainer.height(), width: miniScale * mainContainer.width(),
        left: -1 * miniScale * paperContainer.position().left,
        top: -1 * miniScale * paperContainer.position().top
    });
}

/*从文本框区域内载入*/
app.load=function() {
    try {
        origin = JSON.parse(document.getElementById("myModel").value);
        status.textContent = "Diagram Model Loaded from JSON format.";
    }
    catch (error) {
        origin = {
            nodeArray: [],
            linkArray: []
        };
        status.textContent = "JSON format Error, Use Empty Format.";
        document.getElementById("myModel").value = JSON.stringify(origin);
    }
    //ERUpdateOption();
    app.updateGraph();
    app.UpdateOption();
};

app.save=function() {
    origin = app.ELDump(graph.toJSON().cells);
    document.getElementById("myModel").value = JSON.stringify(origin);
    status.textContent = "Diagram Model Saved in JSON format.";

};

function updateGraph() {
    graph.resetCells(ELCreate(origin));
    chosedElement.Sheets.clear();
    chosedElement.Fields.clear();
    chosedElement.Links.clear();
    joint.layout.DirectedGraph.layout(graph, {
        setLinkVertices: false,
        marginX: 5,
        marginY: 5
    });
    newScale = 1;
    paper.fitToContent({
        padding: 50,
        allowNewOrigin: "any"
    });
    setContainerAndMini();
    paperContainer.css({
        left: Math.round((mainContainer.width() - paperContainer.width()) / 2),
        top: Math.round((mainContainer.height() - paperContainer.height()) / 2),
        position: "absolute"
    });
    miniView.css({
        height: miniScale * mainContainer.height(), width: miniScale * mainContainer.width(),
        left: -1 * miniScale * paperContainer.position().left,
        top: -1 * miniScale * paperContainer.position().top
    });

};



/*从本地载入文件，保存文件到本地 */
if (window.FileList && window.File && window.FileReader) {
    document.getElementById("fileToLoad").addEventListener('change', event => {
        status.textContent = '已载入';
        const fileToLoad = event.target.files[0];
        if (!fileToLoad.type) {
            status.textContent = 'Error: The File.type property does not appear to be supported on this browser.';
            return;
        }
        /* if (!file.type.match('image.*')) {
          status.textContent = 'Error: The selected file does not appear to be an image.'
          return;
        } */
        const reader = new FileReader();
        reader.addEventListener('load', function (evt) {
            var textFromFileLoaded = evt.target.result;
            document.getElementById("myModel").value = textFromFileLoaded;
            app.load();
        });
        reader.readAsText(fileToLoad, "UTF-8");
    })

}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
};

app.saveTextAsFile = function () {
    var textToSave = document.getElementById("myModel").value;
    var textToSaveAsBlob = new Blob([textToSave], { type: "application/json" });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var fileNameToSaveAs = document.getElementById("inputFileNameToSaveAs").value;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);

    downloadLink.click();
};



/* if (0 == Object.keys(origin).length) {
    origin = {
        nodeArray: [],
        linkArray: []
    };
} */

sheet3Node = $("#sheet3");


app.UpdateOption = function () {
    var ImportNames = new Set([]);
    origin.nodeArray.forEach(function (theNode) {
        if (undefined != theNode.name && "" != theNode.name) {
            ImportNames.add(theNode.name);
        }
    })
    ImportNames = Array.from(ImportNames);
    sheet3Node.select2({
        placeholder: "输入要查找的元素名称:",
        data: ["sheet2Name1", "sheet2Name2"].concat(ImportNames),
        multiple: false,
        width: "17em"
    });

}

app.ChangeName = function () {
    try {
        var sheets = JSON.parse(document.getElementById("ERName").value);
    } catch (e) {
        alert("Format Error");
        return false;
    }
    if (!(sheets instanceof Array)) {
        alert("Format Error");
        return false;
    };
    if (0 == sheets.length) {
        alert("Format Error");
        return false;
    }
    var getArray = origin.nodeArray.filter(function (x) {
        if ("Sheet" == x.type) {
            for (z of sheets) {
                if (0 != x.name.filter(function (y) { return z == y }).length) {
                    return true;
                }
            }
        }
        return false;
    });
    if (getArray.length > 1) {
        alert("Name Repeated in other Sheets");
        return false;
    } else {
        var memoText = document.getElementById("ERMemo").value;
        ERUnhighlight(ERKeyNow);
        paper.findViewByModel(ERKeyNow).model.attr({
            label: { text: sheets.join("\n"), memo: memoText }
        });
        app.save();
    }
}



app.load();


