function WebGLIntroducingPVRTools()
{
    var VERTEX_ARRAY   = 0;
    var TEXCOORD_ARRAY = 1;

    var print3D;
    var texture = null;
    var vbo     = null;
    var vertexStride;
    var shaders = {};
    var shaderProgram = {};
    var loaded = false;

    var handleTextureLoaded = function(gl, textureID, header, metaData)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        texture = textureID;
        loaded = true;
    }

    this.initView = function(gl)
    {
        print3D = new PVRPrint3D();
        print3D.setTextures(gl, PVRShell.data.width, PVRShell.data.height);

        // Sets the clear color
        gl.clearColor(0.6, 0.8, 1.0, 1.0);

        PVRTexture.loadFromURI(gl, "Image.pvr", 0,
                function(gl, textureID, header, metaData)
                { handleTextureLoaded(gl, textureID, header, metaData); });

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

        // Create VBO for the triangle from our data

        // Vertex data
        var vertices = [
            -0.4,-0.4, 0.0,
            0.0, 0.0,
            0.4,-0.4, 0.0,
            1.0, 0.0,
            0.0, 0.4, 0.0,
            0.5, 1.0
                ];

        // Create our VBO
        vbo = gl.createBuffer();

        // Bind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // Set the buffer's data
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Unbind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        vertexStride = 5 * 4; // 3 floats for the pos, 2 for the UVs

        // Enable culling
        gl.enable(gl.CULL_FACE);
        return true;
    }

    this.renderScene = function(gl)
    {
        // Clears the color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Binds the loaded texture
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Use the loaded shader program
        gl.useProgram(shaderProgram.id);

        /*
           Creates the Model View Projection (MVP) matrix using the PVRTMat4 class from the tools.
           The tools contain a complete set of functions to operate on 4x4 matrices.
           */
        var mMVP = PVRMatrix4x4.identity();

        /*
           Pass this matrix to the shader.
           The .m field of a PVRTMat4 contains the array of float used to
           communicate with OpenGL ES.
           */
        gl.uniformMatrix4fv(shaderProgram.MVPMatrix, gl.FALSE, mMVP.data);

        /*
           Draw a triangle.
           Please refer to the training course IntroducingPVRShell for a detailed explanation.
           */

        // Bind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // Pass the vertex data
        gl.enableVertexAttribArray(VERTEX_ARRAY);
        gl.vertexAttribPointer(VERTEX_ARRAY, 3, gl.FLOAT, gl.FALSE, vertexStride, 0);

        // Pass the texture coordinates data
        gl.enableVertexAttribArray(TEXCOORD_ARRAY);
        gl.vertexAttribPointer(TEXCOORD_ARRAY, 2, gl.FLOAT, gl.FALSE, vertexStride, 3*4);

        // Draws a non-indexed triangle array
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        /*
           Display some text.
           Print3D() function allows to draw text anywhere on the screen using any color.
           Param 1: Position of the text along X (from 0 to 100 scale independent)
           Param 2: Position of the text along Y (from 0 to 100 scale independent)
           Param 3: Scale of the text
           Param 4: Colour of the text (0xAABBGGRR format)
           Param 5: Formatted string (uses the same syntax as printf)
           */
        print3D.print3D(8.0, 30.0, 1.0, 0xFFAA4040, "example");

        /*
           DisplayDefaultTitle() writes a title and description text on the top left of the screen.
           It can also display the PVR logo (ePVRTPrint3DLogoPVR), the IMG logo (ePVRTPrint3DLogoIMG) or both (ePVRTPrint3DLogoPVR | ePVRTPrint3DLogoIMG).
           Set this last parameter to NULL not to display the logos.
           */
        print3D.displayDefaultTitle("IntroducingPVRTools", "Description", EPVRPrint3D.Logo.PowerVR);

        // Tells Print3D to do all the pending text rendering now
        print3D.flush(gl);

        return true;
    }
}
