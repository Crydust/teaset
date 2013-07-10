/*jslint browser: true, devel: true, vars: true, sloppy: true, white: true, plusplus: true */
/*global Promise: false */

function trimString(str){
    return str.trim();
}

function loadText(url) {
    return new Promise(function(resolver) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                // IE error sometimes returns 1223 when it should be 204 so treat it as success, see #1450
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 1223) {
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
        
        var lines = fp.split("\n").map(trimString);

        lines.forEach(function(line){
            if (/^(?:\d+,){15}\d+$/.test(line)) {
                patches.push(line.split(",").map(
                        function(num){return parseInt(num, 10) - 1;}
                        ));
            }
            else if (/^(?:[\-0-9\.]+,){2}[\-0-9\.]+$/.test(line)) {
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
    for (i=0; i<4; i++) {
        points = patchPoints.slice(i*4, i*4+4);
        for (j=0; j<=density; j++) {
            t=j/density;
            intermediate[i].push(cubic_3d(points[0], points[1], points[2], points[3], t));
        }
    }
    for (i=0; i<=density; i++) {
        result[i] = [];
        for (j=0; j<=density; j++) {
            t=i/density;
            result[i].push(cubic_3d(intermediate[0][j], intermediate[1][j], intermediate[2][j], intermediate[3][j], t));
        }
    }
    return result;
}
