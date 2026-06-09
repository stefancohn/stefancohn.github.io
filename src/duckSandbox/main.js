var canvas;
var gl;
var program;

// duck buffers
var cBuffer, nBuffer, vBuffer; 
//floor bufers
var floor_cBuffer, floor_nBuffer, floor_vBuffer; 
//skybox buffers
var skybox_vBuffer; 
//ball buffers
var ball_vBuffer, ball_nBuffer, ball_cBuffer; 
var sphereData;
var ballPositionCount;

var vColor, vNormal, vPosition, skyboxVPosition; 

//light pos, ads
var lightPosition = vec4(0.0, 20.0, 30.0, 1.0 );
var lightAmbient = vec4(1, 0.6, 0.6, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

//mats
var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 0.801150, 0.787901, 0.026370, 1.0);
var materialSpecular = vec4( 0.5, 0.5, 0.5, 1.0 );
var materialShininess = 250.0;

var floorMaterialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var floorMaterialDiffuse = vec4(0.8, 0.7, 0.5, 1.0);
var floorMaterialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var floorMaterialShininess = 50.0;

//light color
var modelView, projection;

// camera 
var eye = vec3(20.0, 10.0, 20.0); //camera position
var at = vec3(0.0, 0.0, 0.0);  
var up = vec3(0.0, 1.0, 0.0);  

//camera perspective
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var near = 0.1;
var far = 100.0;
var  fovy = 45.0; 
var  aspect = 1.0; 

var skyboxProgram;
var skyboxTexture;
var skyboxModelViewMatrixLoc;
var skyboxProjectionMatrixLoc;

function getNormal(p1, p2, p3) {
    var t1 = subtract(p2, p1);
    var t2 = subtract(p3, p2);
    var normal = cross(t1,t2);
    return(vec3(normal))
}

var duckData;
var floorData;

window.onload = async function init() {   
    duckData = await importDucky();
    floorData = await importFloor();

    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    // shader init
    program = initShaders(gl, "vertex-shader", "fragment-shader",);
    gl.useProgram(program);

    // get attribute locs
    vColor = gl.getAttribLocation(program, "vColor");
    vNormal = gl.getAttribLocation(program, "vNormal");
    vPosition = gl.getAttribLocation(program, "vPosition");

    //view port, canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // Load the data into the GPU

    // --- DUCK BUFFERS ---
    //color buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(duckData.colors), gl.STATIC_DRAW );

    //normals buffer
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(duckData.normal), gl.STATIC_DRAW );

    //vertices 
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(duckData.position), gl.STATIC_DRAW );

    // --- FLOOR BUFFERS ---
    //floor color buffer
    floor_cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, floor_cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(floorData.colors), gl.STATIC_DRAW );

    //floor normals buffer
    floor_nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, floor_nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(floorData.normal), gl.STATIC_DRAW );

    //floor vertices buffer
    floor_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, floor_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(floorData.position), gl.STATIC_DRAW );

    // --- BALL BUFFERS ---
    sphereData = generateSphere(0.5, 16, 12);
    ballPositionCount = sphereData.position.length;

    ball_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ball_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereData.position), gl.STATIC_DRAW );

    ball_nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ball_nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereData.normal), gl.STATIC_DRAW );

    ball_cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ball_cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereData.colors), gl.STATIC_DRAW );

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
        flatten(specularProduct) );

    lightPosLoc = gl.getUniformLocation(program, "lightPosition");
    gl.uniform4fv(lightPosLoc, flatten(lightPosition));

    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"),materialShininess);
     
    //loc for modelViewMatrix and projmatrix and for skybox
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    //placed here for proper sync of shader program
    initSkybox();
    
    render();
};

var fps = 1000/60; 
var dt = 0;
var lastTime = performance.now(); 

