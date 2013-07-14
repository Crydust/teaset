/*global QUnit, trimString, BABYLON, MyPoint, MyTriangle */
QUnit.module("teaset-babylon");
QUnit.test("MyTriangle.calcNormal", function (assert) {
    "use strict";
    var aP = new MyPoint(0, 1, 0),
        bP = new MyPoint(1, 1, 0),
        cP = new MyPoint(1, 0, 0),
        triangle = new MyTriangle(aP, bP, cP),
        normal;
    aP.calcVertex();
    bP.calcVertex();
    cP.calcVertex();
    normal = triangle.calcNormal();
    
    assert.ok(normal !== undefined, "normal != undefined");
    assert.deepEqual(normal, new BABYLON.Vector3(0, 0, -1), "triangleNormal(a, b, c) === ?");
});
QUnit.test("MyPoint.calcNormal", function (assert) {
    "use strict";
    var a = new BABYLON.Vector3(0, 1, 0),
        b = new BABYLON.Vector3(1, 1, 0),
        c = new BABYLON.Vector3(1, 0, 0),
        aP = new MyPoint(),
        bP = new MyPoint(),
        cP = new MyPoint(),
        triangle = new MyTriangle(aP, bP, cP),
        triangleNormal,
        pointNormal;
    aP.vertex = a;
    bP.vertex = b;
    cP.vertex = c;
    triangleNormal = triangle.calcNormal();
    aP.triangles[0] = triangle;
    pointNormal = aP.calcNormal();
    
    assert.ok(pointNormal !== undefined, "normal != undefined");
    assert.deepEqual(pointNormal, triangleNormal, "pointNormal == triangleNormal");
});

QUnit.test("MyPoint.calcHash", function (assert) {
    "use strict";
    var a = new BABYLON.Vector3(0, 1, 0),
        b = new BABYLON.Vector3(1, 1, 0),
        c = new BABYLON.Vector3(1, 0, 0),
        aP = new MyPoint(),
        bP = new MyPoint(),
        cP = new MyPoint(),
        triangle = new MyTriangle(aP, bP, cP),
        triangleNormal,
        pointNormal;
    aP.vertex = a;
    bP.vertex = b;
    cP.vertex = c;
    triangleNormal = triangle.calcNormal();
    aP.triangles[0] = triangle;
    pointNormal = aP.calcNormal();
    
    assert.ok(pointNormal !== undefined, "normal != undefined");
    assert.deepEqual(pointNormal, triangleNormal, "pointNormal == triangleNormal");
});