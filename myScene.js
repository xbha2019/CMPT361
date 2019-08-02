var canvas;
var gl;
var program;

var numVertices  = 36;

var texSize = 4;
var numChecks = 2;

var horizon = false;
var vertical = false;

var red = new Uint8Array([255, 0, 0, 255]);
var green = new Uint8Array([0, 255, 0, 255]);
var blue = new Uint8Array([0, 0, 255, 255]);
var cyan = new Uint8Array([0, 255, 255, 255]);
var magenta = new Uint8Array([255, 0, 255, 255]);
var yellow = new Uint8Array([255, 255, 0, 255]);

var cubeMap;
var image_counter = 0;
var pointsArray = [];
var normalsArray = [];

var up = false;

var vertices_1 = [ 
    vec2(-1, -1),   
    vec2(3, -1),   
    vec2(-1, 3),
    vec2(3, -1),   
    vec2(-1, 3),
    vec2(3,3)
    
];
var vertices = [
    vec4( -5, -5,  5, 1.0 ),
    vec4( -5,  5,  5, 1.0 ),
    vec4( 5,  5,  5, 1.0 ),
    vec4( 5, -5,  5, 1.0 ),
    vec4( -5, -5, -5, 1.0 ),
    vec4( -5,  5, -5, 1.0 ),
    vec4( 5,  5, -5, 1.0 ),
    vec4( 5, -5, -5, 1.0 )
];


window.onload = init;


var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [0.0, 0.0,0.0];

//cube mapping to surrounding environment
function configureCubeMap() {

    cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var faces = [['https://raw.githubusercontent.com/xbha1989/CMPT361/master/AS3/VancouverConventionCentre/posx.jpg', gl.TEXTURE_CUBE_MAP_POSITIVE_X],
         ['https://raw.githubusercontent.com/xbha1989/CMPT361/master/AS3/VancouverConventionCentre/negx.jpg', gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
         ['https://raw.githubusercontent.com/xbha1989/CMPT361/master/AS3/VancouverConventionCentre/posy.jpg', gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
         ['https://raw.githubusercontent.com/xbha1989/CMPT361/master/AS3/VancouverConventionCentre/negy.jpg', gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
         ['https://raw.githubusercontent.com/xbha1989/CMPT361/master/AS3/VancouverConventionCentre/posz.jpg', gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
         ['https://raw.githubusercontent.com/xbha1989/CMPT361/master/AS3/VancouverConventionCentre/negz.jpg', gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];


    for (var i = 0; i < faces.length; i++)
    {
      var face = faces[i][1];
      var image = new Image();
      image.crossOrigin = "";
      image.onload = function (texture, face, image) {
        return function () {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
          requestAnimationFrame(render);
        }
      }(cubeMap, face, image);
      url = faces[i][0];
      image.src = url;
    }
    //gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

}

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[a]);
     var normal = cross(t1, t2);
     normal[3] = 0.0;

     pointsArray.push(vertices[a]);
     normalsArray.push(normal);

     pointsArray.push(vertices[b]);
     normalsArray.push(normal);

     pointsArray.push(vertices[c]);
     normalsArray.push(normal);;

     pointsArray.push(vertices[a]);
     normalsArray.push(normal);;

     pointsArray.push(vertices[c]);
     normalsArray.push(normal);;

     pointsArray.push(vertices[d]);
     normalsArray.push(normal);;
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //var projectionMatrix = ortho(-2, 2, -2, 2, -10, 10);
    var projectionMatrix = perspective(45, 1.6, 0.01, 100.0); 

    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix" ), false, flatten(projectionMatrix) );

    configureCubeMap();
    gl.activeTexture( gl.TEXTURE0 );
    gl.uniform1i(gl.getUniformLocation(program, "texMap"),0);

 /*  document.getElementById("ButtonA").onclick = function(){
        horizon = true;
        vertical = false;
        theta = [-90, 0, 0];  
    }
    document.getElementById("ButtonB").onclick = function(){
        horizon = false;
        vertical = true;
        theta = [-90, -90, 90];
    }*/
    
    document.getElementById("ButtonX").onclick = function(){
        theta[0] = -90;
        theta[2] = 0;
        theta[1] -= 2.0;
        
    }
    document.getElementById("ButtonY").onclick = function(){
        theta[0] = -90;
        theta[2] = 0;
        theta[1] += 2.0;
    };


   // document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    render();
}

var render = function(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(0.0, 0.0, 1.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    var modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], [0, 0, 1]));

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix) );

    var normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix) );

   // gl.drawArrays( gl.TRIANGLES, 0, 6 );
   gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimFrame(render);
}