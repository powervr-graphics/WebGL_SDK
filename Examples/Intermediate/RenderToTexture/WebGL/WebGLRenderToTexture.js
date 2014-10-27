function WebGLRenderToTexture()
{
    // Source and binary shaders
    var c_szFragShaderSrcFile = "FragShader.fsh";
    var c_szVertShaderSrcFile = "VertShader.vsh";

    // Scene
    /*
       The .pod file was exported from 3DSMax using PVRGeoPOD.
       */
    var c_szSceneFile = "RenderToTexture.pod";
    var c_szMaskTex   = "YellowWood.pvr";

    // Camera constants. Used for making the projection matrix
    var g_fCameraNear = 4.0;
    var g_fCameraFar  = 500.0;

    var g_pszDesc =
    [
        "Using FBOs",						// eMultisampleExtension_None
        "Using multisampled FBOs [IMG]",	// eMultisampleExtension_IMG
        "Using multisampled FBOs [EXT]",	// eMultisampleExtension_EXT
    ];

    // Vertex attributes
    var EVertexAttrib =
    {
        eVERTEX_ARRAY   : 0,
        eNORMAL_ARRAY   : 1,
        eTEXCOORD_ARRAY : 2,
        eNumAttribs     : 3
    };

    var g_aszAttribNames =
    [
        "inVertex",
        "inNormal",
        "inTexCoord"
    ];

    // Shader uniforms
    var EUniform =
    {
        eMVPMatrix : 0,
        eLightDirection : 1,
        eNumUniforms : 2
    };

    var g_aszUniformNames =
    [
        "MVPMatrix",
        "LightDirection"
    ];


    var EMultisampleExtension =
    {
        eMultisampleExtension_None : 0,
        eMultisampleExtension_IMG  : 1,
        eMultisampleExtension_EXT  : 2
    };

    /*!****************************************************************************
      @Function		loadPOD
      @Description  Asyncronously loads a POD file.
     ******************************************************************************/
    var loadPOD = function(stream, demo)
    {
		demo.Scene     = new PVRModel();
		var podLoader  = new PVRPODLoader();
		var result     = podLoader.load(stream, demo.Scene);
		if(result != EPODErrorCodes.eNoError)
		{
			alert("Failed to load POD: " + result);
		}

        demo.PODLoaded = 1;
    }

    /*!****************************************************************************
      @Function		initApplication
      @Description	Code in InitApplication() will be called by PVRShell once per
      run, before the rendering context is created.
      Used to initialize variables that are not dependant on it
      (e.g. external modules, loading meshes, etc.)
      If the rendering context is lost, InitApplication() will
      not be called again.
     ******************************************************************************/
    this.initApplication = function()
    {
        this.fAngleY   = 0.0;
        this.PODLoaded = 0;

		// Load the POD file
		var fs = new PVRFileStream();
		fs.Open(c_szSceneFile, true, loadPOD, this);
    }

    /*!****************************************************************************
      @Function		initialiseView
      @Description	Code in InitView() will be called by PVRShell upon
      initialization or after a change in the rendering context.
      Used to initialize variables that are dependant on the rendering
      context (e.g. textures, vertex buffers, etc.)
     ******************************************************************************/
    this.initialiseView = function(gl)
    {
        var errorStr = { value: "" };
        /*
           Initialise Print3D
           */

        this.print3D = new PVRPrint3D();
        if(this.print3D.setTextures(gl, PVRShell.data.width, PVRShell.data.height))
        {
            alert("ERROR: Cannot initialise Print3D");
            return false;
        }

        //	Initialize VBO data
        if(!this.loadVbos(gl, errorStr))
        {
            alert(errorStr.value);
            return false;
        }

        /*
           Load textures
           */
        if(!this.loadTextures(gl, errorStr))
        {
            alert(errorStr.value);
            return false;
        }

        /*
           Load and compile the shaders & link programs
           */
        if (!this.loadShaders(gl, errorStr))
        {
            alert(errorStr.value);
            return false;
        }

        // Create normal FBO
        if(!this.createFBO(gl))
            return false;

        // Create a multisampled FBO if the required extension is supported
        this.Extensions = {};
        this.eMultisampleMode       = EMultisampleExtension.eMultisampleExtension_None;
        this.bDiscard               = false;
        this.bUseMultisampled       = false;
        this.bMultisampledSupported = false;

        var extensions = gl.getSupportedExtensions();
        if( extensions.indexOf("EXT_multisampled_render_to_texture") >= 0 ||
            extensions.indexOf("IMG_multisampled_render_to_texture") >= 0)
        {
            this.bUseMultisampled = this.bMultisampledSupported = this.createMultisampledFBO(gl);
        }
        if(extensions.indexOf("EXT_discard_framebuffer") >= 0)
        {
            this.bDiscard = true;
            this.Extensions.discardFramebufferEXT = gl.getExtension("EXT_discard_framebuffer");
        }

        // Setup some render states
        // Enable the depth test
        gl.enable(gl.DEPTH_TEST);

        // Enable culling
        gl.enable(gl.CULL_FACE);

        // Setup view and projection matrices used for when rendering to the texture

        // Calculate the view matrix
        this.mR2TView = PVRMatrix4x4.createLookAt(new PVRVector3(0, 0, 60), new PVRVector3(0, 0, 0), new PVRVector3(0, 1, 0));

        // Calculate the projection matrix
        // Note: As we'll be rendering to a texture we don't need to take the screen rotation into account
        this.mR2TProjection = PVRMatrix4x4.createPerspectiveProjection(g_fCameraNear, g_fCameraFar, 1.0, 1.0);

        // Setup view and projection matrices used for when rendering the main scene

        // Caculate the view matrix
        this.mView = PVRMatrix4x4.createLookAt(new PVRVector3(0, 0, 125), new PVRVector3(0, 0, 0), new PVRVector3(0, 1, 0));

        // Calculate the projection matrix
        var aspectRatio = PVRShell.data.width / PVRShell.data.height;
        this.mProjection = PVRMatrix4x4.createPerspectiveProjection(g_fCameraNear, g_fCameraFar, PVRMaths.PI/6.0, aspectRatio);

        return true;
    }

    /*!****************************************************************************
      @Function		loadTextures
      @Description	Loads the textures required for this training course
     ******************************************************************************/
    this.loadTextures = function(gl, errorStr)
    {
        this.uiTextureID = null;
        (function(demo)
        {
            PVRTexture.loadFromURI(gl, c_szMaskTex, 0,
                function(gl, textureID, h, m)
                {
                    demo.uiTextureID = textureID;
                });
        })(this);

        return true;
    }

    /*!****************************************************************************
      @Function		loadShaders
      @Description	Loads and compiles the shaders and links the shader programs
      required for this training course
     ******************************************************************************/
    this.loadShaders = function(gl, errorStr)
    {
        /*
           Load and compile the shaders from files.
           Binary shaders are tried first, source shaders
           are used as fallback.
           */
        this.uiVertShader = PVRShader.loadFromURI(gl, c_szVertShaderSrcFile, gl.VERTEX_SHADER, [], function(e){alert(e);});
        if(!this.uiVertShader)
            return false;


        this.uiFragShader = PVRShader.loadFromURI(gl, c_szFragShaderSrcFile, gl.FRAGMENT_SHADER, [], function(e){alert(e)});
        if(!this.uiFragShader)
            return false;

        /*
           Set up and link the shader program
           */

        this.ShaderProgram = new Object();
        this.ShaderProgram.auiLoc = [];
        this.ShaderProgram.uiId = PVRShader.createProgram(gl, this.uiVertShader, this.uiFragShader, g_aszAttribNames, function(e){alert(e);});
        if(!this.ShaderProgram.uiId)
            return false;

        // Store the location of uniforms for later use
        for (var i = 0; i < EUniform.eNumUniforms; ++i)
        {
            this.ShaderProgram.auiLoc[i] = gl.getUniformLocation(this.ShaderProgram.uiId, g_aszUniformNames[i]);
        }

        // Set the sampler2D variable to the first texture unit
        gl.uniform1i(gl.getUniformLocation(this.ShaderProgram.uiId, "sTexture"), 0);

        return true;
    }

    /*!****************************************************************************
      @Function		loadVbos
      @Description	Loads the mesh data required for this training course into
      vertex buffer objects
     ******************************************************************************/
    this.loadVbos = function(gl, errorStr)
    {
        if(this.Scene.data.numMesh == 0) // If there are no VBO to create return
            return true;


        this.puiVbo = new Array();
        this.puiIndexVbo = new Array();

        /*
           Load vertex data of all meshes in the scene into VBOs

           The meshes have been exported with the "Interleave Vectors" option,
           so all data is interleaved in the buffer at pMesh->pInterleaved.
           Interleaving data improves the memory access pattern and cache efficiency,
           thus it can be read faster by the hardware.
           */

        for(var i = 0; i < this.Scene.data.numMeshes; ++i)
        {
            this.puiVbo[i] = gl.createBuffer();

            // Load vertex data into buffer object
            var Mesh = this.Scene.data.meshes[i];

            gl.bindBuffer(gl.ARRAY_BUFFER, this.puiVbo[i]);
            gl.bufferData(gl.ARRAY_BUFFER, Mesh.data.vertexElementData[0], gl.STATIC_DRAW);

            // Load index data into buffer object if available
            this.puiIndexVbo[i] = null;

            if(Mesh.data.faces.data.length > 0)
            {
                this.puiIndexVbo[i] = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.puiIndexVbo[i]);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Mesh.data.faces.data, gl.STATIC_DRAW);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return true;
    }

    /*!****************************************************************************
      @Function		releaseView
      @Description	Code in ReleaseView() will be called by PVRShell when the
      application quits or before a change in the rendering context.
     ******************************************************************************/
    this.releaseView = function(gl)
    {
        // Delete the texture
        gl.deleteTexture(this.uiTextureID);
        gl.deleteTexture(this.uiTextureToRenderTo);
        gl.deleteTexture(this.uiTextureToRenderToMultisampled);

        // Release Print3D Textures
        this.Print3D.releaseTextures();

        // Delete program and shader objects
        gl.deleteProgram(this.ShaderProgram.uiId);
        gl.deleteShader(this.uiVertShader);
        gl.deleteShader(this.uiFragShader);

        // Delete frame buffer objects
        gl.deleteFramebuffer(this.uFBO);
        gl.deleteFramebuffer(this.uFBOMultisampled);

        // Delete our depth buffer
        gl.deleteRenderbuffer(this.uDepthBuffer);
        gl.deleteRenderbuffer(this.uDepthBufferMultisampled);

        return true;
    }

    /*!****************************************************************************
      @Function		createFBO
      @Description	Attempts to create our FBO.
     ******************************************************************************/
    this.createFBO = function(gl)
    {
        // Find the largest square power of two texture that fits into the viewport
        this.i32TexSize = 1;
        var iSize = Math.min(PVRShell.data.width, PVRShell.data.height);
        while (this.i32TexSize * 2 < iSize) this.i32TexSize *= 2;

        // Get the currently bound frame buffer object. On most platforms this just gives 0.
        this.i32OriginalFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        // Generate and bind a render buffer which will become a depth buffer shared between our two FBOs
        this.uDepthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.uDepthBuffer);

        /*
           Currently it is unknown to GL that we want our new render buffer to be a depth buffer.
           gl.renderbufferStorage will fix this and in this case will allocate a depth buffer
           this.i32TexSize by this.i32TexSize.
           */

        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.i32TexSize, this.i32TexSize);

        // Create a texture for rendering to
        this.uiTextureToRenderTo = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.uiTextureToRenderTo);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.i32TexSize, this.i32TexSize, 0, gl.RGB, gl.UNSIGNED_SHORT_5_6_5, null);

        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create the object that will allow us to render to the aforementioned texture
        this.uFBO = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.uFBO);

        // Attach the texture to the FBO
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.uiTextureToRenderTo, 0);

        // Attach the depth buffer we created earlier to our FBO.
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.uDepthBuffer);

        // Check that our FBO creation was successful
        var uStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if(uStatus != gl.FRAMEBUFFER_COMPLETE)
        {
            alert("ERROR: Failed to initialise FBO");
            return false;
        }

        // Clear the colour and depth buffers for the FBO / PBuffer surface
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Unbind the frame buffer object so rendering returns back to the backbuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.i32OriginalFbo);

        return true;
    }

    /*!****************************************************************************
      @Function		createMultisampledFBO
      @Description	Attempts to create a multisampled FBO.
     ******************************************************************************/
    this.createMultisampledFBO = function(gl)
    {
        // Figure out if the platform supports either EXT or IMG extension
        this.eMultisampleMode = EMultisampleExtension.eMultisampleExtension_IMG;
        var extensions = gl.getSupportedExtensions();
        if(extensions.indexOf("EXT_multisampled_render_to_texture") >= 0)
        {
            this.eMultisampleMode = EMultisampleExtension.eMultisampleExtension_EXT;
            this.Extensions.multisampledEXT = gl.getExtension("EXT_multisampled_render_to_texture");
        }
        else
        {
            this.Extensions.multisampledIMG = gl.getExtension("IMG_multisampled_render_to_texture");
        }

        // Query the max amount of samples that are supported, we are going to use the max
        var samples;
        if(this.eMultisampleMode == EMultisampleExtension.eMultisampleExtension_EXT)
            samples = gl.getParameter(this.Extensions.multisampledEXT.MAX_SAMPLES_EXT);
        else
            samples = gl.getParameter(this.Extensions.multisampledIMG.MAX_SAMPLES_IMG);

        // Generate and bind a render buffer which will become a multisampled depth buffer shared between our two FBOs
        this.uDepthBufferMultisampled = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.uDepthBufferMultisampled);
        if(this.eMultisampleMode == EMultisampleExtension.eMultisampleExtension_EXT)
            this.Extensions.multisampledEXT.renderbufferStorageMultisampleEXT(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, this.i32TexSize, this.i32TexSize);
        else
            this.Extensions.multisampledIMG.renderbufferStorageMultisampleIMG(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, this.i32TexSize, this.i32TexSize);

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        // Create a texture for rendering to
        this.uiTextureToRenderToMultisampled = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.uiTextureToRenderToMultisampled);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.i32TexSize, this.i32TexSize, 0, gl.RGBA, gl.UNSIGNED_SHORT_4_4_4_4, null);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Create the object that will allow us to render to the aforementioned texture
        this.uFBOMultisampled = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.uFBOMultisampled);

        // Attach the depth buffer we created earlier to our FBO.
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.uDepthBufferMultisampled);

        // Attach the texture to the FBO
        if(this.eMultisampleMode == EMultisampleExtension.eMultisampleExtension_EXT)
            this.Extensions.multisampledEXT.framebufferTexture2DMultisampleEXT(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.uiTextureToRenderToMultisampled, 0, samples);
        else
            this.Extensions.multisampledIMG.framebufferTexture2DMultisampleIMG(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.uiTextureToRenderToMultisampled, 0, samples);

        // Check that our FBO creation was successful
        var uStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if(uStatus != gl.FRAMEBUFFER_COMPLETE)
        {
            PVRShellOutputDebug("ERROR: Failed to initialise FBO");
            return false;
        }

        // Clear the colour and depth buffers for the FBO / PBuffer surface
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Unbind the frame buffer object so rendering returns back to the backbuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.i32OriginalFbo);

        return true;
    }

    /*!****************************************************************************
      @Function		renderScene
      @Description	Main rendering loop function of the program. The shell will
      call this function every frame.
      swapBuffers() will be performed by PVRShell automatically.
      PVRShell will also manage important OS events.
      Will also manage relevent OS events. The user has access to
      these events through an abstraction layer provided by PVRShell.
     ******************************************************************************/
    this.renderScene = function(gl)
    {
        if(this.PODLoaded == 0)
            return true;

        if(!this.isInitialised)
        {
            if(!this.initialiseView(gl))
                return false;

            this.isInitialised = true;
        }

        // Enable the vertex attribute arrays
        gl.enableVertexAttribArray(EVertexAttrib.eVERTEX_ARRAY);
        gl.enableVertexAttribArray(EVertexAttrib.eNORMAL_ARRAY);
        gl.enableVertexAttribArray(EVertexAttrib.eTEXCOORD_ARRAY);

        // Use shader program
        gl.useProgram(this.ShaderProgram.uiId);

        // Setup the lighting direction

        // Reads the light direction from the scene.
        var vLightDirection;
        var vPos;

        vLightDirection = this.Scene.getLightDirection(0);

        // Update out angle used for rotating the mask
        var mWorld, mMVP;
        var vLightDir;
        var vLightDirModel;

        this.fAngleY += (2*PVRMaths.PI/60.0)/7.0;

        // Render to our texture
        {
            // Bind our FBO
            if (this.bUseMultisampled)
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.uFBOMultisampled);
            else
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.uFBO);

            // Setup the Viewport to the dimensions of the texture
            gl.viewport(0, 0, this.i32TexSize, this.i32TexSize);

            // Set the colour to clear our texture to
            gl.clearColor(0.8, 1.0, 0.6, 1.0);

            // Clear the colour and depth buffer of our FBO / PBuffer surface
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Render our objects as we usually would
            mWorld = PVRMatrix4x4.createRotationY3D(this.fAngleY);

            // Pass the light direction in model space to the shader
            vLightDir = PVRMatrix4x4.vectorMultiply(PVRMatrix4x4.inverse(mWorld), vLightDirection);

            vLightDirModel = new PVRVector3(vLightDir.data[0], vLightDir.data[1], vLightDir.data[2]);
            vLightDirModel.normalise();

            gl.uniform3fv(this.ShaderProgram.auiLoc[EUniform.eLightDirection], vLightDirModel.data);

            // Set the model-view-projection matrix
            mMVP = PVRMatrix4x4.matrixMultiply(this.mR2TProjection, PVRMatrix4x4.matrixMultiply(this.mR2TView, mWorld));
            gl.uniformMatrix4fv(this.ShaderProgram.auiLoc[EUniform.eMVPMatrix], gl.FALSE, mMVP.data);

            // Bind the mask's texture
            gl.bindTexture(gl.TEXTURE_2D, this.uiTextureID);

            // Draw our mask
            this.drawMesh(gl, this.Scene.data.nodes[0].data.index);

            if(this.bDiscard) // Was EXT_discard_framebuffer supported?
            {
                /*
                   Give the drivers a hint that we don't want the depth and stencil information stored for future use.

                   Note: This training course doesn't have any stencil information so the STENCIL_ATTACHMENT enum
                   is used for demonstrations purposes only and will be ignored by the driver.
                */
                var attachments = [ gl.DEPTH_ATTACHMENT, gl.STENCIL_ATTACHMENT ];
                this.Extensions.discardFramebufferEXT.discardFramebufferEXT(gl.FRAMEBUFFER, 2, attachments);
            }

            // We are done with rendering to our FBO so switch back to the back buffer.
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.i32OriginalFbo);
        }

        // Set the clear colour
        gl.clearColor(0.6,   0.8, 1.0, 1.0);

        // Clear the colour and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Setup the Viewport to the dimensions of the screen
        gl.viewport(0, 0, PVRShell.data.width, PVRShell.data.height);

        // Get the node model matrix
        mWorld = this.Scene.getWorldMatrix(1);

        // Pass the light direction in model space to the shader
        vLightDir = PVRMatrix4x4.vectorMultiply(PVRMatrix4x4.inverse(mWorld), vLightDirection);

        vLightDirModel = new PVRVector3(vLightDir.data[0], vLightDir.data[1], vLightDir.data[2]);
        vLightDirModel.normalise();

        gl.uniform3fv(this.ShaderProgram.auiLoc[EUniform.eLightDirection], vLightDirModel.data);

        // Set the model-view-projection matrix
        mMVP = PVRMatrix4x4.matrixMultiply(this.mProjection, PVRMatrix4x4.matrixMultiply(this.mView, mWorld));
        gl.uniformMatrix4fv(this.ShaderProgram.auiLoc[EUniform.eMVPMatrix], gl.FALSE, mMVP.data);

        // Bind our texture that we have rendered to
        if (this.bUseMultisampled)
            gl.bindTexture(gl.TEXTURE_2D, this.uiTextureToRenderToMultisampled);
        else
            gl.bindTexture(gl.TEXTURE_2D, this.uiTextureToRenderTo);

        // Draw our textured cube
        this.drawMesh(gl, this.Scene.data.nodes[1].data.index);

        // Safely disable the vertex attribute arrays
        gl.disableVertexAttribArray(EVertexAttrib.eVERTEX_ARRAY);
        gl.disableVertexAttribArray(EVertexAttrib.eNORMAL_ARRAY);
        gl.disableVertexAttribArray(EVertexAttrib.eTEXCOORD_ARRAY);

        // Unbind our VBOs
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // Display the demo name using the tools. For a detailed explanation, see the training course IntroducingPVRTools
        this.print3D.displayDefaultTitle("RenderToTexture", g_pszDesc[this.eMultisampleMode], EPVRPrint3D.Logo.PowerVR);
        this.print3D.flush(gl);

        return true;
    }

    /*!****************************************************************************
      @Function		drawMesh
      @Description	Draws a SPODMesh after the model view matrix has been set and
      the meterial prepared.
     ******************************************************************************/
    this.drawMesh = function(gl, ui32MeshID)
    {
        var Mesh = this.Scene.data.meshes[ui32MeshID];

        // bind the VBO for the mesh
        gl.bindBuffer(gl.ARRAY_BUFFER, this.puiVbo[ui32MeshID]);
        // bind the index buffer, won't hurt if the handle is 0
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.puiIndexVbo[ui32MeshID]);

        // Set the vertex attribute offsets
        var positions = Mesh.data.vertexElements["POSITION0"];
        var normals   = Mesh.data.vertexElements["NORMAL0"];
        var uvs       = Mesh.data.vertexElements["UV0"];
        gl.vertexAttribPointer(EVertexAttrib.eVERTEX_ARRAY, 3, gl.FLOAT, gl.FALSE, positions.stride, positions.offset);
        gl.vertexAttribPointer(EVertexAttrib.eNORMAL_ARRAY, 3, gl.FLOAT, gl.FALSE, normals.stride, normals.offset);
        gl.vertexAttribPointer(EVertexAttrib.eTEXCOORD_ARRAY, 2, gl.FLOAT, gl.FALSE, uvs.stride, uvs.offset);

        // Indexed Triangle list
        gl.drawElements(gl.TRIANGLES, Mesh.data.faces.data.length, gl.UNSIGNED_SHORT, 0);
    }
}
