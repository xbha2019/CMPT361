var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var stack = [];

var figure = [];

var baseRotate = false;
var lowerArmRotate = false;
var upperArmRotate = false;

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 2.0;
var LOWER_ARM_HEIGHT = 6.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 4.0;
var UPPER_ARM_WIDTH  = 0.4;

var baseId = 0;
var lowerArmId  = 1;
var upperArmId = 2;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var theta= [ 0, 0, 0];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d ) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//drwa a ball
var ball_color = [];

var numTimesToSubdivide = 6;

var index = 0;

var pointsArray = [];

var mouseClickLoc = [0.0,0.0];

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

function triangle(a, b, c) {
     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);
     ball_color.push(vec4(1.0,0.0,0.0,1.0));
     ball_color.push(vec4(1.0,0.0,0.0,1.0));
     ball_color.push(vec4(1.0,0.0,0.0,1.0));
     index += 3;
}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = normalize(mix( a, b, 0.5), true);
        var ac = normalize(mix( a, c, 0.5), true);
        var bc = normalize(mix( b, c, 0.5), true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { // draw tetrahedron at end of recursion
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}



//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case baseId:

    m = rotate(theta[baseId], 0, 1, 0 );
    figure[baseId] = createNode( m, base, null, lowerArmId );
    break;

    case lowerArmId:


    m = translate(0.0, BASE_HEIGHT, 0.0);
    m = mult(m, rotate(theta[lowerArmId], 0, 0, 1))
    figure[lowerArmId] = createNode( m, lowerArm, null, upperArmId);
    break;


    case upperArmId:

    m = translate(0.0, LOWER_ARM_HEIGHT, 0.0);
    m = mult(m, rotate(theta[upperArmId], 0, 0, 1));
    figure[upperArmId] = createNode( m, upperArm, null, null );
    break;


    }

}

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}
//--------------------------------------------------

//IK function to calculate joint angles
var lowerAngle = 0;
var upperAngle = 0;
var theta1 = 0;
function calculateIK(x,y){
    theta1 = Math.acos(x/(Math.sqrt(Math.pow(x,2)+Math.pow(y,2))));
    theta1 = (theta1*180)/Math.PI;
    console.log(theta1);
    var a = Math.pow(LOWER_ARM_HEIGHT,2) + Math.pow(x,2) + Math.pow(y,2) - Math.pow(UPPER_ARM_HEIGHT,2);
    var b = 2*LOWER_ARM_HEIGHT*(Math.sqrt(Math.pow(x,2)+Math.pow(y,2)));
    lowerAngle = theta1 - ((Math.acos(a/b))*180)/Math.PI;   
    console.log(lowerAngle);
    var c = Math.pow(LOWER_ARM_HEIGHT,2) - Math.pow(x,2) - Math.pow(y,2) + Math.pow(UPPER_ARM_HEIGHT,2);
    var d = 2*LOWER_ARM_HEIGHT*UPPER_ARM_HEIGHT;
    upperAngle = 180 - ((Math.acos(c/d))*180)/Math.PI;
    console.log(upperAngle);
}

var isIK = false;
var lowerDis;
var upperDis;

