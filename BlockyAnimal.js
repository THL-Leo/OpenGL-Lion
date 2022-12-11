// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
"attribute vec4 a_Position;" +
"uniform mat4 u_ModelMatrix;" + 
"uniform mat4 u_GlobalRotateMatrix;" + 
"void main() {" +
"  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;" +
"}";

// Fragment shader program
var FSHADER_SOURCE =
"precision mediump float;" +
"uniform vec4 u_FragColor;" +
"void main() {\n" +
"  gl_FragColor = u_FragColor;" +
"}";

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setUpWebGL() {
    canvas = document.getElementById("webgl");
    
    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to intialize shaders.");
        return;
    }
    
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return;
    }
    
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix");
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");
    if (!u_GlobalRotateMatrix) {
        console.log("Failed to get the storage location of u_GlobalRotateMatrix");
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1,1,1,1]
let g_selectedSize = 5
let g_segments = 10;
let g_globalAngle = 0;
let g_angleY = 0;
let g_wingAngle = 0;
let g_leftForeAngle = 0;
let g_animation = false;
let g_leftAngle = 0;
let g_rightAngle = 0;
let g_right2Angle = 0;
let g_tailAngle = 0;
let g_fLeft = 0
let g_fRight = 0
let col = 1;
let x;
let y;

function addActionsForHtmlUI() {

    document.getElementById('animationWingOnButton').onclick = function() {g_animation = true;};
    document.getElementById('animationWingOffButton').onclick = function() {g_animation = false;};

    document.getElementById('leftFrontSlide').addEventListener('mousemove', function() {g_fLeft = this.value; renderAllShapes();})
    document.getElementById('rightFrontSlide').addEventListener('mousemove', function() {g_fRight = this.value; renderAllShapes();})

    document.getElementById('tailSlide').addEventListener('mousemove', function() { g_tailAngle = this.value; renderAllShapes(); })

    document.getElementById('wingSlide').addEventListener('mousemove', function() { g_wingAngle = this.value; renderAllShapes(); })

    document.getElementById('leftForeSlide').addEventListener('mousemove', function() { g_leftForeAngle = this.value; renderAllShapes(); })
    document.getElementById('leftSlide').addEventListener('mousemove', function() { g_leftAngle = this.value; renderAllShapes(); })

    document.getElementById('rightSlide').addEventListener('mousemove', function() { g_rightAngle = this.value; renderAllShapes(); })
    document.getElementById('right2Slide').addEventListener('mousemove', function() { g_right2Angle = this.value; renderAllShapes(); })

    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); })
    document.getElementById('angleYSlide').addEventListener('mousemove', function() { g_angleY = this.value; renderAllShapes(); })


    document.getElementById('webgl').addEventListener('click', function(e){
        if(e.shiftKey){
            changeColor();
            renderAllShapes();
        }
    })
    

}


function main() {
    // set up canvas and gl variables
    setUpWebGL();

    connectVariablesToGLSL();
    addActionsForHtmlUI();
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev)}};
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    
    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000;
var g_seconds = performance.now()/1000 - g_startTime;

