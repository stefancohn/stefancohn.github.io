const skyboxVertices = [
  10.0, -10.0, -10.0,
  10.0, -10.0, 10.0,
  10.0, 10.0, 10.0,
  10.0, 10.0, 10.0,
  10.0, 10.0, -10.0,
  10.0, -10.0, -10.0,

  -10.0, -10.0, 10.0,
  -10.0, -10.0, -10.0,
  -10.0, 10.0, -10.0,
  -10.0, 10.0, -10.0,
  -10.0, 10.0, 10.0,
  -10.0, -10.0, 10.0,

  -10.0, 10.0, -10.0,
  10.0, 10.0, -10.0,
  10.0, 10.0, 10.0,
  10.0, 10.0, 10.0,
  -10.0, 10.0, 10.0,
  -10.0, 10.0, -10.0,

  -10.0, -10.0, -10.0,
  -10.0, -10.0, 10.0,
  10.0, -10.0, 10.0,
  10.0, -10.0, 10.0,
  10.0, -10.0, -10.0,
  -10.0, -10.0, -10.0,

  -10.0, -10.0, 10.0,
  10.0, -10.0, 10.0,
  10.0, 10.0, 10.0,
  10.0, 10.0, 10.0,
  -10.0, 10.0, 10.0,
  -10.0, -10.0, 10.0,

  10.0, -10.0, -10.0,
  -10.0, -10.0, -10.0,
  -10.0, 10.0, -10.0,
  -10.0, 10.0, -10.0,
  10.0, 10.0, -10.0,
  10.0, -10.0, -10.0
];

const skyboxUrls = [
  "skymap/px.png", 
  "skymap/nx.png", 
  "skymap/py.png", 
  "skymap/ny.png", 
  "skymap/pz.png", 
  "skymap/nz.png"  
];

async function parseMTL(text) {
  const materials = {};
  let currentMaterial = null;

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue;
    }

    const [directive, ...values] = trimmedLine.split(/\s+/);

    switch (directive) {
      case 'newmtl':
        const name = values[0];
        materials[name] = {
          //def to white
          kd: [1, 1, 1], 
        };
        currentMaterial = materials[name];
        break;

      //diff color
      case 'Kd':
        if (currentMaterial) {
          currentMaterial.kd = values.map(parseFloat);
        }
        break;
    }
  }

  return materials;
}

async function importDucky() {
    const resp = await fetch('ducky.obj');
    const text = await resp.text();

    let materials = {};
    let currentMaterial = null;

    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    
    // same order as `f` indices
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
    ];
    
    // same order as `f` indices
    let webglVertexData = [
        [],   // positions
        [],   // texcoords
        [],   // normals
        [],   // colors
    ];

    const defaultColor = [1.0, 1.0, 0.0, 1.0];

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
          if (!objIndexStr) {
              return;
          }
          const objIndex = parseInt(objIndexStr);
          const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
          webglVertexData[i].push(...objVertexData[i][index]);
        });

        //determine and add color for this vertex
        let colorToAdd = defaultColor; 
        if (currentMaterial && materials[currentMaterial] && materials[currentMaterial].kd) {
          const kd = materials[currentMaterial].kd;
            //ensure kd valid
          if (Array.isArray(kd) && kd.length === 3) {
            colorToAdd = [kd[0], kd[1], kd[2], 1.0]; 
          }
        }
        webglVertexData[3].push(...colorToAdd);
    }

    const keywords = {
      v(parts) {
        objPositions.push(parts.map(parseFloat));
      },
      vn(parts) {
        objNormals.push(parts.map(parseFloat));
      },
      vt(parts) {
        objTexcoords.push(parts.map(parseFloat));
      },
      f(parts) {
        const numTriangles = parts.length - 2;
        for (let tri = 0; tri < numTriangles; ++tri) {
          addVertex(parts[0]);
          addVertex(parts[tri + 1]);
          addVertex(parts[tri + 2]);
        }
      },
      mtllib: async function(parts) {
        const mtlResp = await fetch(parts[0]);
        const mtlText = await mtlResp.text();
        materials = await parseMTL(mtlText);
      },
      usemtl: function(parts) {
        currentMaterial = parts[0];
      }
    }

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
      const line = lines[lineNo].trim();
      if (line === '' || line.startsWith('#')) {
        continue;
      }
      const m = keywordRE.exec(line);
      if (!m) {
        continue;
      }

      const [, keyword, unparsedArgs] = m;
      const parts = line.split(/\s+/).slice(1);
      const handler = keywords[keyword];
      if (!handler) {
        //console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
        continue;
      }

      //mtllib parse
      if (keyword === 'mtllib') {
        const parts = line.split(/\s+/).slice(1);
        await keywords.mtllib(parts);
        continue;
      }

      handler(parts, unparsedArgs);
    }

    return {
        position: webglVertexData[0],
        texcoord: webglVertexData[1],
        normal: webglVertexData[2],
        colors: webglVertexData[3],
    };
}


