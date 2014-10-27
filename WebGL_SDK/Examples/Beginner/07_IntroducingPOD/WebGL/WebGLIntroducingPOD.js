function WebGLIntroducingPOD()
{
	var mdl;
    var print3D;
	var meshBuffers = null;
	var textures    = null;
	var shaders     = {};
	var program     = null;
	var loadStatus  = {};
	var prevTime    = 0;
	var frame       = 0.0;
	var demoFPS     = 1.0 / 30.0;

	var handleTextureLoaded = function(gl, textureID, header, metaData, index)
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);

		textures[index] = textureID;
		loadStatus["texture"+index] = 1;
	}

	var loadTextures = function(gl)
	{
        gl.getError();

		textures = new Array(mdl.data.numTextures);

		for(var i = 0; i < mdl.data.numMaterials; i++)
		{
			(function(index)
			{
				var material = mdl.data.materials[index];
				if(material.data.diffuseTextureIndex != -1)
				{
					var material = mdl.data.materials[i];
					var texName = mdl.data.textures[material.data.diffuseTextureIndex].data.name;
					PVRTexture.loadFromURI(gl, texName, 0,
                        function(gl, textureID, header, metaData)
                        { handleTextureLoaded(gl, textureID, header, metaData, index); });
				}
			})(i);
		}
	}

	var loadPOD = function(stream, gl)
	{
		mdl            = new PVRModel();
		var podLoader  = new PVRPODLoader();
		var result     = podLoader.load(stream, mdl);
		if(result != EPODErrorCodes.eNoError)
		{
			alert("Failed to load POD: " + result);
			return;
		}

		if(mdl.data.numCameras == 0)
		{
			alert("This demo requires the POD file to contain at least one camera.");
			return;
		}

		meshBuffers = new Array(mdl.data.numMeshes);

		for(var i = 0; i < mdl.data.numMeshes; i++)
		{
			var mesh = mdl.data.meshes[i];
			var meshBuffer = {
				VBOs: new Array(),
				IBO:  null,
			};

			// Vertex data
			for(var e = 0; e < mesh.data.vertexElementData.length; e++)
			{
				// Gen a VBO
				var vbo = gl.createBuffer();

				// Bind
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

				// Set the buffer's data
				gl.bufferData(gl.ARRAY_BUFFER, mesh.data.vertexElementData[e], gl.STATIC_DRAW);

				// Add to the list
				meshBuffer.VBOs.push(vbo);
			}

			// Face data
			if(mesh.data.faces.data.length > 0)
			{
				var ibo = gl.createBuffer();

				// Bind
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

				// Set the buffer's data
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.data.faces.data, gl.STATIC_DRAW);

				// Add to the list
				meshBuffer.IBO = ibo;
			}

			meshBuffers[i] = meshBuffer;
		}

		// Unbind
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// Set the load status object up for textures
		for(var i = 0; i < mdl.data.numTextures; i++)
		{
			loadStatus["texture"+i] = 0;
		}

		// Load textures
		loadTextures(gl);

		// Set POD load status
		loadStatus.pod = 1;
	}

	var loadShaders = function(gl)
	{
		shaders.vs = PVRShader.loadFromURI(gl, "VertShader.vsh", gl.VERTEX_SHADER, [], function(e){ alert(e); });
		if(!shaders.vs)
			return false;

		shaders.fs = PVRShader.loadFromURI(gl, "FragShader.fsh", gl.FRAGMENT_SHADER, [], function(e){ alert(e); });
		if(!shaders.fs)
			return false;

		// Create the program
		var attribs = ["inVertex", "inNormal", "inTexCoord"];
		program = PVRShader.createProgram(gl, shaders.vs, shaders.fs, attribs, function(e) { alert(e); });
		if(!program)
			return false;

		return true;
	}

	this.initView = function(gl)
	{
		loadStatus.pod = 0;

		// Load the shaders
		if(!loadShaders(gl))
			return false;

		// Load the POD file
		var fs = new PVRFileStream();
		fs.Open("Scene.pod", true, loadPOD, gl);

        // Initialise Print3D
        print3D = new PVRPrint3D();
        print3D.setTextures(gl, PVRShell.data.width, PVRShell.data.height);

		// Sets the clear colour
		gl.clearColor(0.6, 0.8, 1.0, 1.0);

		// Setup states
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.disable(gl.BLEND);

		// Initialise the time
		prevTime = PVRShell.getTimeNow();

		return true;
	}

	this.renderScene = function(gl)
	{
		/*
			Clear the colour buffer
			gl.clear can also be used to clear the depth or stencil buffer
			(gl.DEPTH_BUFFER_BIT or gl.SENCIL_BUFFER_BIT)
		*/
		gl.clear(gl.COLOR_BUFFER_BIT);

		// Check the loadStatus object to see if everything is complete
		var loaded = 1;
		for(var key in loadStatus)
			loaded &= loadStatus[key];

		if(loaded)
		{
			var time  = PVRShell.getTimeNow();
			var delta = time - prevTime;
			prevTime  = time;
			frame    += delta * demoFPS;

			if(frame > mdl.data.numFrames - 1)
				frame = 0;

			mdl.setCurrentFrame(frame);

			/*
				Setup the camera. This is loaded from the POD model.
			*/
			var props  = mdl.getCameraProperties(0);   // Camera 0
			var aspect = PVRShell.data.width / PVRShell.data.height;
			var mView  = PVRMatrix4x4.createLookAt(props.from, props.to, props.up);
			var mProj  = PVRMatrix4x4.createPerspectiveProjection(4, 5000, props.fov, aspect);

			/*
				Setup lights.
			*/
			var lightDir = mdl.getLightDirection(0);  // Light 0

			// Get shader uniform locations
			var mvpLoc      = gl.getUniformLocation(program, "MVPMatrix");
			var lightDirLoc = gl.getUniformLocation(program, "LightDirection");

			// Render
			for(var i = 0; i < mdl.data.numMeshNodes; i++)
			{
				// Setup MVP matrix
				var mWorld = mdl.getWorldMatrix(i);
				var mMVP   = PVRMatrix4x4.matrixMultiply(PVRMatrix4x4.matrixMultiply(mProj, mView), mWorld);
				gl.uniformMatrix4fv(mvpLoc, gl.FALSE, mMVP.data);

				// Pass the light direction in model space to the shader
				var vLightDirModel = PVRMatrix4x4.vectorMultiply(PVRMatrix4x4.inverse(mWorld), lightDir);
				gl.uniform3f(lightDirLoc, vLightDirModel.data[0],
										  vLightDirModel.data[1],
										  vLightDirModel.data[2]);

				// Get node
				var node = mdl.data.nodes[i];

				// Setup texture
				var materialIndex = node.data.materialIndex;
				if(materialIndex == -1)
				{
					gl.bindTexture(gl.TEXTURE_2D, null);
				}
				else
				{
					gl.bindTexture(gl.TEXTURE_2D, textures[materialIndex]);
				}

				// Draw
				drawMesh(node.data.index, gl);
			}
		}

        print3D.displayDefaultTitle("IntroducingPOD", null, EPVRPrint3D.Logo.PowerVR);
        print3D.flush(gl);

		return true;
	}

	var drawMesh = function(meshIndex, gl)
	{
		var mesh = mdl.data.meshes[meshIndex];

		// Bind IBO
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshBuffers[meshIndex].IBO);

		// Bind VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffers[meshIndex].VBOs[0]);

		// Setup pointers
		var positions = mesh.data.vertexElements["POSITION0"];
		if(positions != undefined)
		{
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, positions.numComponents, gl.FLOAT, gl.FALSE, positions.stride, positions.offset);
		}

		var normals = mesh.data.vertexElements["NORMAL0"];
		if(normals != undefined)
		{
			gl.enableVertexAttribArray(1);
			gl.vertexAttribPointer(1, normals.numComponents, gl.FLOAT, gl.FALSE, normals.stride, normals.offset);
		}

		var uvs = mesh.data.vertexElements["UV0"];
		if(uvs != undefined)
		{
			gl.enableVertexAttribArray(2);
			gl.vertexAttribPointer(2, uvs.numComponents, gl.FLOAT, gl.FALSE, uvs.stride, uvs.offset);
		}

		switch (mesh.data.primitiveData.primitiveType)
		{
			case EPVRMesh.eIndexedTriangleList:
				gl.drawElements(gl.TRIANGLES, mesh.data.faces.data.length, gl.UNSIGNED_SHORT, 0);
				break;
			default:
				throw "Unhandled primitive type";
		}

		// Unbind
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ARRAY_BUFFER,         null);
		gl.disableVertexAttribArray(0);
		gl.disableVertexAttribArray(1);
		gl.disableVertexAttribArray(2);
	}
}
