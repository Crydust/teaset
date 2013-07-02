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
    .then(drawModel);
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

function drawModel(patchesAndVerticies, scale, rx, ry, rz, tx, ty, tz) {
    scale = scale || 100;
    rx = rx || Math.PI / 2; //1.5707;
    ry = ry || 0;
    rz = rz || -0.4;
    tx = tx || 0;
    ty = ty || scale;
    tz = tz || 0;
    
    var patches = patchesAndVerticies.patches;
    var verticies = patchesAndVerticies.verticies;
    
    var canvas1 = document.getElementById("canvas1"),
    i, leni, j, lenj, k, lenk, patch, points, vertex, density, surfacePoints, linePoints;
    if (wl !== null) {
        wl.stop();
    }
    wl = new Wirelib(canvas1);
    density = 4;
    //wl.showCenter = true;
    wl.strokeStyle = "#30B209";
    //wl.strokeStyle = "rgba(50, 200, 9, 0.2)";
    wl.strokeStyle = "rgba(50, 200, 9, 1)";
    //wl.strokeStyle = "#000000";
    wl.context.lineCap = "butt";
    wl.context.lineJoin = "round";
    wl.lineWidth = 1;
    for (i=0, leni=patches.length; i<leni; i++) {
        linePoints = [];
        patch = patches[i];
        points = [];
        for (j=0, lenj=16; j<lenj; j++) {
            vertex = verticies[patch[j]];
            points[j] = [vertex[0] * scale, vertex[1] * scale, vertex[2] * scale];
        }
        surfacePoints = patchToSurface(points, density);
        for (var row=0, rowCount=surfacePoints.length-1; row<rowCount; row++) {
            // top border of row
            for (var col=surfacePoints[row].length-1; col>=0; col--) {
                linePoints.push(
                        surfacePoints[row][col][0], surfacePoints[row][col][1], surfacePoints[row][col][2]
                        );
            }
            //zigzag
            for (var col=0, colCount=surfacePoints[row].length-1; col<colCount; col++) {
                linePoints.push(
                        surfacePoints[row+1][col][0], surfacePoints[row+1][col][1], surfacePoints[row+1][col][2],
                        surfacePoints[row][col+1][0], surfacePoints[row][col+1][1], surfacePoints[row][col+1][2]
                        );
            }
        }
        // bottom border (same as top border)
        for (col=surfacePoints[row].length-1; col>=0; col--) {
            linePoints.push(
                    surfacePoints[row][col][0], surfacePoints[row][col][1], surfacePoints[row][col][2]
                    );
        }
        
        wl.addLine(linePoints);
    }

    wl.rotateX(rx);
    wl.rotateY(ry);
    wl.rotateZ(rz);
    wl.translate(tx, ty, tz);
    
    wl.draw();
    
    function onFrame() {
        wl.rotateY(0.03);
    }
    
    /*
    var previousTime = 0;
    var onRaf = function(currentTime){
        if (currentTime > previousTime + (1000 / 24)) {
            previousTime = currentTime;
            onFrame();
            wl.draw();
        }
        requestAnimationFrame(onRaf);
    };
    requestAnimationFrame(onRaf);
    */
    
    wl.loop(24, onFrame);
};
})();
