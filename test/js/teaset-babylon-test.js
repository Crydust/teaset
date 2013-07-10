/*global QUnit, trimString, BABYLON, MyPoint, MyTriangle */
QUnit.module("teaset-babylon");
QUnit.test("MyTriangle.getNormal", function (assert) {
    "use strict";
    var a = new BABYLON.Vector3(0, 1, 0),
        b = new BABYLON.Vector3(1, 1, 0),
        c = new BABYLON.Vector3(1, 0, 0),
        aP = new MyPoint(),
        bP = new MyPoint(),
        cP = new MyPoint(),
        triangle = new MyTriangle(),
        normal;
    aP.vertex = a;
    bP.vertex = b;
    cP.vertex = c;
    triangle.points[0] = aP;
    triangle.points[1] = bP;
    triangle.points[2] = cP;
    normal = triangle.getNormal();
    
    assert.ok(normal !== undefined, "normal != undefined");
    assert.deepEqual(normal, new BABYLON.Vector3(0, 0, -1), "triangleNormal(a, b, c) === ?");
});
QUnit.test("MyPoint.getNormal", function (assert) {
    "use strict";
    var a = new BABYLON.Vector3(0, 1, 0),
        b = new BABYLON.Vector3(1, 1, 0),
        c = new BABYLON.Vector3(1, 0, 0),
        aP = new MyPoint(),
        bP = new MyPoint(),
        cP = new MyPoint(),
        triangle = new MyTriangle(),
        triangleNormal,
        pointNormal;
    aP.vertex = a;
    bP.vertex = b;
    cP.vertex = c;
    triangle.points[0] = aP;
    triangle.points[1] = bP;
    triangle.points[2] = cP;
    triangleNormal = triangle.getNormal();
    aP.triangles[0] = triangle;
    pointNormal = aP.getNormal();
    
    assert.ok(pointNormal !== undefined, "normal != undefined");
    assert.deepEqual(pointNormal, triangleNormal, "pointNormal == triangleNormal");
});