var render = function(){
    //set up a dt so that our duck movements are controlled and tied to central render loop
    //TODO: I FAILED AT THIS, MIGHT IMPLEMENT LATER
    /*
    var currentTime = performance.now();
    console.log((currentTime-lastTime)/fps);
    dt += (currentTime-lastTime)/fps; 
    lastTime = currentTime;

    while(dt < 1) {
    }
    dt--;
    */

    controller.update();
    fallCheck(controller);
    respawnCheck(controller);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //animate light position
    var time = performance.now() / 1000;
    lightPosition[0] = 20.0 * Math.cos(time * 0.15);
    lightPosition[2] = 30.0 * Math.sin(time * 0.15);
    gl.uniform4fv(lightPosLoc, flatten(lightPosition));

    //transformation matrix with controller offsets and duck scale
    var tlateMatrix = translate(controller.getXOffset(), controller.getYOffset(), controller.getZOffset());
    var rMatrix = rotate(controller.getRotation(), 0, 1, 0);
    var sMatrix = scalem(duckScale, duckScale, duckScale);
    var liftMatrix = translate(0, (duckScale - 1.0) * 0.7, 0);
    var tformMatrix = mult(tlateMatrix, mult(rMatrix, mult(liftMatrix, sMatrix)));

    at[0]=controller.getXOffset();
    at[1]=controller.getYOffset();
    at[2]=controller.getZOffset();

    //get view and projection, send to shader
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    renderSkybox();

    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );


    //draw duck
    if (duckData != undefined) {

        //apply to modelMatrix
        var duckModelViewMatrix = mult(modelViewMatrix, tformMatrix); 

        gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(duckModelViewMatrix) );

        //bind buffers to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

        gl.drawArrays( gl.TRIANGLES, 0, duckData.position.length / 3); 
    }

    // draw floor
    if (floorData != undefined) { 
        //floor mats
        var floorAmbientProduct = mult(lightAmbient, floorMaterialAmbient);
        var floorDiffuseProduct = mult(lightDiffuse, floorMaterialDiffuse);
        var floorSpecularProduct = mult(lightSpecular, floorMaterialSpecular);
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(floorAmbientProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(floorDiffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(floorSpecularProduct));
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), floorMaterialShininess);

        gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
        //bind buffers to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, floor_vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, floor_nBuffer);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, floor_cBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
        
        gl.drawArrays(gl.TRIANGLES, 0, floorData.position.length); 
    }

    // draw balls
    if (sphereData != undefined) {
        for (var i = 0; i < balls.length; i++) {
            if (balls[i].collected) continue;

            var bobY = Math.sin(time * 2.0 + i * 1.5) * 0.4;

            var dx = balls[i].x - controller.getXOffset();
            var dz = balls[i].z - controller.getZOffset();
            var dy = (balls[i].y + bobY) - controller.getYOffset();
            var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 0.8 * duckScale + 0.5) {
                balls[i].collected = true;
                duckScale += 0.5;
                collectedCount++;
                var sizeDisplay = document.getElementById('sizeDisplay');
                if (sizeDisplay) sizeDisplay.textContent = 'Size: ' + duckScale.toFixed(1) + 'x  |  Balls: ' + collectedCount;
                continue;
            }

            var ballM = mult(translate(balls[i].x, balls[i].y + bobY, balls[i].z), rotate(time * 60, 0, 1, 0));
            var ballMV = mult(modelViewMatrix, ballM);
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(ballMV));

            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
            gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(vec4(1.0, 1.0, 1.0, 1.0)));
            gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100.0);

            gl.bindBuffer(gl.ARRAY_BUFFER, ball_vBuffer);
            gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            gl.bindBuffer(gl.ARRAY_BUFFER, ball_nBuffer);
            gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vNormal);

            gl.bindBuffer(gl.ARRAY_BUFFER, ball_cBuffer);
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);

            gl.drawArrays(gl.TRIANGLES, 0, ballPositionCount / 3);
        }
    }

    requestAnimationFrame(render);
}