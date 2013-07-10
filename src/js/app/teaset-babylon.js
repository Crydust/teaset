/*jslint browser: true, devel: true, vars: true, sloppy: true, white: true, plusplus: true */
/*global Promise: false, BABYLON: false, patchToSurface: false */
//(function () {

var RENDERER = ['WebGL', 'Canvas'][!!window.WebGLRenderingContext ? 0 : 1];
var DENSITY = (RENDERER === 'WebGL' ? 12 : 6);
var MATERIAL = ['Basic', 'Lambert', 'Normal', 'Phong'][RENDERER === 'WebGL' ? 3 : 0];
var MOVING_LIGHT = false;
var WIDTH = 300;
var HEIGHT = 300;

if (navigator.userAgent.toLowerCase().indexOf('iphone') !== -1
|| navigator.userAgent.toLowerCase().indexOf('ipod') !== -1
|| navigator.userAgent.toLowerCase().indexOf('ipad') !== -1) {
    RENDERER = 'Canvas';
    MATERIAL = 'Basic';
    DENSITY = 4;
}

function MyPoint() {
    // index in the mesh vertices array
    this.index = -1;
    this.row = -1;
    this.column = -1;
    this.vertex = null;
    this.normal = null;
    this.triangles = [null];
}
MyPoint.prototype.getNormal = function () {
    var i, leni, triangle, temp;
    if (this.normal === null) {
        temp = BABYLON.Vector3.Zero();
        for (i = 0, leni = this.triangles.length; i < leni; i++) {
            triangle = this.triangles[i];
            if (triangle === null) {
                throw new Error("Point triangles not set");
            }
            temp = temp.add(triangle.getNormal());
        }
        temp.normalize();
        this.normal = temp;
    }
    return this.normal;
};
function MyTriangle() {
    this.points = [null, null, null];
    this.normal = null;
}
MyTriangle.prototype.getNormal = function () {
    var a, b, c, aV, bV, cV, edge1, edge2;
    if (this.normal === null) {
        a = this.points[0];
        b = this.points[1];
        c = this.points[2];
        if (a === null || b === null || c === null) {
            throw new Error("Triangle points not set");
        }
        aV = a.vertex;
        bV = b.vertex;
        cV = c.vertex;
        if (aV === null || bV === null || cV === null) {
            throw new Error("Triangle points vertex not set");
        }
        edge1 = bV.subtract(aV);
        edge2 = cV.subtract(aV);
        this.normal = BABYLON.Vector3.Cross(edge1, edge2);
    }
    return this.normal;
};
/*
function convertToGeometries(patchesAndVerticies, scale, rx, ry, rz, tx, ty, tz) {
    var scale = scale || 100;
        rx = rx || Math.PI / 2; //1.5707;
        ry = ry || 0;
        rz = rz || -0.4;
        tx = tx || 0;
        ty = ty || scale;
        tz = tz || 0;
    
    return new Promise(function (resolver) {
        var patches, verticies, i, leni, j, lenj, row, rowCount, colCount, patch, patchCount;
        patches = patchesAndVerticies.patches;
        verticies = patchesAndVerticies.verticies;
        
        for (i=0, leni=patches.length; i<leni; i++) {
            linePoints = [];
            patch = patches[i];
            points = [];
            for (j=0, lenj=16; j<lenj; j++) {
                vertex = verticies[patch[j]];
                points[j] = [vertex[0] * scale, vertex[1] * scale, vertex[2] * scale];
            }
            surfacePoints = patchToSurface(points, density);
            
            var geometry = new THREE.Geometry();
            var rowCount=surfacePoints.length-1;
            var colCount=surfacePoints[0].length-1;
        
        for (i = 0, leni = patches.length; i < leni; i++) {
            for (row = 0, rowCount = ; 
            mesh.setVertices(vertices, 1);
            mesh.setIndices(indices);
        }
    });
}
*/


