function tick(){
    g_seconds = performance.now()/1000 - g_startTime;
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function changeColor(){
    g_seconds = performance.now()/1000 - g_startTime;
    if(col > 0){
        col -= 0.05;
    } else {
        col = 1;
    }
}

function updateAnimationAngles(){
    if (g_animation){
        g_wingAngle = (100*Math.sin(g_seconds));
        document.getElementById("wingSlide").value = g_wingAngle;
        g_leftForeAngle = (45*Math.sin(3*g_seconds));
        document.getElementById("leftForeSlide").value = g_leftForeAngle
        g_leftAngle = (35*Math.sin(g_seconds));
        document.getElementById("leftSlide").value = g_leftAngle
        g_rightAngle = (35*Math.sin(3*g_seconds));
        document.getElementById("rightSlide").value = g_rightAngle
        g_right2Angle = (45*Math.sin(3*g_seconds));
        document.getElementById("right2Slide").value = g_right2Angle
        g_tailAngle = (45*Math.sin(3*g_seconds));
        document.getElementById("tailSlide").value = g_tailAngle;
        g_fLeft = (45*Math.sin(3*g_seconds));
        document.getElementById("leftFrontSlide").value = g_fLeft;
        g_fRight = (45*Math.sin(3*g_seconds));
        document.getElementById("rightFrontSlide").value = g_fRight;
    }
}

function renderAllShapes() {
    var startTime = performance.now();

    var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
    globalRotMat.rotate(g_angleY,1,0,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    

    gl.clear(gl.COLOR_BUFFER_BIT);   
    gl.clear(gl.DEPTH_BUFFER_BIT);

    var body = new Cube();
    body.color = [0.71, 0.4, 0.11,col];
    body.translate(-.4,-.75,0.0);
    body.scale(0.3,.3,.5);
    body.translate(0,2,0);
    let bodyMat = new Matrix4(body.matrix);
    body.render();

    var tail = new Cube();
    tail.matrix = bodyMat;
    tail.color = [0.71, 0.4, 0.11,col];
    tail.scale(0.3,0.3,0.3);
    tail.translate(1,2,2.9);
    tail.rotate(0.5*g_tailAngle,0,1,0)
    let tipMat = new Matrix4(tail.matrix);
    tail.render();

    // Third joint? Body -> tail -> end of the tail -> tip of the tail
    var tip = new Prism();
    tip.matrix = tipMat;
    tip.color = [0.71, 0.4, 0.11,col];
    tip.translate(-0.3,0,1)
    tip.scale(1.5,1.5,1.5)
    let tip2Mat = new Matrix4(tip.matrix)
    tip.render();

    var tip2 = new Prism();
    tip2.matrix = tip2Mat;
    tip2.color = [0.92, 0.64, 0.5,col];
    tip2.scale(0.5,0.5,0.5)
    tip2.translate(0.5,0.5,1)
    tip2.render()

    let temp = new Matrix4(body.matrix);
    let temp2 = new Matrix4(body.matrix);
    var head = drawCube(temp, [1,1,1,1]);
    head.color = [0.58, 0.29, 0.0, col];
    head.scale(1.5,1.5,0.2)
    head.translate(-.2,-.2,-0.5)
    let faceMat = new Matrix4(head.matrix);
    head.render();

    var face = new Cube();
    face.matrix = faceMat;
    face.color = [0.71, 0.4, 0.11,col];
    face.scale(0.5,0.5,2)
    face.translate(0.5,0.5,-1)
    let eyeMat = new Matrix4(face.matrix)
    face.render();

    var eye1 = drawCube(eyeMat, [0,0,0,1])
    eye1.translate(0,0.5,-0.001)
    eye1.scale(0.3,0.3,0)
    eye1.render();

    var eye2 = drawCube(eyeMat, [0,0,0,1])
    eye2.translate(2.45,0,0)
    eye2.scale(1,1,1)
    eye2.render();

    var rightWing = drawCube(temp2, [1,1,1,1]);
    rightWing.color = [0.97, 0.83, 0.67, col];
    rightWing.scale(1,0.1,0.5)
    rightWing.translate(0.5, 4  + (g_wingAngle)/200,0.7)
    rightWing.render()

    let rightWingMat = new Matrix4(rightWing.matrix);
    var leftWing = drawCube(rightWingMat, [1,1,1,1]);
    leftWing.color = [0.97, 0.83, 0.67, col];
    leftWing.translate(-1,0,0);
    leftWing.render()

    var leftFoot = new Cube();
    leftFoot.color = [0.97, 0.83, 0.67, col];
    leftFoot.scale(0.11,0.3,0.11);
    leftFoot.translate(-2.1,-1, 3.3)
    leftFoot.rotate(-0.1*g_leftForeAngle,1,0,0)
    let lFootMat = new Matrix4(leftFoot.matrix);
    leftFoot.render();

    var leftFFoot = new Cube();
    leftFFoot.color = [0.97, 0.83, 0.67, col];
    leftFFoot.matrix = lFootMat;
    leftFFoot.scale(0.8,0.5,0.8)
    leftFFoot.translate(0.1,-0.3,0.2)
    leftFFoot.rotate(-0.1*g_leftAngle,1,0,0)
    leftFFoot.render()

    var rightFoot = new Cube();
    rightFoot.color = [0.97, 0.83, 0.67, col];
    rightFoot.scale(0.11,0.3,0.11);
    rightFoot.translate(-3.4,-1, 3.3)
    rightFoot.rotate(-0.1*g_rightAngle,1,0,0)
    let rFootMat = new Matrix4(rightFoot.matrix);
    rightFoot.render();

    var rightFFoot = new Cube();
    rightFFoot.color = [0.97, 0.83, 0.67, col];
    rightFFoot.matrix = rFootMat;
    rightFFoot.scale(0.8,0.5,0.8)
    rightFFoot.translate(0.1,-0.3,0.2)
    rightFFoot.rotate(-0.1*g_right2Angle,1,0,0)
    rightFFoot.render()

    var leftFront = new Cube();
    leftFront.color = [0.97, 0.83, 0.67, col];
    leftFront.scale(0.11,0.35,0.11);
    leftFront.translate(-2.1,-1, 1.3);
    leftFront.rotate(180,1,0,0)
    leftFront.scale(1,1.3,1)
    leftFront.translate(0,-0.7,-1);
    leftFront.scale(1,0.7,1)
    leftFront.rotate(0.3*g_fLeft,1,0,0)
    leftFront.render();

    var rightFront = new Cube();
    rightFront.color = [0.97, 0.83, 0.67, col];
    rightFront.scale(0.11,0.35,0.11);
    rightFront.translate(-2.1,-1, 1.3);
    rightFront.rotate(180,1,0,0)
    rightFront.scale(1,1.3,1)
    rightFront.translate(0,-0.7,-1);
    rightFront.scale(1,0.7,1);
    rightFront.translate(-1.3,0,0)
    rightFront.rotate(0.3*g_fRight,1,0,0)
    rightFront.render();

    var duration = performance.now() - startTime;
    sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if( !htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function drawCube(mat, C){
    let cube = new Cube();
    cube.color = C;
    cube.matrix = mat;
    return cube;
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
    return [x, y];
}

function click(ev) {
    // Store the coordinates to g_points array
    [x, y] = convertCoordinatesEventToGL(ev);
    
    renderAllShapes()
    // Clear <canvas>
    
}