function WebGLIntroducingPrint3D()
{
    var TEXTFONT	= "arial_36.pvr";
    var INTROFONT	= "starjout_60.pvr";
    var TITLEFONT   = "title_36.pvr";
    var TEXTFILE    = "Text.txt";

    var INTRO_TIME      = 4000;
    var INTRO_FADE_TIME = 1000;
    var TITLE_TIME      = 4000;
    var TITLE_FADE_TIME = 500;

    var TEXT_START_Y    = -650.0;
    var TEXT_END_Y      = 1300.0;
    var TEXT_FADE_START = 300.0;
    var TEXT_FADE_END   = 500.0;

    var targetFPS       = 1.0/60.0;
    var shaders         = {};
    var shaderProgram   = {};
    var vbo = null;
    var starTexture = null;

    var ETitleLanguage =
    {
        eLang_English : 0,
        eLang_German : 1,
        eLang_Norwegian : 2,
        eLang_Bulgarian : 3,

        eLang_Size : 4
    };

    var titles =
    [
        "IntroducingPrint3D",
        "Einf\u00FChrungPrint3D",
        "Innf\u00F8ringPrint3D",
        "\u0432\u044A\u0432\u0435\u0436\u0434\u0430\u043D\u0435Print3D",
    ];

	var generateBackgroundTexture = function(gl, screenWidth, screenHeight)
    {
        // Generate star texture
        var starW = PVRMaths.POTHigher(screenWidth,  1);
        var starH = PVRMaths.POTHigher(screenHeight, 1);

        starTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, starTexture);
        var texData = new Uint8Array(starW*starH);
        for (var y = 0; y < starH; y++)
        {
            for (var x = 0; x < starW; x++)
            {
                var idx = (y*starW+x);
                if(Math.floor(Math.random() * 200) == 1)
                {
                    texData[idx] = Math.random() * 255 + 1;
                }
            }
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, starW, starH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        shaders.vertexShader = PVRShader.loadFromURI(gl, "VertShader.vsh", gl.VERTEX_SHADER, [], function(e){alert(e);});
        if(!shaders.vertexShader)
            return false;

        shaders.fragShader = PVRShader.loadFromURI(gl, "FragShader.fsh", gl.FRAGMENT_SHADER, [], function(e){alert(e);});
        if(!shaders.fragShader)
            return false;

        var attribs = ["inVertex", "inTexCoord"];
        shaderProgram.id = PVRShader.createProgram(gl, shaders.vertexShader, shaders.fragShader, attribs, function(e){alert(e);});
        if(!shaderProgram.id)
            false;

        shaderProgram.MVPMatrix = gl.getUniformLocation(shaderProgram.id, "MVPMatrix");
        gl.uniform1i(gl.getUniformLocation(shaderProgram.id, "sTexture"), 0);

        // Vertex data
        var vertices = [
            -1.0, 1.0, 0.0,
            0.0,  1.0,

            -1.0, -1.0, 0.0,
            0.0,   0.0,

            1.0,  1.0, 0.0,
            1.0,  1.0,

            1.0, -1.0, 0.0,
            1.0,  0.0,
            ];

        // Create our VBO
        vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    this.initApplication = function()
    {
        this.centralTextData = new Array();

        // Load the string table
        var fs = new PVRFileStream();
        textLoaded = function(stream, demo)
        {
            var centralTextIdx = 0;
            for(var idx = 0; idx < stream.GetSize(); idx+=2)
            {
                if(demo.centralTextData[centralTextIdx] == undefined)
                    demo.centralTextData[centralTextIdx] = new String();

                var c = stream.ReadUInt16(idx);
                demo.centralTextData[centralTextIdx] += String.fromCharCode(c);
                if(c == 0x0A)
                {
                    centralTextIdx++;
                    continue;
                }
            }
        }
        fs.Open(TEXTFILE, false, textLoaded, this);

        this.textOffset     = TEXT_START_Y;
        this.previousFrameT = 0;
        this.titleLang      = ETitleLanguage.eEnglish;

        return true;
    }

    this.initView = function(gl)
    {
        var width  = PVRShell.data.width;
        var height = PVRShell.data.height;

        this.print3D = new PVRPrint3D();
        this.print3D.setTextures(gl, width, height);

        this.centralText = new PVRPrint3D();
        this.centralText.setTextures(gl, width, height, TEXTFONT);

        this.introText = new PVRPrint3D();
        this.introText.setTextures(gl, width, height, INTROFONT);

        this.titleText = new PVRPrint3D();
        this.titleText.setTextures(gl, width, height, TITLEFONT);

        // Sets the clear color
        gl.clearColor(0.0, 1.0, 0.0, 1.0);

        // Generate background texture
        generateBackgroundTexture(gl, width, height);

        this.startTime = PVRShell.getTimeNow();

        // Enable culling
        gl.enable(gl.CULL_FACE);

        return true;
    }

    this.renderScene = function(gl)
    {
        // Clears the color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var currentTime = PVRShell.getTimeNow() - this.startTime;

        // Draw star background
        {
            gl.bindTexture(gl.TEXTURE_2D, starTexture);
            gl.useProgram(shaderProgram.id);
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

            var mMVP = PVRMatrix4x4.identity();
            gl.uniformMatrix4fv(shaderProgram.MVPMatrix, gl.FALSE, mMVP.data);

            // Pass the vertex data
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 3*4 + 2*4, 0);

            // Pass the texture coordinates data
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 3*4 + 2*4, 3*4);

            // Draws a non-indexed triangle array
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        // Render the 'Introducing Print3D' title for the first n seconds.
        if(currentTime < INTRO_TIME)
        {
            var fadeAmount = 1.0;

            // Fade in
            if(currentTime < INTRO_FADE_TIME)
            {
                fadeAmount = currentTime / INTRO_FADE_TIME;
            }
            // Fade out
            else if(currentTime > INTRO_TIME - INTRO_FADE_TIME)
            {
                fadeAmount = 1.0 - ((currentTime - (INTRO_TIME - INTRO_FADE_TIME)) / INTRO_FADE_TIME);
            }

            renderTitle(gl, fadeAmount, this.introText);
        }
        // Render the 3D text.
        else
        {
            renderText(gl, this);
        }

        /*
           Here we are passing in a wide-character string to Print3D function. This allows
           Unicode to be compiled in to string-constants, which this code snippet
           demonstrates.
           Because we are not setting a projection or a model-view matrix the default projection
           matrix is used.
           */
        var titleLang = Math.floor((currentTime / 1000) / (TITLE_TIME / 1000)) % ETitleLanguage.eLang_Size;
        var nextLang  = Math.floor(titleLang + 1) % ETitleLanguage.eLang_Size;
        var modTime   = currentTime % TITLE_TIME;
        var titlePerc = 1.0;
        var nextPerc  = 0.0;
        if(modTime > TITLE_TIME - TITLE_FADE_TIME)
        {
            titlePerc = 1.0 - ((modTime - (INTRO_TIME - INTRO_FADE_TIME)) / INTRO_FADE_TIME);
            nextPerc  = 1.0 - titlePerc;
        }
        var titleCol = ((titlePerc * 255) << 24) | 0xFFFFFF;
        var nextCol  = ((nextPerc  * 255) << 24) | 0xFFFFFF;
        this.titleText.print3D(0, 0, 1, titleCol, titles[titleLang]);
        this.titleText.print3D(0, 0, 1, nextCol, titles[nextLang]);
        this.titleText.flush(gl);

        /*
           DisplayDefaultTitle() writes a title and description text on the top left of the screen.
           It can also display the PVR logo (ePVRTPrint3DLogoPowerVR), the IMG logo (ePVRTPrint3DLogoIMG) or both (ePVRTPrint3DLogoPowerVR | ePVRTPrint3DLogoIMG)
           which is what we are using the function for here.
           Set this last parameter to NULL not to display the logos.
           Passing NULL for the first two parameters will not display any text.
           */
        this.print3D.displayDefaultTitle(null, null, EPVRPrint3D.Logo.PowerVR);

        // Tells Print3D to do all the pending text rendering now
        this.print3D.flush(gl);

        return true;
    }

    var renderTitle = function(gl, fadeAmount, introText)
    {
        var col = ((fadeAmount * 255) << 24) | 0x00FFFF;

        var w = PVRShell.data.width  * 0.5;
        var h = PVRShell.data.height * 0.5;

        /*
           Print3D can optionally be provided with user-defined projection and modelview matrices
           which allow custom layout of text. Here we are just providing a projection matrix
           so that text can be placed in viewport coordinates, rather than the default, more
           abstract coordinate system of 0.0-100.0.
           */
        var mProjection = PVRMatrix4x4.createOrthographicProjection(-w, h, w, -h, -1.0, 1.0);
        introText.setProjection(mProjection);

        /*
           Using the MeasureText() method provided by Print3D, we can determine the bounding-box
           size of a string of text. This can be useful for justify text centrally, as we are
           doing here.
           */
        var line1W = 0.0;
        var line2W = 0.0;
        var line1WH = introText.measureText(1.0, "introducing");
        var line2WH = introText.measureText(1.0, "print3d");

        /*
           Display some text.
           Print3D() function allows to draw text anywhere on the screen using any colour.
           Param 1: Position of the text along X
           Param 2: Position of the text along Y
           Param 3: Scale of the text
           Param 4: Colour of the text (0xAABBGGRR format)
           Param 5: Formatted string (uses the same syntax as printf)
           ...
           */
        introText.print3D(-line1WH.width*0.5, 50.0, 1.0, col, "introducing");
        introText.print3D(-line2WH.width*0.5, 0.0,  1.0, col, "print3d");

        // Tells Print3D to do all the pending text rendering now
        introText.flush(gl);
    }

	var renderText = function(gl, demo)
    {
        var aspect = PVRShell.data.width / PVRShell.data.height;

        // Calculate the frame delta.
        var now = PVRShell.getTimeNow();
        if(demo.previousFrameT == 0)
            demo.previousFrameT = now;

        var dt = (now - demo.previousFrameT) * 0.001;
        demo.previousFrameT = now;

        // Calculate the FPS scale.
        var FPSScale = dt / targetFPS;

        // Move the text. Progressively speed up.
        var speedInc = 0.0;
        if(demo.textOffset > 0.0)
            speedInc = demo.textOffset / TEXT_END_Y;
        demo.textOffset += (0.75 + (1.0 * speedInc)) * FPSScale;
        if(demo.textOffset > TEXT_END_Y)
            demo.textOffset = TEXT_START_Y;

        var mProjection = PVRMatrix4x4.createPerspectiveProjection(1.0, 2000.0, 0.7, aspect);
        var mCamera     = PVRMatrix4x4.createLookAt(new PVRVector3(0.0, -900.0, 700.0), new PVRVector3(0.0, -200.0, 0.0), new PVRVector3(0.0, 1.0, 0.0));
        var mTrans      = PVRMatrix4x4.translation(0.0, demo.textOffset, 0.0);
        var mModelView  = PVRMatrix4x4.matrixMultiply(mCamera, mTrans);
        var strWidth    = 0.0;

        /*
           Print3D can optionally be provided with user-defined projection and model-view matrices
           which allow custom layout of text. Here we are proving both a projection and model-view
           matrix. The projection matrix specified here uses perspective projection which will
           provide the 3D effect. The model-view matrix positions the the text in world space
           providing the 'camera' position and the scrolling of the text.
           */
        demo.centralText.setProjection(mProjection);
        demo.centralText.setModelView(mModelView);

        /*
           The previous method (RenderTitle()) explains the following functions in more detail
           however put simply, we are looping the entire array of loaded text which is encoded
           in UTF-8. Print3D batches this internally and the call to Flush() will render the
           text to the frame buffer. We are also fading out the text over a certain distance.
           */
        var pos, fade;
        var col;
        for(var index = 0; index < demo.centralTextData.length; ++index)
        {
            pos = (demo.textOffset - (index * 36.0));
            fade = 1.0;
            if(pos > TEXT_FADE_START)
            {
                fade = Math.max(Math.min(1.0 - ((pos - TEXT_FADE_START) / (TEXT_FADE_END - TEXT_FADE_START)), 1.0), 0.0);
            }

            col = ((fade * 255) << 24) | 0x00FFFF;

            var textWH = demo.centralText.measureText(1.0, demo.centralTextData[index]);
            var textW  = textWH.width;
            demo.centralText.print3D(-(textW * 0.5), -(index * 36.0), 1.0, col, demo.centralTextData[index]);
        }

        demo.centralText.flush(gl);
    }
}

