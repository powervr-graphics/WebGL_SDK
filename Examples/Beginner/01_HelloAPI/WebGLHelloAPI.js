var gl;

function testGLError(functionLastCalled) {
    /*
		gl.getError returns the last error that occurred using WebGL, not necessarily the status of the last called function. The user
		has to check after every single WebGL call or at least once every frame. Usually this would be for debugging only, but for this
		example is is enabled always.
	*/

    var lastError = gl.getError();

    if (lastError != gl.NO_ERROR) {
        alert(functionLastCalled + " failed (" + lastError + ")");
        return false;
    }

    return true;
}

function initialiseGL(canvas) {
    try {
        // Try to grab the standard context. If it fails, fallback to experimental
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    catch (e) {
    }

    if (!gl) {
        alert("Unable to initialise WebGL. Your browser may not support it");
        return false;
    }

    return true;
}

var shaderProgram;

function initialiseBuffer() {
    /*	Concept: Vertices
		When rendering a polygon or model to screen, WebGL has to be told where to draw the object, and more fundamentally what shape 
		it is. The data used to do this is referred to as vertices, points in 3D space which are usually collected into groups of three 
		to render as triangles. Fundamentally, any advanced 3D shape in WebGL is constructed from a series of these vertices - each 
		vertex representing one corner of a polygon.
	*/
    /*	Concept: Buffer Objects
		To operate on any data, WebGL first needs to be able to access it. The GPU maintains a separate pool of memory it uses independent
		of the CPU. Whilst on many embedded systems these are in the same physical memory, the distinction exists so that they can use and
		allocate memory without having to worry about synchronising with any other processors in the device.
		To this end, data needs to be uploaded into buffers, which are essentially a reserved bit of memory for the GPU to use. By creating
		a buffer and giving it some data we can tell the GPU how to render a triangle.
	*/

    var vertexData = [
        -0.4, -0.4, 0.0, // Bottom left
         0.4, -0.4, 0.0, // Bottom right
         0.0, 0.4, 0.0  // Top middle
    ];

    // Generate a buffer object
    gl.vertexBuffer = gl.createBuffer();

    // Bind buffer as a vertex buffer so we can fill it with data
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);

    /*
        Set the buffer's size, data and usage
        Note the last argument - gl.STATIC_DRAW. This tells the driver that we intend to read from the buffer on the GPU, and don't intend
        to modify the data until we've done with it.
    */
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

    return testGLError("initialiseBuffers");
}

function initialiseShaders() {
    /*	Concept: Shaders
        WebGL uses what are known as shaders to determine how to draw objects on the screen. Instead of the fixed function
        pipeline in early OpenGL or OpenGL ES 1.x, users can now programmatically define how vertices are transformed on screen, what
        data is used where, and how each pixel on the screen is coloured.
        These shaders are written in GL Shading Language ES: http://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf
        which is usually abbreviated to simply "GLSL ES".
        Each shader is compiled on-device and then linked into a shader program, which combines a vertex and fragment shader into a form 
        that the OpenGL ES implementation can execute.
    */

    /*	Concept: Fragment Shaders
        In a final buffer of image data, each individual point is referred to as a pixel. Fragment shaders are the part of the pipeline
        which determine how these final pixels are coloured when drawn to the framebuffer. When data is passed through here, the positions
        of these pixels is already set, all that's left to do is set the final colour based on any defined inputs.
        The reason these are called "fragment" shaders instead of "pixel" shaders is due to a small technical difference between the two
        concepts. When you colour a fragment, it may not be the final colour which ends up on screen. This is particularly true when 
        performing blending, where multiple fragments can contribute to the final pixel colour.
    */

    var fragmentShaderSource = '\
			void main(void) \
			{ \
				gl_FragColor = vec4(1.0, 1.0, 0.66, 1.0); \
			}';

    // Create the fragment shader object
    gl.fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Load the source code into it
    gl.shaderSource(gl.fragShader, fragmentShaderSource);

    // Compile the source code
    gl.compileShader(gl.fragShader);

    // Check if compilation succeeded
    if (!gl.getShaderParameter(gl.fragShader, gl.COMPILE_STATUS)) {
        // It didn't. Display the info log as to why
        alert("Failed to compile the fragment shader.\n" + gl.getShaderInfoLog(gl.fragShader));
        return false;
    }

    /*	Concept: Vertex Shaders
        Vertex shaders primarily exist to allow a developer to express how to orient vertices in 3D space, through transformations like 
        Scaling, Translation or Rotation. Using the same basic layout and structure as a fragment shader, these take in vertex data and 
        output a fully transformed set of positions. Other inputs are also able to be used such as normals or texture coordinates, and can 
        also be transformed and output alongside the position data.
    */

    // Vertex shader code
    var vertexShaderSource = '\
			attribute highp vec4 myVertex; \
			uniform mediump mat4 transformationMatrix; \
			void main(void)  \
			{ \
				gl_Position = transformationMatrix * myVertex; \
			}';

    // Create the vertex shader object
    gl.vertexShader = gl.createShader(gl.VERTEX_SHADER);

    // Load the source code into it
    gl.shaderSource(gl.vertexShader, vertexShaderSource);

    // Compile the source code
    gl.compileShader(gl.vertexShader);

    // Check if compilation succeeded
    if (!gl.getShaderParameter(gl.vertexShader, gl.COMPILE_STATUS)) {
        // It didn't. Display the info log as to why
        alert("Failed to compile the vertex shader.\n" + gl.getShaderInfoLog(gl.vertexShader));
        return false;
    }

    // Create the shader program
    gl.programObject = gl.createProgram();

    // Attach the fragment and vertex shaders to it
    gl.attachShader(gl.programObject, gl.fragShader);
    gl.attachShader(gl.programObject, gl.vertexShader);

    // Bind the custom vertex attribute "myVertex" to location 0
    gl.bindAttribLocation(gl.programObject, 0, "myVertex");

    // Link the program
    gl.linkProgram(gl.programObject);

    // Check if linking succeeded in a similar way we checked for compilation errors
    if (!gl.getProgramParameter(gl.programObject, gl.LINK_STATUS)) {
        alert("Failed to link the program.\n" + gl.getProgramInfoLog(gl.programObject));
        return false;
    }

    /*	Use the Program
        Calling gl.useProgram tells WebGL that the application intends to use this program for rendering. Now that it's installed into
        the current state, any further gl.draw* calls will use the shaders contained within it to process scene data. Only one program can
        be active at once, so in a multi-program application this function would be called in the render loop. Since this application only
        uses one program it can be installed in the current state and left there.
    */
    gl.useProgram(gl.programObject);

    return testGLError("initialiseShaders");
}

