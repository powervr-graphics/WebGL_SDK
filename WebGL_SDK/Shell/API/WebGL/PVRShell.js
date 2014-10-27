// Insert our canvas element into the html code
document.write("<canvas id=\"surface\" style=\"border: none;\" width=\"800\" height=\"600\">Your browser doesn't appear to support the HTML5 <code>&lt;canvas&gt;</code> element.</canvas>");

// PVRShell "class"
var PVRShell = {
    // Internal data
    data : { width:800, height:600, fullscreen:false },

    getTimeNow: function()
    {
    	if (window.performance)
    	{
			if (window.performance.now)
				return window.performance.now()
			else if (window.performance.webkitNow)
				return window.performance.webkitNow()
			else if (window.performance.mozNow)
				return window.performance.mozNow()
			else if (window.performance.oNow)
				return window.performance.oNow()
			else
				return Date.now()
		}
		else
		{
			return Date.now()
		}
    },

    // define our "main" function
    main: function(demo)
    {
        // Utility function
        function parseBool(value)
        {
            if(value.toLowerCase() === 'true')
                return true;
            else if(parseInt(value, 10) !== 0)
                return true;

            return false;
        }

        // Based on http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
        requestAnimFrame = (function() {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
                function(callback){
                    window.setTimeout(callback, 1000, 60);
                };
        })();

        // Initialise the PVRShell data
        var canvas = document.getElementById("surface");
        var gl = null;
        var urlLine = [];
        var state = 0;
        var i;

        (function mainloop() {
            switch(state)
            {
                case 0: // Initialise app
                    // Parse "command-line"
                    urlLine = [];
                    var argIndex = window.location.href.indexOf('?');

                    if (argIndex > -1)
                    {
                        var arg;
                        var args = window.location.href.slice(argIndex + 1).split('&');
                        var argc = args.length;

                        for(i = 0; i < argc; i++)
                        {
                            arg = args[i].split('=');

                            // Add our arg name and value
                            urlLine[i]  = { name:arg[0], value:arg[1] };
                        }
                    }

                    // Call initApplication
                    if(demo.initApplication)
                    {
                        if(demo.initApplication() === false)
                        {
                            alert("initApplication failed");
                            return;
                        }
                    }

                    ++state;
                    requestAnimFrame(mainloop);
                break;
                case 1: // Initialise instance

                    // Apply our command-line
                    urlLineLength = urlLine.length;

                    for(i = 0; i < urlLineLength; ++i)
                    {
                        switch(urlLine[i].name.toLowerCase())
                        {
                            case "width":
                                PVRShell.data.width = parseInt(urlLine[i].value, 10);
                                break;
                            case "height":
                                PVRShell.data.height = parseInt(urlLine[i].value, 10);
                                break;
                            case "fullscreen":
                                PVRShell.data.fullscreen = parseBool(urlLine[i].value);
                                break;
                        }
                    }

                    if (PVRShell.data.fullscreen)
                    {
                        PVRShell.data.width  = window.innerWidth;
                        PVRShell.data.height = window.innerHeight;
                    }

                    // Setup our canvas dimensions
                    canvas.width  = PVRShell.data.width;
                    canvas.height = PVRShell.data.height;

                    // Initialise GL
                    try
                    {
                        // Update our canvas's dimensions
                        // Try to grab the standard context. If it fails, fallback to experimental
                        gl = canvas.getContext("webgl", {alpha: false}) || canvas.getContext("experimental-webgl", {alpha: false});
                        gl.viewport(0, 0, canvas.width, canvas.height);
                    }
                    catch (e)
                    {
                    }

                    if (!gl)
                    {
                        alert("Unable to initialise WebGL. Your browser may not support it");
                        return;
                    }

                    // Call InitView
                    if(demo.initView)
                    {
                        if(demo.initView(gl) === false)
                        {
                            alert("initView failed");
                            return;
                        }
                    }

                    ++state;
                    requestAnimFrame(mainloop);
                    break;
                case 2: // Render
                    requestAnimFrame(mainloop);
                    if(PVRShell.data.fullscreen)
                    {
                        PVRShell.data.width  = window.innerWidth;
                        PVRShell.data.height = window.innerHeight;
                        if(PVRShell.data.width != canvas.width || PVRShell.data.height != canvas.height)
                        {
                            canvas.width  = PVRShell.data.width;
                            canvas.height = PVRShell.data.height;
                        }
                    }
                    if (demo.renderScene)
                    {
                        if(demo.renderScene(gl) === false)
                        {
                            ++state;
                            break;
                        }
                    }
                    break;
                case 3: // Release view
                    // Call ReleaseView
                    if(demo.releaseView)
                    {
                        if(demo.releaseView(gl) === false)
                        {
                            alert("releaseView failed");
                            return;
                        }
                    }
                    ++state;
                    requestAnimFrame(mainloop);
                    break;
                case 4: // Quit application
                    if(demo.quitApplication)
                    {
                        if(demo.quitApplication() === false)
                        {
                            alert("quitApplication failed");
                            return;
                        }
                    }

                    ++state;
                    requestAnimFrame(mainloop);
                    break;
                default:
                    // Do nothing
                    break;
            }
        })();
    }
};
