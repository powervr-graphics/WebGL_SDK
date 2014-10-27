/*
	PVRShader
*/

PVRShader = {}

PVRShader.loadFromURI = function(gl, uri, type, defines, errorFunc, callback)
{
	function loaded()
	{
		var req = this;
		if(req.readyState == 4)
		{
			var shader = PVRShader.loadFromMemory(gl, req.responseText, type, defines, errorFunc);
			if(typeof callback == "function")
				callback(this.shader);			// Asynchronous
			else
				return shader;                  // Synchronous
		}
		else
		{
			errorFunc("Failed to load file: " + uri);
		}
	}

	var async   = (typeof callback == "function" ? true : false);
	var httpReq = new XMLHttpRequest();
	httpReq.open("GET", uri, async);
	if(async)
		httpReq.onreadystatechange = loaded;
	httpReq.send(null);

	if(!async)
	{
		return loaded.call(httpReq);
	}

	return null;
}

PVRShader.loadFromMemory = function(gl, source, type, defines, errorFunc)
{
	// Append defines, if any
	var processedSource = "";
	if (defines.length > 0)
	{
		// Check for the #version tag
		var versionRX = /\s*#\s*version\s*\d+\s*\w*/
		var ver       = source.match(versionRX);
		if (ver)
		{
			// The source contains a #version tag, and needs to be placed first.
			processedSource += ver + "\n";
			source = source.slice(ver.length);
		}

		for (var key in defines)
		{
			processedSource += "#define " + defines[key] + "\n";
		}
	}

	// Append the source to the definition string
	processedSource += source;

	// Create the shader object and compile
	var shader = gl.createShader(type);
	gl.shaderSource(shader, processedSource);
	gl.compileShader(shader);

	// Test if compilation was successful
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		var errorLog = gl.getShaderInfoLog(shader);
		if (typeof errorFunc == "function")
			errorFunc(errorLog);
		else
			throw new Error(errorLog);

		gl.deleteShader(shader);
		return null;
	}

	return shader
}

PVRShader.createProgram = function(gl, vertex, fragment, attribs, errorFunc)
{
	// Create the program and attach the shaders
	var program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);

	// Bind attributes
	for (var i = 0; i < attribs.length; i++)
	{
		gl.bindAttribLocation(program, i, attribs[i]);
	}

	// Link the program
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		var errorLog = gl.getProgramInfoLog(program);
		if (typeof errorFunc == "function")
			errorFunc(errorLog);
		else
			throw new Error(errorLog);

		gl.deleteProgram(program);
		return null;
	}

	// Make the program active
	gl.useProgram(program);

	return program;
}
