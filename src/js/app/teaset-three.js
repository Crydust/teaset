(function(){
var wl = null;
window.onload = doLoad;
window.onhashchange = doLoad;

function trimString(str){
    return str.trim();
}

function doLoad() {
    var hash = window.location.hash;
    var modelId = "teapot";
    if (hash && hash.indexOf("=") !== -1) {
        modelId = hash.split("=")[1];
        if (!/^(teapot|teacup|teaspoon)$/.test(modelId)) {
            modelId = 'teapot';
        }
    }
    loadText(modelId + '.txt')
    .then(loadPatch)
    .then(convertToGeometries)
    .then(createObjectAndRender);
}

function loadText(url) {
    return new Promise(function(resolver) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                // IE error sometimes returns 1223 when it should be 204 so treat it as success, see #1450
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 || xhr.status === 1223) {
                    resolver.resolve(xhr.response);
                } else {
                    resolver.reject(xhr.statustext);
                }
            }
        };
        xhr.onerror = function () {
            resolver.reject('error');
        };
        xhr.send(null);
    });
}

function loadPatch(fp) {
    return new Promise(function(resolver) {
    
        var patches = [];
        var verticies = [];
        
        lines = fp.split("\n").map(trimString);

        lines.forEach(function(line){
            if (/^(?:\d+,){15}\d+$/.test(line)) {
                patches.push(line.split(",").map(
                        function(num){return parseInt(num, 10) - 1;}
                        ));
            }
            else if (/^(?:[-0-9\.]+,){2}[-0-9\.]+$/.test(line)) {
                verticies.push(line.split(",").map(parseFloat));
            }
        });
        
        resolver.resolve({
            patches: patches,
            verticies: verticies
        });
    });
}

function cubic_1d(a, b, c, d, t) {
    var T = 1-t;
    return T*T*T*a + 3*t*T*T*b + 3*t*t*T*c + t*t*t*d;
}
function cubic_3d(a, b, c, d, t) {
    if (t === 0) {
        return a;
    }
    if (t === 1) {
        return d;
    }
    return [
        cubic_1d(a[0], b[0], c[0], d[0], t),
        cubic_1d(a[1], b[1], c[1], d[1], t),
        cubic_1d(a[2], b[2], c[2], d[2], t)
        ];
}

function patchToSurface(patchPoints, density) {
    var result = [],
    intermediate = [[], [], [], []],
    points, i=0, j, t;
    for (; i<4; i++) {
        points = patchPoints.slice(i*4, i*4+4);
        for (j=0; j<=density; j++) {
            t=j/density;
            intermediate[i].push(cubic_3d(points[0], points[1], points[2], points[3], t));
        }
    }
    i=0;
    for (; i<=density; i++) {
        result[i] = [];
        for (j=0; j<=density; j++) {
            t=i/density;
            result[i].push(cubic_3d(intermediate[0][j], intermediate[1][j], intermediate[2][j], intermediate[3][j], t));
        }
    }
    return result;
}


