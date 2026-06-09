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
    vec3(-50.0, -1.5, -15.0),
    vec3(-50.0, -1.5,  15.0),
    vec3( 50.0, -1.5,  15.0),
    vec3( 50.0, -1.5, -15.0),
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

function generateSphere(radius, slices, stacks) {
  var positions = [];
  var normals = [];
  var colors = [];
  var gold = vec4(1.0, 0.84, 0.0, 1.0);
  var goldHighlight = vec4(1.0, 0.95, 0.5, 1.0);

  for (var i = 0; i < stacks; i++) {
    var lat0 = Math.PI * (-0.5 + i / stacks);
    var lat1 = Math.PI * (-0.5 + (i + 1) / stacks);
    var cosLat0 = Math.cos(lat0);
    var sinLat0 = Math.sin(lat0);
    var cosLat1 = Math.cos(lat1);
    var sinLat1 = Math.sin(lat1);

    for (var j = 0; j < slices; j++) {
      var lng0 = 2 * Math.PI * (j / slices);
      var lng1 = 2 * Math.PI * ((j + 1) / slices);
      var cosLng0 = Math.cos(lng0);
      var sinLng0 = Math.sin(lng0);
      var cosLng1 = Math.cos(lng1);
      var sinLng1 = Math.sin(lng1);

      var v0 = vec3(radius * cosLat0 * cosLng0, radius * sinLat0, radius * cosLat0 * sinLng0);
      var v1 = vec3(radius * cosLat1 * cosLng0, radius * sinLat1, radius * cosLat1 * sinLng0);
      var v2 = vec3(radius * cosLat1 * cosLng1, radius * sinLat1, radius * cosLat1 * sinLng1);
      var v3 = vec3(radius * cosLat0 * cosLng1, radius * sinLat0, radius * cosLat0 * sinLng1);

      var n0 = normalize(vec3(v0));
      var n1 = normalize(vec3(v1));
      var n2 = normalize(vec3(v2));
      var n3 = normalize(vec3(v3));

      var c = (i + j) % 2 === 0 ? gold : goldHighlight;

      positions.push(v0, v1, v3);
      normals.push(n0, n1, n3);
      colors.push(c, c, c);

      positions.push(v1, v2, v3);
      normals.push(n1, n2, n3);
      colors.push(c, c, c);
    }
  }

  return {
    position: positions,
    normal: normals,
    colors: colors
  };
}

var duckScale = 1.0;
var collectedCount = 0;

var balls = [
  { x: -15, y: -1.0, z: -5, collected: false },
  { x: -5, y: -1.0, z: 10, collected: false },
  { x: 10, y: -1.0, z: -8, collected: false },
  { x: 20, y: -1.0, z: 5, collected: false },
  { x: -25, y: -1.0, z: 8, collected: false },
  { x: 0, y: -1.0, z: 0, collected: false },
  { x: 30, y: -1.0, z: -10, collected: false },
  { x: -35, y: -1.0, z: -3, collected: false },
  { x: 15, y: -1.0, z: 12, collected: false },
  { x: -10, y: -1.0, z: -12, collected: false },
];

var accel = 0;
function fallCheck(controller) {
  if (controller.falling) {
    controller.offsetY(-0.1 + accel);
    accel -= 0.1;
  }

  //Z check
  else if (controller.getZOffset() > 14.5) {
    controller.falling = true;
  }

  else if (controller.getZOffset() < -14.5) {
    controller.falling = true;
  }

  //X check
  else if (controller.getXOffset() < -49.75) {
    controller.falling = true;
  }

  else if (controller.getXOffset() > 49.75) {
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