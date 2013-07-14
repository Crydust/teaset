/*jslint browser: true, devel: true, vars: true, white: true, plusplus: true */
/*global Promise, BABYLON, patchToSurface, loadText, loadPatch, DEBUG: true */
(function () {
    'use strict';
        
    var DEBUG = window.DEBUG || false;
    var DENSITY = 12;
    var MOVING_LIGHT = false;
    var WIDTH = 300;
    var HEIGHT = 300;
    
    function MyPoint(x, y, z) {
        // index in the mesh vertices array
        this.x = x;
        this.y = y;
        this.z = z;
        this.index = -1;
        this.vertex = null;
        this.normal = null;
        this.triangles = [];
        this.hash = null;
    }
    MyPoint.prototype.calcVertex = function () {
        if (this.vertex === null) {
            this.vertex = new BABYLON.Vector3(this.x, this.y, this.z);
        }
        return this.vertex;
    };
    MyPoint.prototype.calcNormal = function () {
        var i, leni, triangle, temp;
        if (this.normal === null) {
            temp = BABYLON.Vector3.Zero();
            for (i = 0, leni = this.triangles.length; i < leni; i++) {
                triangle = this.triangles[i];
                if (triangle === null) {
                    throw new Error("Point triangles not set");
                }
                temp = temp.add(triangle.calcNormal());
            }
            temp.normalize();
            this.normal = temp;
        }
        return this.normal;
    };
    MyPoint.prototype.calcHash = function () {
        if (this.hash === null) {
            this.hash = ['x',this.x.toFixed(6),'y', this.y.toFixed(6),'z', this.z.toFixed(6)].join('');
        }
        return this.hash;
    };
    if (DEBUG) {
        window.MyPoint = MyPoint;
    }
    function MyTriangle(a, b, c) {
        this.points = [a, b, c];
        a.triangles.push(this);
        b.triangles.push(this);
        c.triangles.push(this);
        this.normal = null;
    }
    MyTriangle.prototype.calcNormal = function () {
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
    if (DEBUG) {
        window.MyTriangle = MyTriangle;
    }
    
    function convertBezierSurfaceControlPointsToTriangles(patchesAndVerticies) {
        var i, leni, j, lenj, patch, row, col, rowCount, colCount, controlPoints, surfacePoints, vertex, hash, surfacePointsArray, a, b, c, d, triangle1, triangle2;
        var patches = patchesAndVerticies.patches;
        var verticies = patchesAndVerticies.verticies;
        var surfaces = [];
        var pointsArray = [];
        var pointsMap = {};
        var trianglesArray = [];
        for (i=0, leni=patches.length; i<leni; i++) {
            //calc surfacepoints
            patch = patches[i];
            controlPoints = [];
            for (j=0, lenj=16; j<lenj; j++) {
                vertex = verticies[patch[j]];
                controlPoints[j] = [vertex[0], vertex[1], vertex[2]];
            }
            surfacePoints = patchToSurface(controlPoints, DENSITY);
            
            // create points
            rowCount=surfacePoints.length-1;
            colCount=surfacePoints[0].length-1;
            surfacePointsArray = [];
            for (row=0; row<=rowCount; row++) {
                for (col=0; col<=colCount; col++) {
                    var point = new MyPoint(
                        surfacePoints[row][col][0],
                        surfacePoints[row][col][1],
                        surfacePoints[row][col][2]);
                    hash = point.calcHash();
                    if (pointsMap.hasOwnProperty(hash)) {
                        point = pointsMap[hash];
                    } else {
                        point.calcVertex();
                        pointsMap[hash] = point;
                        point.index = pointsArray.length;
                        pointsArray.push(point);
                    }
                    surfacePointsArray.push(point);
                }
            }
            // create triangles
            // and calc triangle normals
            // and assign triangles to their points
            for (row=0; row<rowCount; row++) {
                for (col=0; col<colCount; col++) {
                    a = surfacePointsArray[row * (colCount+1) + col];
                    b = surfacePointsArray[row * (colCount+1) + col + 1];
                    c = surfacePointsArray[(row + 1) * (colCount+1) + col];
                    d = surfacePointsArray[(row + 1) * (colCount+1) + col + 1];
                    triangle1 = new MyTriangle(a, c, d);
                    triangle1.calcNormal();
                    trianglesArray.push(triangle1);
                    triangle2 = new MyTriangle(a, d, b);
                    triangle2.calcNormal();
                    trianglesArray.push(triangle2);
                }
            }
            
        }
        // calc points normals
        for(i = 0, leni = pointsArray.length; i < leni; i++) {
            pointsArray[i].calcNormal();
        }
        return {
            pointsArray: pointsArray,
            trianglesArray: trianglesArray
        };
    }
    
    function convertTrianglesToIndexesAndVertexes(pointsAndTriangles) {
        var pointsArray = pointsAndTriangles.pointsArray;
        var trianglesArray = pointsAndTriangles.trianglesArray;
        var i, leni, point, triangle;
        var indices = [];
        var vertices = [];
        for (i = 0, leni = pointsArray.length; i < leni; i++) {
            point = pointsArray[i];
            vertices.push(point.x, point.y, point.z,
                          point.normal.x, point.normal.y, point.normal.z,
                          0.0, 1.0);
        }
        for (i = 0, leni = trianglesArray.length; i < leni; i++) {
            triangle = trianglesArray[i];
            indices.push(triangle.points[0].index, triangle.points[1].index, triangle.points[2].index);
        }
        return {
            indices: indices,
            vertices: vertices
        };
    }
    
    function convertIndexesAndVertexesToMesh(indexesAndVertexes, scene){
        var indices = indexesAndVertexes.indices,
            vertices = indexesAndVertexes.vertices,
            mesh = new BABYLON.Mesh("mesh", [3, 3, 2], scene);
        mesh.setVertices(vertices, 1);
        mesh.setIndices(indices);
        return mesh;
    }
    
    function doLoad(){
        var hash = window.location.hash;
        var modelId = "teapot";
        if (hash && hash.indexOf("=") !== -1) {
            modelId = hash.split("=")[1];
            if (!/^(teapot|teacup|teaspoon)$/.test(modelId)) {
                modelId = 'teapot';
            }
        }
        if (BABYLON.Engine.isSupported()) {
        loadText(modelId + '.txt')
        .then(function(text){
            var patchesAndVerticies = loadPatch(text);
            //var patchesAndVerticies = patchToSurface(patchPoints, DENSITY);
            var pointsAndTriangles = convertBezierSurfaceControlPointsToTriangles(patchesAndVerticies);
            
            var indexesAndVertexes = convertTrianglesToIndexesAndVertexes(pointsAndTriangles);
        
            var canvas = document.getElementById("renderCanvas");
            var engine = new BABYLON.Engine(canvas, true);
            var scene = new BABYLON.Scene(engine);
            var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -10), scene);
            
            //var camera1 = new BABYLON.ArcRotateCamera("Camera1", 0, 0.8, 10, BABYLON.Vector3.Zero(), scene);

            //scene.activeCamera = camera1;
            //camera.attachControl(canvas);
            
            var light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(100, -100, 200), scene);
            //var sphere = BABYLON.Mesh.CreateSphere("Sphere", 16, 4, scene);
            var mesh = convertIndexesAndVertexesToMesh(indexesAndVertexes, scene);
            
            mesh.rotation.x = Math.PI * 2.8 / 2;
            mesh.position.y = -1.2;
            
            // Render loop
            var renderLoop = function (currentTime) {
                // Start new frame
                engine.beginFrame();
                
                //mesh.rotation.z = alpha;
                mesh.rotation.z = Math.sin(currentTime / 4000) * Math.PI;
                
                if (MOVING_LIGHT) {
                    light0.position.x = 100 + Math.sin(currentTime / 500) * 100;
                    light0.position.y = -100 + Math.cos(currentTime / 1000) * 100;
                }
                
                scene.render();
            
                // Present
                engine.endFrame();
            
                // Register new frame
                BABYLON.Tools.QueueNewFrame(renderLoop);
            };
            
            BABYLON.Tools.QueueNewFrame(renderLoop);
        });
        } else {
            alert('BABYLON.Engine.isSupported() == false');
        }
    }
    
    window.onload = doLoad;
    //window.onhashchange = doLoad;
    

}());