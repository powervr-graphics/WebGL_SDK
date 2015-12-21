/*
	PVRPrint3D
*/

EPVRPrint3D =
{
    Logo:
    {
        None :   0,
        PowerVR: 1,
    },
}

function PVRPrint3D()
{
    var INIT_PRINT3D_STATE   = 1;
    var DEINIT_PRINT3D_STATE = 2;
    var VERTEX_ARRAY = 0;
    var UV_ARRAY     = 1;
    var COLOR_ARRAY  = 2;

    var FONT_HEADER   = 0xFCFC0050;
    var FONT_CHARLIST = 0xFCFC0051;
    var FONT_RECTS    = 0xFCFC0052;
    var FONT_METRICS  = 0xFCFC0053;
    var FONT_YOFFSET  = 0xFCFC0054;
    var FONT_KERNING  = 0xFCFC0055;

    var MAX_RENDERABLE_LETTERS = 0xFFFF >> 2;
    var MAX_LETTERS            = 5120;
    var MIN_CACHED_VTX         = 0x1000;
    var MAX_CACHED_VTX         = 0x100000;
    var PRINT3D_VERSION        = 1;

    var INVALID_CHAR           = 0xFDFDFDFD;
    var DEFAULT_FONT_FILE      = "../../../../Tools/WebGL/Media/PVRPrint3DFont.pvr";
    var DEFAULT_LOGO_FILE      = "../../../../Tools/WebGL/Media/PVRPrint3DLogo.pvr"

    var PRINT3D_VERTEX_COMPONENTS = 9;
    var PRINT3D_VERTEX_SIZE       = 3*4 + 4*4 + 2*4;

    this.data =
    {
        logoToDisplay: EPVRPrint3D.Logo.PowerVR,
        screenScale: [],
        screenDim: [],
        texturesSet: false,
        usingProjection: false,
        dimensionsDirty: false,
        projectionMatrix: PVRMatrix4x4.identity(),
        modelViewMatrix: PVRMatrix4x4.identity(),

        fontFaces: null,

        APIData:
        {
            logoTexture: 0,
            logoVertexShader: 0,
            logoFragmentShader: 0,
            logoProgram: 0,
            logoMVP: -1,
        },
        APIState:
        {
        }
    }

    // Public methods
    this.resize = function(screenX, screenY)
    {
        this.data.screenDim[0] = screenX;
        this.data.screenDim[1] = screenY;
        this.data.dimensionsDirty = true;

        this.data.screenScale[0] = screenX / 640.0;
        this.data.screenScale[1] = screenY / 480.0;
    }

    this.setTextures = function(gl, screenX, screenY, textureFile)
    {
        this.resize(screenX, screenY);

        // Generate a table of filter methods
        this.data.NEAREST = gl.NEAREST;
        this.data.LINEAR  = gl.LINEAR;
        this.data.MIPMAP  = gl.LINEAR_MIPMAP_LINEAR;

        if(this.data.texturesSet)
            return true;

        this.data.fontFaces = new Uint16Array(MAX_RENDERABLE_LETTERS * 2 * 3);
        // Vertex indices for letters
        for(var i = 0; i < MAX_RENDERABLE_LETTERS; ++i)
        {
            this.data.fontFaces[i*6+0] = 0+i*4;
            this.data.fontFaces[i*6+1] = 3+i*4;
            this.data.fontFaces[i*6+2] = 1+i*4;
            this.data.fontFaces[i*6+3] = 3+i*4;
            this.data.fontFaces[i*6+4] = 0+i*4;
            this.data.fontFaces[i*6+5] = 2+i*4;
        }

        if(!initialiseAPI(gl, this.data.APIData, this.data.screenDim))
            return false;

        var textureData = DEFAULT_FONT_FILE;
        if(textureFile != undefined && textureFile != null)
            textureData = textureFile;

        // Load the font texture
        (function(print3D)
        {
            PVRTexture.loadFromURI(gl, textureData, 0,
                function(gl, textureID, header, metaData)
                {
                    print3D.data.APIData.fontTexture = textureID;
                    loadFontData(header, metaData, print3D.data);
                    print3D.data.texturesSet = true;
                });
        })(this);

        // Load the icon texture
        (function(print3D)
        {
            PVRTexture.loadFromURI(gl, DEFAULT_LOGO_FILE, 0,
                function(gl, textureID, header, metaData)
                {
			       	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    print3D.data.APIData.logoTexture = textureID;
                });
        })(this);

        this.data.VtxCacheMax = MIN_CACHED_VTX;
        this.data.VtxCache    = [];
    }

    this.setProjection = function(projectionMatrix)
    {
        this.data.projectionMatrix = projectionMatrix;
        this.data.usingProjection  = true;
    }

    this.setModelView = function(modelViewMatrix)
    {
        this.data.modelViewMatrix = modelViewMatrix;
    }

    this.measureText = function(scale, text)
    {
        var ret = {};
        ret.width  = 0;
        ret.height = 0;

        if(text.length == 0)
            return;

        var length = 0;
        var maxLength = -1;
        var maxHeight = this.data.header.lineSpace;
        var idx;
        for(var charIdx = 0; charIdx < text.length; ++charIdx)
        {
            var c = text.charCodeAt(charIdx);
            if(c == 0x0D || c == 0x0A)
            {
                if(length > maxLength)
                    maxLength = length;

                length = 0;
                maxHeight += this.data.header.lineSpace;
            }
            idx = findCharacter(c, this.data);
            if(idx == INVALID_CHAR)
            {
                length += this.data.header.spaceWidth;
                continue;
            }

            var kernOffset = 0;
            if(charIdx < text.length - 1)
            {
                var c2   = text.charCodeAt(charIdx + 1);
                kernOffset = applyKerning(c, c2, this.data);

                length += this.data.charMetrics[idx].advance + kernOffset;
            }
        }

        if(maxLength < 0.0)
            maxLength = length;

        ret.width = maxLength * scale;
        ret.height = maxHeight * scale;

        return ret;
    }

    this.print3D = function(x, y, scale, colour, string)
    {
        if(this.data.previousString != string || this.data.previousX != x || this.data.previousY != y || this.data.previousScale != scale || this.data.previousColour != colour)
        {
            if(this.data.texturesSet == false)
                return;

            this.data.previousString = string;
            this.data.previousX = x;
            this.data.previousY = y;
            this.data.previousScale = scale;
            this.data.previousColour = colour;

            this.data.cachedUnicode = [];
            for(var i = 0; i < string.length; ++i)
            {
                this.data.cachedUnicode[i] = string.charCodeAt(i);
            }
        }

        // Adjust input parameters
        if(!this.data.usingProjection)
        {
            x =   x * (640.0/100.0);
            y = -(y * (480.0/100.0));
        }

        // Fill the vertex buffer
        this.data.numCachedVerts = updateLine(0.0, x, y, scale, colour, this.data);

        // Draw
        drawLine(this.data);
    }

    this.displayDefaultTitle = function(title, description, logo)
    {
        if(!this.data.texturesSet)
            return;

        if(title != null)
        {
            this.print3D(0.0, -1.0, 1.0, 0xFFFFFFFF, title);
        }

        if(description != null)
        {
            var yVal = this.data.screenScale[1] * 480.0;
            var y    = this.data.header.lineSpace / (480.0 / 100.0) * (320.0 / yVal);
            this.print3D(0.0, y, 0.8, 0xFFFFFFFF, description);
        }

        this.data.logoToDisplay = logo;
    }

    this.flush = function(gl)
    {
        if(this.data.texturesSet == false)
            return;

        setRenderState(INIT_PRINT3D_STATE, this.data.APIState, gl);

        if(this.data.VtxCache.length > 0)
        {
            var w = this.data.screenScale[0] * 640.0;
            var h = this.data.screenScale[1] * 480.0;

            var mxOrtho = PVRMatrix4x4.createOrthographicProjection(0.0, 0.0, w, -h, -1.0, 1.0);
            var mProj   = this.data.usingProjection ? this.data.projectionMatrix : mxOrtho;
            var mMVP    = PVRMatrix4x4.matrixMultiply(mProj, this.data.modelViewMatrix);

            gl.useProgram(this.data.APIData.fontProgram);
            gl.uniformMatrix4fv(this.data.APIData.fontMVP, gl.FALSE, mMVP.data);
            this.data.usingProjection = false;

            // Upload font data to VBO and IBO
            var arrayBufferAsFloat  = new Float32Array(this.data.VtxCache);
            var indexBufferAsUint16 = new Uint16Array(this.data.fontFaces);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.data.APIData.fontVBO);
            gl.bufferData(gl.ARRAY_BUFFER, arrayBufferAsFloat, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.data.APIData.fontIBO);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferAsUint16, gl.DYNAMIC_DRAW);

            gl.enableVertexAttribArray(VERTEX_ARRAY);
            gl.enableVertexAttribArray(COLOR_ARRAY);
            gl.enableVertexAttribArray(UV_ARRAY);

            gl.bindTexture(gl.TEXTURE_2D, this.data.APIData.fontTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.data.filterMin);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.data.filterMag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            var totalVerts = this.data.VtxCache.length / PRINT3D_VERTEX_COMPONENTS;
            var trisTotal = totalVerts >> 1; // ??
            var VtxBase   = 0;
            var vertsLeft = totalVerts;
            while(vertsLeft > 0)
            {
                var nVtx  = Math.min(totalVerts, 0xFFFC);
                var nTris = nVtx >> 1;

                // Draw triangles
                var posSize = 3*4;
                var colSize = 4*4;
                var uvSize  = 2*4;
                gl.vertexAttribPointer(VERTEX_ARRAY, 3, gl.FLOAT, gl.FALSE, PRINT3D_VERTEX_SIZE, VtxBase);
                gl.vertexAttribPointer(COLOR_ARRAY,  4, gl.FLOAT, gl.FALSE, PRINT3D_VERTEX_SIZE, VtxBase+posSize);
                gl.vertexAttribPointer(UV_ARRAY,     2, gl.FLOAT, gl.FALSE, PRINT3D_VERTEX_SIZE, VtxBase+posSize+colSize);

                gl.drawElements(gl.TRIANGLES, nTris * 3, gl.UNSIGNED_SHORT, 0);

                VtxBase += nVtx;
                vertsLeft -= nVtx;
            }

            gl.disableVertexAttribArray(VERTEX_ARRAY);
            gl.disableVertexAttribArray(COLOR_ARRAY);
            gl.disableVertexAttribArray(UV_ARRAY);

            this.data.VtxCache = [];
        }

        if(this.data.logoToDisplay != EPVRPrint3D.Logo.None)
        {
            drawLogo(gl, this.data);
        }

        setRenderState(DEINIT_PRINT3D_STATE, this.data.APIState, gl);
    }

    // Private methods
    var updateLine = function(z, x, y, scale, colour, data)
    {
        if(data.cachedUnicode.length == 0)
            return 0;

        if(!data.usingProjection)
	    {
		    x *= (data.screenDim[0] / 640.0);
		    y *= (data.screenDim[1] / 480.0);
	    }

        y -= data.header.ascent * scale;

        var preX = x;

        var kernOffset;
        var advOffset;
        var yOffset;
        var vertexCount = 0;
        var nextChar;

        data.fontVertices = [];

        var charsInString = data.cachedUnicode.length;
        for(var idx = 0; idx < charsInString; ++idx)
        {
            if(idx > MAX_LETTERS)
                break;

            // Newline
            if(data.cachedUnicode[idx] == 0x0A)
            {
                x = preX;
                y -= data.header.lineSace * scale;
            }

            var index = findCharacter(data.cachedUnicode[idx], data);

            // Not found
            if(index == INVALID_CHAR)
            {
                x += data.header.spaceWidth * scale;
                continue;
            }

            kernOffset = 0;
            yOffset    = data.YOffsets[index] * scale;
            advOffset  = data.charMetrics[index].XOffset * scale;
            if(idx < charsInString - 1)
            {
                nextChar = data.cachedUnicode[idx + 1];
                kernOffset = applyKerning(data.cachedUnicode[idx], nextChar, data);
            }

            // Fill vertex data
            var vertexIndex = vertexCount * PRINT3D_VERTEX_COMPONENTS;
            data.fontVertices[vertexIndex+0]	= x + advOffset;
            data.fontVertices[vertexIndex+1]	= y + yOffset;
            data.fontVertices[vertexIndex+2]	= z;
            data.fontVertices[vertexIndex+6]	= ((colour >> 24) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+5]	= ((colour >> 16) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+4]	= ((colour >> 8)  & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+3]	= ((colour)       & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+7]	= data.UVs[index].UL;
            data.fontVertices[vertexIndex+8]	= data.UVs[index].VT;
            vertexIndex += PRINT3D_VERTEX_COMPONENTS;

            data.fontVertices[vertexIndex+0]	= x + advOffset + (data.rects[index].w * scale);
            data.fontVertices[vertexIndex+1]	= y + yOffset;
            data.fontVertices[vertexIndex+2]	= z;
            data.fontVertices[vertexIndex+6]	= ((colour >> 24) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+5]	= ((colour >> 16) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+4]	= ((colour >> 8)  & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+3]	= ((colour)       & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+7]	= data.UVs[index].UR;
            data.fontVertices[vertexIndex+8]	= data.UVs[index].VT;
            vertexIndex += PRINT3D_VERTEX_COMPONENTS;

            data.fontVertices[vertexIndex+0]	= x + advOffset;
            data.fontVertices[vertexIndex+1]	= y + yOffset - (data.rects[index].h * scale);
            data.fontVertices[vertexIndex+2]	= z;
            data.fontVertices[vertexIndex+6]	= ((colour >> 24) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+5]	= ((colour >> 16) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+4]	= ((colour >> 8)  & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+3]	= ((colour)       & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+7]	= data.UVs[index].UL;
            data.fontVertices[vertexIndex+8]	= data.UVs[index].VB;
            vertexIndex += PRINT3D_VERTEX_COMPONENTS;

            data.fontVertices[vertexIndex+0]	= x + advOffset + (data.rects[index].w * scale);
            data.fontVertices[vertexIndex+1]	= y + yOffset - (data.rects[index].h * scale);
            data.fontVertices[vertexIndex+2]	= z;
            data.fontVertices[vertexIndex+6]	= ((colour >> 24) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+5]	= ((colour >> 16) & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+4]	= ((colour >> 8)  & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+3]	= ((colour)       & 0xFF) / 255.0;
            data.fontVertices[vertexIndex+7]	= data.UVs[index].UR;
            data.fontVertices[vertexIndex+8]	= data.UVs[index].VB;
            vertexIndex += PRINT3D_VERTEX_COMPONENTS;

            vertexCount += 4;

            x = x + (data.charMetrics[index].advance + kernOffset) * scale; // Add on this characters width
        }

        return vertexCount;
    }

    var drawLine = function(data)
    {
        if(data.numCachedVerts == 0)
            return;

        data.VtxCache = data.VtxCache.concat(data.fontVertices);
    }

    var findCharacter = function(character, data)
    {
        var idx = data.characterList.indexOf(character);
        if(idx == -1)
            return INVALID_CHAR;

        return idx;
    }

    var applyKerning = function(charA, charB, data)
    {
        // Find the pair
        for(var i = 0; i < data.kerningPairs.length; ++i)
        {
            var kPair = data.kerningPairs[i];
            if(kPair.pairA == charA && kPair.pairB == charB)
                return kPair.offset;
        }

        return 0;
    }

    var loadFontData = function(header, metaData, data)
    {
        data.texW = header.width;
        data.texH = header.height;
        data.hasMIPMaps = header.MIPMapCount > 1 ? true : false;
        if(data.hasMIPMaps)
        {
            data.filterMin = data.MIPMAP;
            data.filterMag = data.LINEAR;
        }
        else
        {
            data.filterMin = data.LINEAR;
            data.filterMag = data.LINEAR;
        }

        // Header
        var headerData    = new DataView(metaData[PVRTexture.PVRTEX3_IDENT][FONT_HEADER].data);
        var print3DHeader = new Object();
        print3DHeader.version    = headerData.getUint8(0);
        print3DHeader.spaceWidth = headerData.getUint8(1);

        print3DHeader.numCharacters   = headerData.getInt16(2, true);
        print3DHeader.numKerningPairs = headerData.getInt16(4, true);
        print3DHeader.ascent          = headerData.getInt16(6, true);
        print3DHeader.lineSpace       = headerData.getInt16(8, true);
        print3DHeader.borderWidth     = headerData.getInt16(10, true);

        if(print3DHeader.version != PRINT3D_VERSION)
            return;

        // Font data
        var characterListData   = new DataView(metaData[PVRTexture.PVRTEX3_IDENT][FONT_CHARLIST].data);
        var YOffsetData         = new DataView(metaData[PVRTexture.PVRTEX3_IDENT][FONT_YOFFSET].data);
        var characterMetricData = new DataView(metaData[PVRTexture.PVRTEX3_IDENT][FONT_METRICS].data);
        var rectangleData       = new DataView(metaData[PVRTexture.PVRTEX3_IDENT][FONT_RECTS].data);
        var kerningPairData     = null;
        if(FONT_KERNING in metaData[PVRTexture.PVRTEX3_IDENT])
            kerningPairData = new DataView(metaData[PVRTexture.PVRTEX3_IDENT][FONT_KERNING].data);

        data.header = print3DHeader;

        data.characterList = [];
        for(var i = 0, bytes = 0; bytes < metaData[PVRTexture.PVRTEX3_IDENT][FONT_CHARLIST].dataSize; bytes+=4, ++i)
        {
            data.characterList[i] = characterListData.getUint32(bytes, true);
        }

        data.YOffsets = [];
        for(var i = 0, bytes = 0; bytes < metaData[PVRTexture.PVRTEX3_IDENT][FONT_YOFFSET].dataSize; bytes+=4, ++i)
        {
            data.YOffsets[i] = YOffsetData.getUint32(bytes, true);
        }

        data.charMetrics = [];
        for(var i = 0, bytes = 0; bytes < metaData[PVRTexture.PVRTEX3_IDENT][FONT_METRICS].dataSize; bytes+=4, ++i)
        {
            data.charMetrics[i] = new Object();
            data.charMetrics[i].XOffset = characterMetricData.getInt16(bytes, true);
            data.charMetrics[i].advance = characterMetricData.getUint16(bytes+2, true);
        }

        data.kerningPairs = [];
        if(kerningPairData != null)
        {
            for(var i = 0, bytes = 0; bytes < metaData[PVRTexture.PVRTEX3_IDENT][FONT_KERNING].dataSize; bytes+=12, ++i)
            {
                data.kerningPairs[i] = new Object();
                data.kerningPairs[i].pairA = kerningPairData.getUint32(bytes, true);
                data.kerningPairs[i].pairB = kerningPairData.getUint32(bytes+4, true);
                data.kerningPairs[i].offset = kerningPairData.getInt32(bytes+8, true);
            }
        }

        data.rects = [];
        for(var i = 0, bytes = 0; bytes < metaData[PVRTexture.PVRTEX3_IDENT][FONT_RECTS].dataSize; bytes+=16, ++i)
        {
            data.rects[i] = new Object();
            data.rects[i].x = rectangleData.getInt32(bytes, true);
            data.rects[i].y = rectangleData.getInt32(bytes+4, true);
            data.rects[i].w = rectangleData.getInt32(bytes+8, true);
            data.rects[i].h = rectangleData.getInt32(bytes+12, true);
        }

        // Build UVs
        data.UVs = [];
        for(var i = 0; i < print3DHeader.numCharacters; ++i)
        {
            data.UVs[i] = new Object();
            data.UVs[i].UL = data.rects[i].x / data.texW;
            data.UVs[i].UR = data.UVs[i].UL + data.rects[i].w / data.texW;
            data.UVs[i].VT = data.rects[i].y / data.texH;
            data.UVs[i].VB = data.UVs[i].VT + data.rects[i].h / data.texH;
        }
    }

    var initialiseAPI = function(gl, APIData, screenDim)
    {
        var logoFragmentSource =
            "uniform sampler2D\tsampler2d;\n" +
            "\n" +
            "varying mediump vec2\ttexCoord;\n" +
            "\n" +
            "void main()\n" +
            "{\n" +
            "\tgl_FragColor = texture2D(sampler2d, texCoord);\n" +
            "}\n";

        var logoVertexSource =
            "attribute highp vec4\tmyVertex;\n" +
            "attribute mediump vec2\tmyUV;\n" +
            "\n" +
            "uniform highp mat4\t\tmyMVPMatrix;\n" +
            "\n" +
            "varying mediump vec2\ttexCoord;\n" +
            "\n" +
            "void main()\n" +
            "{\n" +
            "\tgl_Position = myMVPMatrix * myVertex;\n" +
            "\ttexCoord = myUV.st;\n" +
            "}\n";

        var fontFragmentSource =
            "uniform sampler2D\tsampler2d;\n" +
            "\n" +
            "varying lowp vec4\t\tvarColour;\n" +
            "varying mediump vec2\ttexCoord;\n" +
            "\n" +
            "void main()\n" +
            "{\n" +
            "\tlowp vec4 vTex = texture2D(sampler2d, texCoord);\n" +
            "\tgl_FragColor = vec4(varColour.rgb * vTex.r, varColour.a * vTex.a);\n" +
            "}\n";


        var fontVertexSource =
            "attribute highp vec4\tmyVertex;\n" +
            "attribute mediump vec2\tmyUV;\n" +
            "attribute lowp vec4\t\tmyColour;\n" +
            "\n" +
            "uniform highp mat4\t\tmyMVPMatrix;\n" +
            "\n" +
            "varying lowp vec4\t\tvarColour;\n" +
            "varying mediump vec2\ttexCoord;\n" +
            "\n" +
            "void main()\n" +
            "{\n" +
            "\tgl_Position = myMVPMatrix * myVertex;\n" +
            "\ttexCoord = myUV.st;\n" +
            "\tvarColour = myColour;\n" +
            "}\n";

        // Logo data
        {
            APIData.logoVertexShader = PVRShader.loadFromMemory(gl, logoVertexSource, gl.VERTEX_SHADER, [], function(e){ alert(e); });
            if(!APIData.logoVertexShader)
                return false;

            APIData.logoFragmentShader = PVRShader.loadFromMemory(gl, logoFragmentSource, gl.FRAGMENT_SHADER, [], function(e){ alert(e); });
            if(!APIData.logoFragmentShader)
                return false;

            var currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
            var boundBuffer    = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

            // Create the program
            var attribs = ["myVertex", "myUV"];
            APIData.logoProgram = PVRShader.createProgram(gl, APIData.logoVertexShader, APIData.logoFragmentShader, attribs, function(e) { alert(e); });
            if(!APIData.logoProgram)
                return false;

            // Retrieve uniforms
            APIData.logoMVP = gl.getUniformLocation(APIData.logoProgram, "myMVPMatrix");
            gl.uniform1i(gl.getUniformLocation(APIData.logoProgram, "sampler2d"), 0);

            // Gen a VBO
            APIData.logoVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, APIData.logoVBO);
            gl.bufferData(gl.ARRAY_BUFFER, 4*5*4, gl.DYNAMIC_DRAW); // 4 vertices, 5 components, 4 bytes per component.

            // Reset renderstate
            gl.bindBuffer(gl.ARRAY_BUFFER, boundBuffer);
            gl.useProgram(currentProgram);
        }

        // Font data
        {
            APIData.fontVertexShader = PVRShader.loadFromMemory(gl, fontVertexSource, gl.VERTEX_SHADER, [], function(e){ alert(e); });
            if(!APIData.fontVertexShader)
                return false;

            APIData.fontFragmentShader = PVRShader.loadFromMemory(gl, fontFragmentSource, gl.FRAGMENT_SHADER, [], function(e){ alert(e); });
            if(!APIData.fontFragmentShader)
                return false;

            var currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
            var boundBuffer    = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

            // Create the program
            var attribs = ["myVertex", "myUV", "myColour"];
            APIData.fontProgram = PVRShader.createProgram(gl, APIData.fontVertexShader, APIData.fontFragmentShader, attribs, function(e) { alert(e); });
            if(!APIData.fontProgram)
                return false;

            // Retrieve uniforms
            APIData.fontMVP = gl.getUniformLocation(APIData.fontProgram, "myMVPMatrix");
            gl.uniform1i(gl.getUniformLocation(APIData.fontProgram, "sampler2d"), 0);

            // Gen a VBO
            APIData.fontVBO = gl.createBuffer();
            APIData.fontIBO = gl.createBuffer();

            // Reset renderstate
            gl.bindBuffer(gl.ARRAY_BUFFER, boundBuffer);
            gl.useProgram(currentProgram);
        }
		return true;
    }

    var setRenderState = function(mode, APIState, gl)
    {
        switch(mode)
        {
            case INIT_PRINT3D_STATE:
                {
                    APIState.isCullFaceEnabled  = gl.getParameter(gl.CULL_FACE);
                    APIState.isBlendEnabled     = gl.getParameter(gl.BLEND);
                    APIState.isDepthTestEnabled = gl.getParameter(gl.DEPTH_TEST);
                    APIState.eFrontFace         = gl.getParameter(gl.FRONT_FACE);
                    APIState.eCullFaceMode      = gl.getParameter(gl.CULL_FACE_MODE);
                    APIState.arrayBufferBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
                    APIState.currentProgram     = gl.getParameter(gl.CURRENT_PROGRAM);
                    APIState.textureBinding     = gl.getParameter(gl.TEXTURE_BINDING_2D);

                    /******************************
                     ** SET PRINT3D RENDER STATES **
                     ******************************/

                    // Culling
                    gl.frontFace(gl.CCW);
                    gl.cullFace(gl.BACK);
                    gl.enable(gl.CULL_FACE);

                    // Set blending mode
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

                    // Set Z compare properties
                    gl.disable(gl.DEPTH_TEST);

                    // Set the default gl.ARRAY_BUFFER
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);

                    // texture
                    gl.activeTexture(gl.TEXTURE0);
                    break;
                }
            case DEINIT_PRINT3D_STATE:
                // Restore some values
                if (!APIState.isCullFaceEnabled)
                    gl.disable(gl.CULL_FACE);
                if (!APIState.isBlendEnabled)
                    gl.disable(gl.BLEND);
                if (APIState.isDepthTestEnabled)
                    gl.enable(gl.DEPTH_TEST);

                gl.cullFace(APIState.eCullFaceMode);
                gl.frontFace(APIState.eFrontFace);
                gl.bindBuffer(gl.ARRAY_BUFFER, APIState.arrayBufferBinding);
                gl.bindTexture(gl.TEXTURE_2D, APIState.textureBinding2D);
                gl.useProgram(APIState.currentProgram); // Unset print3ds program
                break;
        }
    }

    var drawLogo = function(gl, data)
    {
        var tex    = 0;
        var fScale = 1.0;

        var fLogoXSizeHalf = (128.0 / data.screenDim[0]);
        var fLogoYSizeHalf = (64.0 / data.screenDim[1]);

        var fLogoXShift = 0.035 / fScale;
        var fLogoYShift = 0.035 / fScale;

        var fLogoSizeXHalfShifted = fLogoXSizeHalf + fLogoXShift;
        var fLogoSizeYHalfShifted = fLogoYSizeHalf + fLogoYShift;

        // Matrices
        var matModelView = PVRMatrix4x4.identity();
        var matTransform = PVRMatrix4x4.scale(fScale, fScale, 1.0);
        matModelView = PVRMatrix4x4.multiply(matModelView, matTransform);

        var nXPos =  1;
        var nYPos = -1;
        matTransform = PVRMatrix4x4.translation(nXPos - (fLogoSizeXHalfShifted * fScale * nXPos), nYPos - (fLogoSizeYHalfShifted * fScale * nYPos), 0.0);
        matModelView = PVRMatrix4x4.matrixMultiply(matTransform, matModelView);

        gl.useProgram(data.APIData.logoProgram);

        // Bind the model-view-projection to the shader
        gl.uniformMatrix4fv(data.APIData.logoMVP, gl.FALSE, matModelView.data);

        // Render states
        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, data.APIData.logoTexture);

        // Vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, data.APIData.logoVBO);

        if(data.dimensionsDirty)
        {
            var fLogoXSizeHalf = (128.0 / data.screenDim[0]);
            var fLogoYSizeHalf = (64.0  / data.screenDim[1]);

            var logoVertices =
                [
                //  X Position_______Y Positon________Z Position___UV S__UV T
                -fLogoXSizeHalf,     fLogoYSizeHalf , 0.5,         0.0,  0.0,
                -fLogoXSizeHalf,    -fLogoYSizeHalf,  0.5,         0.0,  1.0,
                fLogoXSizeHalf,      fLogoYSizeHalf , 0.5,         1.0,  0.0,
                fLogoXSizeHalf,     -fLogoYSizeHalf,  0.5,         1.0,  1.0,
                ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(logoVertices), gl.DYNAMIC_DRAW);
            data.dimensionsDirty = false;
        }

        gl.enableVertexAttribArray(VERTEX_ARRAY);
        gl.enableVertexAttribArray(UV_ARRAY);

        var stride = 3*4 + 2*4;

        gl.vertexAttribPointer(VERTEX_ARRAY, 3, gl.FLOAT, gl.FALSE, stride, 0);
        gl.vertexAttribPointer(UV_ARRAY, 2, gl.FLOAT, gl.FALSE, stride, 3*4);

        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

        gl.disableVertexAttribArray(VERTEX_ARRAY);
        gl.disableVertexAttribArray(UV_ARRAY);
    }
}