function convertToGeometries(patchesAndVerticies, scale, rx, ry, rz, tx, ty, tz) {
    return new Promise(function(resolver) {
    
        //console.log('drawModel');

        scale = scale || 100;
        rx = rx || Math.PI / 2; //1.5707;
        ry = ry || 0;
        rz = rz || -0.4;
        tx = tx || 0;
        ty = ty || scale;
        tz = tz || 0;
        
        var patches = patchesAndVerticies.patches;
        var verticies = patchesAndVerticies.verticies;
        
        var i, leni, j, lenj, k, lenk, patch, points, vertex, density, surfacePoints, linePoints;
        density = 6;
        
        var geometries = [];
        
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
            for (var row=0; row<=rowCount; row++) {
                for (var col=0; col<=colCount; col++) {
                    geometry.vertices.push(
                        new THREE.Vector3(
                            surfacePoints[row][col][0],
                            surfacePoints[row][col][1],
                            surfacePoints[row][col][2]));
                }
            }
            /*
            console.log({
            rowCount: rowCount,
            colCount: colCount,
            vertices: geometry.vertices,
            surfacePoints: surfacePoints
            })
            */
            for (var row=0; row<rowCount; row++) {
                for (var col=0; col<colCount; col++) {
                    geometry.faces.push(
                        new THREE.Face3(
                            row * (colCount+1) + col,
                            (row + 1) * (colCount+1) + col + 1,
                            (row + 1) * (colCount+1) + col
                            ));
                    geometry.faces.push(
                        new THREE.Face3(
                            row * (colCount+1) + col,
                            row * (colCount+1) + col + 1,
                            (row + 1) * (colCount+1) + col + 1
                            ));
                }
            }
            
            //console.log('a');
            //debugger;
            
            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            if (geometry.hasTangents) {
                geometry.computeTangents();
            }
            geometry.computeBoundingSphere();
            geometry.computeBoundingBox();
            THREE.GeometryUtils.triangulateQuads(geometry);
            geometries.push(geometry);
        }
        
        resolver.resolve(geometries);
    });
}



function createObjectAndRender(geometries){

    // set the scene size
    var WIDTH = 300,
        HEIGHT = 300;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // get the DOM element to attach to
    var $container = document.getElementById('container');

    // create a WebGL renderer, camera
    // and a scene
    //var renderer = new THREE.WebGLRenderer();
    var renderer = new THREE.CanvasRenderer();
    var camera = new THREE.PerspectiveCamera(
                                    VIEW_ANGLE,
                                    ASPECT,
                                    NEAR,
                                    FAR);
    var scene = new THREE.Scene();

    // the camera starts at 0,0,0 so pull it back
    camera.position.z = 1000;

    // start the renderer
    renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    $container.appendChild(renderer.domElement);

    // create the sphere's material
    var sphereMaterial = new THREE.MeshLambertMaterial({
        color: 0xCC0000
    });
    

    // set up the sphere vars
    var radius = 400, segments = 16, rings = 16;

    // create a new mesh with sphere geometry -
    // we will cover the sphereMaterial next!
    var sphereGeometry = new THREE.SphereGeometry(radius, segments, rings);
    //var sphere = new THREE.Mesh(
    //   sphereGeometry,
    //   sphereMaterial);
    
    //console.log(sphereGeometry.boundingSphere);
    //console.log(mergedGeometry.boundingSphere);
    var myObject = new THREE.Object3D();
    for (var i=0, len = geometries.length; i<len; i++) {
        var myMesh = new THREE.Mesh(
            geometries[i],
            new THREE.MeshBasicMaterial({color: 0x30B209, wireframe: true})
            //new THREE.MeshLambertMaterial()
            //new THREE.MeshNormalMaterial()
            //new THREE.MeshPhongMaterial()
            );
        myObject.add(myMesh);
    }
    
    //var cube = new THREE.Mesh( new THREE.CubeGeometry( 200, 200, 200 ), new THREE.MeshNormalMaterial() );
    //scene.add(cube);
    
    //console.log(myObject);
    myObject.position.y = -100;
    myObject.rotation.x = -Math.PI / 2.5;
	myObject.rotation.y = 0.0;
	myObject.rotation.z = 0.4;
    scene.add(myObject);
    
    // add the sphere to the scene
    //scene.add(sphere);

    // and the camera
    scene.add(camera);

    // create a point light
    var pointLight = new THREE.PointLight( 0xFFFFFF );

    // set its position
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 5000;

    // add to the scene
    scene.add(pointLight);
    
    //TODO get rid of raf when switching models
    animate();
    var previousime = 0;
    function animate(currentTime){
        if (currentTime > previousime + 1000 / 24) {
            previousime = currentTime;
            render();
        }
        requestAnimationFrame(animate);
    }
    function render(){
        myObject.rotation.z -= 0.03;
        renderer.render(scene, camera);
    }

}

}());