function renderScene() {
    /*
        Set the clear colour
        At the start of a frame, generally you clear the image to tell WebGL that you're done with whatever was there before and want to
        draw a new frame. In order to do that gowever, WebGL needs to know what colour to set in the image's place. gl.clearColor
        sets this value as 4 floating point values between 0.0 and 1.0, as the Red, Green, Blue and Alpha channels. Each value represents
        the intensity of the particular channel, with all 0.0 being transparent black, and all 1.0 being opaque white. Subsequent calls to
        gl.clear with the colour bit will clear the framebuffer to this vlaue.
        The functions gl.clearDepth and gl.clearStencil allow an application to do the same with depth and stencil values respectively.
    */
    gl.clearColor(0.6, 0.8, 1.0, 1.0);

    /*
        Clear the colour buffer
        gl.clear is used here with the colour buffer to clear the colour. It can also be used to clear the depth or stencil buffer using
        gl.DEPTH_BUFFER_BIT or gl.STENCIL_BUFFER_BIT, respectively.
    */

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Get the location of the transformation matrix in the shader using its name
    var matrixLocation = gl.getUniformLocation(gl.programObject, "transformationMatrix");

    // Matrix used to specify the orientation of the triangle on screen
    var transformationMatrix = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];

    // Pass the identity transformation matrix to the shader using its location
    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, transformationMatrix);

    if (!testGLError("gl.uniformMatrix4fv")) {
        return false;
    }

    // Enable the user-defined vertex array
    gl.enableVertexAttribArray(0);

    // Set the vertex data to this attribute index, with the number of floats in each position
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);

    if (!testGLError("gl.vertexAttribPointer")) {
        return false;
    }

    /*
        Draw the triangle
        gl.drawArrays is a draw call, and executes the shader program using the vertices and other state set by the user. Draw calls are the
        functions which tell WebGL when to actually draw something to the framebuffer gived the current state.
        gl.drawArrays causes the vertices to be submitted sequentially from the position given by the "first" argument until it has processed
        "count" vertices. Other draw calls exist, notably gl.drawElements which also accepts index data to allow the user to specify that 
        some vertices are accessed multiple times, without copying the vertex multiple times.
        Others include versions of the above that allow the user to draw the same ovhect multiple times with slightly different data, and
        a version of gl.drawElements which allows a user to restrict the actuial indices accessed.
    */
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!testGLError("gl.drawArrays")) {
        return false;
    }

    return true;
}

function main() {
    var canvas = document.getElementById("helloapicanvas");

    if (!initialiseGL(canvas)) {
        return;
    }

    if (!initialiseBuffer()) {
        return;
    }

    if (!initialiseShaders()) {
        return;
    }

    // Render loop
    requestAnimFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
			function (callback) {
			    window.setTimeout(callback, 1000, 60);
			};
    })();

    (function renderLoop() {
        if (renderScene()) {
            // Everything was successful, request that we redraw our scene again in the future
            requestAnimFrame(renderLoop);
        }
    })();
}
