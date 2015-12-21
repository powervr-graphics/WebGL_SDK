function WebGLIntroducingPVRShell()
{
    var shaders = {};
    var program = null;
    var vbo     = null;

    this.initView = function(gl)
    {
        var fragmentShaderSource =
            'void main(void)'                               +
            '{'                                             +
            '    gl_FragColor = vec4(1.0, 1.0, 0.66, 1.0);' +
            '}';

        var vertexShaderSource =
            'attribute highp vec4 myVertex;'             +
            'uniform mediump mat4 myPMVMatrix;'          +
            'void main(void)'                            +
            '{'                                          +
            '    gl_Position = myPMVMatrix * myVertex;'  +
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

        // Create VBO for the triangle from our data

        // Vertex data
        var vertices = [
            -0.4,-0.4, 0.0,
             0.4,-0.4, 0.0,
             0.0, 0.4, 0.0
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
        // Matrix used for the projection model view
        var identity = [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ];

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
        gl.uniformMatrix4fv(location, gl.FALSE, identity);

        // Bind the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        /*
            Enable the custom vertex attribute at index 0.
            We previously bound that index to "MyVertex" in our shader.
        */
        gl.enableVertexAttribArray(0);

        // Point at the data for this vertex attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);

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
