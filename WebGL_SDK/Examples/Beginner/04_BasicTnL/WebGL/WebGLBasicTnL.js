function WebGLBasicTnL()
{
    var angle = 0.0;
    var shaders = {};
    var program = null;
    var texture = null;
    var vbo     = null;

    this.initView = function(gl)
    {
        var fragmentShaderSource =
            'uniform sampler2D sampler2d;'                                       +
            'varying mediump float varDot;'                                      +
            'varying mediump vec2 varCoord;'                                     +
            'void main (void)'                                                   +
            '{'                                                                  +
            '    gl_FragColor.rgb = texture2D(sampler2d,varCoord).rgb * varDot;' +
            '    gl_FragColor.a = 1.0;'                                          +
            '}';

        var vertexShaderSource =
            'attribute highp vec4 myVertex;'                               +
            'attribute mediump vec3 myNormal;'                             +
            'attribute mediump vec4 myUV;'                                 +
            'uniform mediump mat4 myPMVMatrix;'                            +
            'uniform mediump mat3 myModelViewIT;'                          +
            'uniform mediump vec3 myLightDirection;'                       +
            'varying mediump float varDot;'                                +
            'varying mediump vec2 varCoord;'                               +
            'void main(void)'                                              +
            '{'                                                            +
            '    gl_Position = myPMVMatrix * myVertex;'                    +
            '    varCoord = myUV.st;'                                      +
            '    mediump vec3 transNormal = myModelViewIT * myNormal;'     +
            '    varDot = max( dot(transNormal, myLightDirection), 0.0 );' +
            '}';


        // Create the fragment shader object
        shaders.fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        // Load the source code into it
        gl.shaderSource(shaders.fragShader, fragmentShaderSource);

        // Compile the source code
        gl.compileShader(shaders.fragShader);

        // Check if compilation succeeded
        if (!gl.getShaderParameter(shaders.fragShader, gl.COMPILE_STATUS))
        {
            // It didn't. Display the info log as to why
            alert("Failed to compile the fragment shader.\n" + gl.getShaderInfoLog(shaders.fragShader));
            return false;
        }

        // Create the vertex shader object
        shaders.vertexShader = gl.createShader(gl.VERTEX_SHADER);

        // Load the source code into it
        gl.shaderSource(shaders.vertexShader, vertexShaderSource);

        // Compile the source code
        gl.compileShader(shaders.vertexShader);

        // Check if compilation succeeded
        if (!gl.getShaderParameter(shaders.vertexShader, gl.COMPILE_STATUS))
        {
            // It didn't. Display the info log as to why
            alert("Failed to compile the vertex shader.\n" + gl.getShaderInfoLog(shaders.vertexShader));
            return false;
        }

        // Create the shader program
        program = gl.createProgram();

        // Attach the fragment and vertex shaders to it
        gl.attachShader(program, shaders.fragShader);
        gl.attachShader(program, shaders.vertexShader);

        // Bind the custom vertex attribute "myVertex" to location 0
        gl.bindAttribLocation(program, 0, "myVertex");

        // Bind the custom vertex attribute "myUV" to location 1
        gl.bindAttribLocation(program, 1, "myUV");

        // Bind the custom vertex attribute "myNormal" to location 2
        gl.bindAttribLocation(program, 2, "myNormal");

        // Link the program
        gl.linkProgram(program);

        // Check if linking succeeded in a similar way we checked for compilation errors
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            alert("Failed to link the program.\n" + gl.getProgramInfoLog(program));
            return false;
        }

        // Actually use the created program
        gl.useProgram(program);

        // Sets the clear colour
        gl.clearColor(0.6, 0.8, 1.0, 1.0);

        /*
            Create the texture
        */

        // Allocate one texture handle
        texture = gl.createTexture();

        // Bind the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Create the data as a 32bits integer array (8 bits per component)
        var textureSize = 128;
        var textureData = new Uint8Array(textureSize * textureSize * 4);

        for(var i = 0; i < textureSize; ++i)
        {
            for(var j = 0; j < textureSize; ++j)
            {
                var index = (j * textureSize + i) * 4;

                if ( (((i*j)/8) >> 0) % 2 )
                {
                    textureData[index + 0] = 255;
                    textureData[index + 1] = 0;
                    textureData[index + 2] = 255;
                    textureData[index + 3] = 255;
                }
                else
                {
                    textureData[index + 3] = 255;
                    textureData[index + 2] = 255 - j * 2;
                    textureData[index + 1] = 255 - i;
                    textureData[index + 0] = 255 - i * 2;
                }
            }
        }

        /*
            gl.texImage2D loads the texture data into the texture object.
        */

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureSize, textureSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);

        // Set the texture parameters
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Create VBO for the triangle from our data

        // Vertex data
        var vertices = [
            -0.4,-0.4, 0.0, // Position
             0.0, 0.0,        // UVs
             0.0, 0.0, 1.0, // Normals
             0.4,-0.4, 0.0,
             1.0, 0.0,
             0.0, 0.0, 1.0,
             0.0, 0.4, 0.0,
             0.5, 1.0,
             0.0, 0.0, 1.0
        ];

        // Create our VBO
        vbo = gl.createBuffer();

        // Bind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // Set the buffer's data
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Unbind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return true;
    }

    this.renderScene = function(gl)
    {
        // Matrix used for the model view inverse transpose
        var modelViewIT = [
            Math.cos(angle),  0.0, Math.sin(angle),
            0.0,               1.0, 0.0,
            -Math.sin(angle), 0.0, Math.cos(angle),
        ];

        // Matrix used for the model view projection matrix
        var modelViewProj = [
            Math.cos(angle),  0.0, Math.sin(angle), 0.0,
            0.0,               1.0, 0.0,             0.0,
            -Math.sin(angle), 0.0, Math.cos(angle), 0.0,
            0.0,               0.0, 0.0,             1.0
        ];

        // Increment the angle
        angle += 0.05;

        /*
            Clear the colour buffer
            gl.clear can also be used to clear the depth or stencil buffer
            (gl.DEPTH_BUFFER_BIT or gl.SENCIL_BUFFER_BIT)
        */
        gl.clear(gl.COLOR_BUFFER_BIT);

        /*
            Bind the projection model view matrix (PMVMatrix) to the associated
            uniform variable in the shader
        */
        var location = gl.getUniformLocation(program, "myPMVMatrix");

        // Then pass the matrix to that variable
        gl.uniformMatrix4fv(location, gl.FALSE, modelViewProj);

        /*
            Bind the model view inverse transpose matrix to the shader.
            This matrix is used in the vertex shader to transform the normals.
        */
        location = gl.getUniformLocation(program, "myModelViewIT");
        gl.uniformMatrix3fv(location, gl.FALSE, modelViewIT);

        // Bind the light direction vector to the shader
        location = gl.getUniformLocation(program, "myLightDirection");
        gl.uniform3f(location, 0, 0, 1);

        // Bind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        /*
            Enable the custom vertex attribute at index 0.
            We previously bound that index to "MyVertex" in our shader.
        */
        gl.enableVertexAttribArray(0);

        // Point at the data for this vertex attribute (vertex positions)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 32, 0);

        // Point at the data for this vertex attribute (texcoords)
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 32, 12 /* UVs start after the vertex position */ );

        // Point at the data for this vertex attribute (normals)
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 32, 20 /* Normals start after the position and uvs */ );

        /*
            Now lets draw a non-indexed triangle array using the pointers previously given.
            This function allows the use of other primitive types : triangle strips, lines, ...
            For indexed geometry, use the function gl.drawElements with an index list.
        */
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Unbind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return true;
    }
}
