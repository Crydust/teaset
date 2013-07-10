/*global QUnit, trimString, loadText, loadPatch, cubic_1d, cubic_3d, patchToSurface */
QUnit.module("common", {
    setup: function () {
        "use strict";
        this.PATCH_FILE_CONTENTS = [
            "1",
            "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16",
            "16",
            "0.0,0.0,0.0",
            "1.0,0.0,0.0",
            "2.0,0.0,0.0",
            "3.0,0.0,0.0",
            "0.0,1.0,0.0",
            "1.0,1.0,0.0",
            "2.0,1.0,0.0",
            "3.0,1.0,0.0",
            "0.0,2.0,0.0",
            "1.0,2.0,0.0",
            "2.0,2.0,0.0",
            "3.0,2.0,0.0",
            "0.0,3.0,0.0",
            "1.0,3.0,0.0",
            "2.0,3.0,0.0",
            "3.0,3.0,0.0"
        ].join("\n");
    }
});
QUnit.test("test trimString(str)", function (assert) {
    "use strict";
    var str = "a";
    assert.ok(trimString(str) === "a", "trimString('" + str + "') === 'a'");
    str = "a ";
    assert.ok(trimString(str) === "a", "trimString('" + str + "') === 'a'");
    str = " a";
    assert.ok(trimString(str) === "a", "trimString('" + str + "') === 'a'");
    str = " a ";
    assert.ok(trimString(str) === "a", "trimString('" + str + "') === 'a'");
});
QUnit.test("test loadPatch(fp)", function (assert) {
    "use strict";
    QUnit.stop();
    loadPatch(this.PATCH_FILE_CONTENTS).then(function (o) {
        assert.ok(o.patches.length === 1);
        assert.ok(o.verticies.length === 16);
        QUnit.start();
    });
});
QUnit.test("test cubic_1d(a, b, c, d, t)", function (assert) {
    "use strict";
    var isClose = function (a, b, delta) {
        delta = delta || 0.02;
        return Math.abs(a - b) < 0.02;
    };
    assert.ok(isClose(cubic_1d(0, 1, 2, 3, 0.0000), 0), "cubic_1d(a, b, c, d, t) === 0");
    assert.ok(isClose(cubic_1d(0, 1, 2, 3, 0.3333), 1), "cubic_1d(a, b, c, d, t) === 1");
    assert.ok(isClose(cubic_1d(0, 1, 2, 3, 0.6666), 2), "cubic_1d(a, b, c, d, t) === 2");
    assert.ok(isClose(cubic_1d(0, 1, 2, 3, 1.0000), 3), "cubic_1d(a, b, c, d, t) === 3");
});
QUnit.test("test cubic_3d(a, b, c, d, t)", function (assert) {
    "use strict";
    var a = [0.0, 0.0, 0.0],
        b = [0.0, 1.0, 0.0],
        c = [1.0, 1.0, 0.0],
        d = [1.0, 0.0, 0.0],
        t;
    t = 0;
    assert.deepEqual(cubic_3d(a, b, c, d, t), a,
                     "cubic_3d(a, b, c, d, t) === [0.0, 0.0, 0.0]");
    t = 0.5;
    assert.deepEqual(cubic_3d(a, b, c, d, t), [0.5, 0.75, 0.0],
                     "cubic_3d(a, b, c, d, t) === [0.5, 0.75, 0.0]");
    t = 1;
    assert.deepEqual(cubic_3d(a, b, c, d, t), d,
                     "cubic_3d(a, b, c, d, t) === [1.0, 0.0, 0.0]");
});
QUnit.test("test patchToSurface(patchPoints, density)", function (assert) {
    "use strict";
    QUnit.stop();
    loadPatch(this.PATCH_FILE_CONTENTS).then(function (o) {
        var surface = patchToSurface(o.verticies, 3);
        assert.equal(surface.length, 4);
        assert.equal(surface[0].length, 4);
        assert.deepEqual(surface[0][0], [0.0, 0.0, 0.0]);
        assert.deepEqual(surface[0][3], [3.0, 0.0, 0.0]);
        assert.deepEqual(surface[3][0], [0.0, 3.0, 0.0]);
        assert.deepEqual(surface[3][3], [3.0, 3.0, 0.0]);
        QUnit.start();
    });
});