window.addEventListener("mousedown", function(e){
    if (e.which === 1){
        mouseClickLoc[0] = 2*event.clientX/canvas.width-1;
        mouseClickLoc[1] = 2*(canvas.height-event.clientY)/(canvas.height) - 0.5;
        console.log(mouseClickLoc[0]+"  "+mouseClickLoc[1]);
        if(mouseClickLoc[0]>-1.0&&mouseClickLoc[0]<1.0&&mouseClickLoc[1]>-1.0&&mouseClickLoc[1]<1.0){
            isIK = true;
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            calculateIK(mouseClickLoc[0]*10,mouseClickLoc[1]*10);
            console.log(lowerAngle+"  "+upperAngle);
            var oldLower = theta[lowerArmId];
            var oldUpper = theta[upperArmId];
            var newLower = 0;
            var newUpper = 0;
            if(mouseClickLoc[0]>0&&mouseClickLoc[1]>0){
                if(theta1<60){
                    newLower = lowerAngle-60;
                    newUpper = -upperAngle-13;
                }else if(mouseClickLoc[1]<0.2){
                    newLower = 0;
                    newUpper = -upperAngle-50;
                }else if(theta1>60&&theta1<65){
                    newLower = -15;
                    newUpper = -upperAngle-37;
                }else if(theta1>65){
                    newLower = 0;
                    newUpper = -upperAngle-44;
                }else{
                    newLower = 0;
                    newUpper = -upperAngle-15;
                }
              //  newLower = lowerAngle-60;
               // newUpper = -upperAngle;
                
            }else if(mouseClickLoc[0]<0&&mouseClickLoc[1]>0){
                if(theta1>120){
                    newLower = lowerAngle-65;
                    newUpper = upperAngle;
                }else{
                    newLower = 0;
                    newUpper = upperAngle+25;
                }
            }else if(mouseClickLoc[0]<0&&mouseClickLoc[1]<0){
                newLower = 50+(180-lowerAngle);
                if(theta1>132){
                    if(mouseClickLoc[0]>-0.3){
                        newUpper = 75+(upperAngle-90);
                    }else{
                       newUpper = 55+(upperAngle-90); 
                    }
                    
                }else if(theta1<117){
                    newUpper = 30+(upperAngle-90);
                }else{
                    newUpper = 35+(upperAngle-90);
                }
                
            }else if(mouseClickLoc[0]>0&&mouseClickLoc[1]<0){
                newLower = -210+90-lowerAngle;
                if(mouseClickLoc[0]>-0.3){
                    newUpper = -upperAngle+19;
                }else{
                    newUpper = -upperAngle+25;
                }
                
            }
            
            lowerDis = newLower;
            upperDis = newUpper;
            //initNodes(lowerArmId);
            
            //initNodes(upperArmId);
        }
        
    }
});


var baseDis;
var lowerArmDis;
var upperArmDis;

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    document.getElementById("slider1").onchange = function(event) {
        baseDis = event.target.value;
        baseRotate = true;
    };
    document.getElementById("slider2").onchange = function(event) {
        
        lowerArmDis =  event.target.value;
        lowerArmRotate = true;
        isIK = false;

    };
    document.getElementById("slider3").onchange = function(event) {
        upperArmDis =  event.target.value;
        upperArmRotate = true;
        isIK = false;
    };

    for(i=0; i<3; i++) {
        initNodes(i);
    }

    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------
function ball(){
    initBuffers(pointsArray,ball_color);

    var m = mat4()
    var t = translate(mouseClickLoc[0]*10, mouseClickLoc[1]*10, 0.0);
    m = mult(m, t);
    var s = scalem(0.4,0.4,0.4);
    m = mult(m, s);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(m) );
    for( var i=0; i<index; i+=3)
       gl.drawArrays( gl.TRIANGLES, i, 3 );
}


var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    initBuffers(points,colors);
    traverse(baseId);
  // console.log(ball_color);
    ball();
    if(baseRotate){
        if(theta[baseId]<baseDis){
                theta[baseId]+=0.5;
                initNodes(baseId);
            }
        if(theta[baseId]>baseDis){
                theta[baseId]-=0.5;
                initNodes(baseId);
            }        
    }
    if(lowerArmRotate){
        if(theta[lowerArmId]<lowerArmDis){
                theta[lowerArmId]+=0.5;
                initNodes(lowerArmId);
            }
        if(theta[lowerArmId]>lowerArmDis){
                theta[lowerArmId]-=0.5;
                initNodes(lowerArmId);
            }    
    }
    if(upperArmRotate){
        if(theta[upperArmId]<upperArmDis){
                theta[upperArmId]+=0.5;
                initNodes(upperArmId);
            }
        if(theta[upperArmId]>upperArmDis){
                theta[upperArmId]-=0.5;
                initNodes(upperArmId);
            }   
    }
    if(isIK){
        if(theta[lowerArmId]<lowerDis){
                theta[lowerArmId]+=0.5;
                initNodes(lowerArmId);
            }
        if(theta[lowerArmId]>lowerDis){
                theta[lowerArmId]-=0.5;
                initNodes(lowerArmId);
            }
    }
    if(isIK){
        if(theta[upperArmId]<upperDis){
            theta[upperArmId]+=0.5;
            initNodes(upperArmId);
        } 
        if(theta[upperArmId]>upperDis){
            theta[upperArmId]-=0.5;
            initNodes(upperArmId);
        }   
    }
    requestAnimFrame(render,colors);
}

function initBuffers(vertices,colors){
  // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
 //   gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
 //   gl.bufferData( gl.ARRAY_BUFFER, flatten(ball_color), gl.STATIC_DRAW );


    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    modelViewMatrix = mat4();
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );
   
}