async function importFloor() {
  var floorVertices = [
    vec3(-40.0, -1.5, -7.5),
    vec3(-40.0, -1.5,  7.5),
    vec3( 40.0, -1.5,  7.5),
    vec3( 40.0, -1.5, -7.5),
  ];

  var floorNormals = [];
  
  var floorColors = [];

  var floorPosition = [];
  floorPosition.push(floorVertices[0]);
  floorPosition.push(floorVertices[1]);
  floorPosition.push(floorVertices[2]);
  floorPosition.push(floorVertices[2]);
  floorPosition.push(floorVertices[3]);
  floorPosition.push(floorVertices[0]);

  floorColors.push(vec4(1,1,1,1.0));
  floorColors.push(vec4(1,1,1,1.0));
  floorColors.push(vec4(1,1,1,1.0));
  floorColors.push(vec4(1,1,1,1.0));
  floorColors.push(vec4(1,1,1,1.0));
  floorColors.push(vec4(1,1,1,1.0));

  for (var i = 0; i<floorPosition.length; i++) {
    floorNormals.push(vec3(0.0, 1.0, 0.0));
  }

  return {
    position: floorPosition,
    normal: floorNormals,
    colors: floorColors,
  }
}

function loadSkyboxTexture() {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  const targets = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];

  //placeholder
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(targets[i], 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
      new Uint8Array([0, 0, 255, 255]));
  }

    //load imgs
    let imagesLoaded = 0;
    for (let i = 0; i < 6; i++) {
      const image = new Image();

      image.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(targets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        imagesLoaded++;

        /*if (imagesLoaded === 6) {
          console.log("All skybox textures loaded");
        }*/
      };

      image.src = skyboxUrls[i];
    }
    return texture;
}

function initSkybox() {
  skyboxProgram = initShaders(gl, "skybox-vertex-shader", "skybox-fragment-shader");

  skybox_vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, skybox_vBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, flatten(skyboxVertices), gl.STATIC_DRAW);

  skyboxVPosition = gl.getAttribLocation(skyboxProgram, "vPosition");
  skyboxModelViewMatrixLoc = gl.getUniformLocation(skyboxProgram, "modelViewMatrix");
  skyboxProjectionMatrixLoc = gl.getUniformLocation(skyboxProgram, "projectionMatrix");

  skyboxTexture = loadSkyboxTexture();
}

function renderSkybox() {
  // Save current depth function and change it for skybox
  gl.depthFunc(gl.LEQUAL);
  
  gl.useProgram(skyboxProgram);
  
  gl.uniformMatrix4fv(skyboxProjectionMatrixLoc, false, flatten(projectionMatrix));
  
  // Create view matrix without translation for skybox
  const viewMatrix = lookAt(vec3(0, 0, 0), subtract(at, eye), up);
  gl.uniformMatrix4fv(skyboxModelViewMatrixLoc, false, flatten(viewMatrix));
  
  // Bind skybox texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  gl.uniform1i(gl.getUniformLocation(skyboxProgram, "skybox"), 0);
  
  // Bind vertex buffer and set attribute pointers
  gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vBuffer);
  gl.vertexAttribPointer(skyboxVPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(skyboxVPosition);
  
  // Draw skybox
  gl.drawArrays(gl.TRIANGLES, 0, skyboxVertices.length / 3);
  
  // Restore depth function
  gl.depthFunc(gl.LESS);
  
  // Switch back to main program
  gl.useProgram(program);
}

var accel = 0;
function fallCheck(controller) {
  if (controller.falling) {
    controller.offsetY(-0.1 + accel);
    accel -= 0.1;
  }

  //Z check
  else if (controller.getZOffset() > 8.25) {
    controller.falling = true;
  }

  else if (controller.getZOffset() < -7.2) {
    controller.falling = true;
  }

  //Y check
  else if (controller.getXOffset() < -39.75) {
    controller.falling = true;
  }

  else if (controller.getXOffset() > 39.75) {
    controller.falling = true
  }

  //for respawn animation
  if (!controller.falling && controller.getYOffset() > 0) {
    controller.offsetY(-1);
  }
}

function respawnCheck(controller){
  if (controller.getYOffset() < -90) {
    accel = 0;
    controller.respawn();
  }
}