/*
	PVRTexture
*/

PVRTextureHeader = function()
{
    this.version = 0x03525650;
    this.flags = 0;
    this.pixelFormatH = 0;
    this.pixelFormatL = 0;
    this.colourSpace = 0;
    this.channelType = 0;
    this.height = 1;
    this.width = 1;
    this.depth = 1;
    this.numSurfaces = 1;
    this.numFaces = 1;
    this.MIPMapCount = 1;
    this.metaDataSize = 0;
}

EPVRTexture =
{
    ChannelTypes:
    {
        UnsignedByteNorm : 0,
        SignedByteNorm : 1,
        UnsignedByte : 2,
        SignedByte: 3,
        UnsignedShortNorm: 4,
        SignedShortNorm: 5,
        UnsignedShort: 6,
        SignedShort: 7,
        UnsignedIntegerNorm: 8,
        SignedIntegerNorm: 9,
        UnsignedInteger: 10,
        SignedInteger: 11,
        SignedFloat: 12,
        Float: 12, //the name Float is now deprecated.
        UnsignedFloat: 13,
    }
}

PVRTexture =
{
    PVRTEX3_IDENT: 0x03525650,
}

PVRTexture.genPixelTypeH = function(c1Name, c2Name, c3Name, c4Name)
{
    var val = 0;
    val |= c1Name.charCodeAt();

    if(c2Name != undefined)
        val |= c2Name.charCodeAt() << 8;

    if(c3Name != undefined)
        val |= c3Name.charCodeAt() << 16;

    if(c4Name != undefined)
        val |= c4Name.charCodeAt() << 24;

    return val;
}

PVRTexture.genPixelTypeL = function(c1Bits, c2Bits, c3Bits, c4Bits)
{
    var val = 0;
    val |= c1Bits;

    if(c2Bits != undefined)
        val |= c2Bits << 8;

    if(c3Bits != undefined)
        val |= c3Bits << 16;

    if(c4Bits != undefined)
        val |= c4Bits << 24;

    return val;
}

PVRTexture.getTextureFormat = function(gl, header)
{
    var ret = {};
    ret.format = 0;
    ret.type   = 0;
    ret.internalFormat = 0;

    if(header.pixelFormatH == 0 )
    {
        // TODO: Compressed texture support.
        return;
    }

    switch(header.channelType)
    {
        case EPVRTexture.ChannelTypes.Float:
        {
            // TODO: Add support.
            return;
        }
        case EPVRTexture.ChannelTypes.UnsignedByteNorm:
        {
            ret.type = gl.UNSIGNED_BYTE;
            switch(header.pixelFormatL)
            {
                case PVRTexture.genPixelTypeL(8,8,8,8):
                    if(header.pixelFormatH == PVRTexture.genPixelTypeH('r', 'g', 'b', 'a'))
                        ret.format = ret.internalFormat = gl.RGBA;
                    else
                        ret.format = ret.internalFormat = gl.BGRA;
                    break;
                case PVRTexture.genPixelTypeL(8,8,8):
                    ret.format = ret.internalFormat = gl.RGB;
                    break;
                case PVRTexture.genPixelTypeL(8,8):
                    ret.format = ret.internalFormat = gl.LUMINANCE_ALPHA;
                    break;
                case PVRTexture.genPixelTypeL(8):
                    if(header.pixelFormatH == PVRTexture.genPixelTypeH('l'))
                        ret.format = ret.internalFormat = gl.LUMINANCE;
                    else
                        ret.format = ret.internalFormat = gl.ALPHA;
                    break;
            }
        }
        case EPVRTexture.ChannelTypes.UnsignedShortNorm:
        {
            switch(header.pixelFormatL)
            {
                case PVRTexture.genPixelTypeL(4,4,4,4):
                    ret.type = gl.UNSIGNED_SHORT_4_4_4_4;
                    ret.format = ret.internalFormat = gl.BGRA;
                    break;
                case PVRTexture.genPixelTypeL(5,5,5,1):
                    ret.type = gl.UNSIGNED_SHORT_5_5_5_1;
                    ret.format = ret.internalFormat = gl.RGBA;
                    break;
                case PVRTexture.genPixelTypeL(5,6,5):
                    ret.type = gl.UNSIGNED_SHORT_5_6_5;
                    ret.format = ret.internalFormat = gl.RGB;
                    break;
            }
        }
    }

    return ret;
}

PVRTexture.getBitsPerPixel = function(header)
{
    if(header.pixelFormatH != 0)
    {
        var lowPart = header.pixelFormatL;
        var c1Bits  = (lowPart >> 24) & 0xFF;
        var c2Bits  = (lowPart >> 16) & 0xFF;
        var c3Bits  = (lowPart >> 8)  & 0xFF;
        var c4Bits  = lowPart & 0xFF;
        return c1Bits + c2Bits + c3Bits + c4Bits;
    }

    // TODO: Compressed texture support.

    return 0;
}

PVRTexture.getDataSize = function(header, MIPLevel, allSurfaces, allFaces)
{
    var smallestWidth = 1;
    var smallestHeight = 1;
    var smallestDepth = 1;

    var pixelFormatH = header.pixelFormatH;

    if(pixelFormatH == 0)
    {
        // TODO: Handle compressed textures.
        PVRTexture.getFormatMinDims(header);
    }

    var dataSize = 0;
    if(MIPLevel == -1)
    {
        for(var currentMIP = 0; currentMIP < header.MIPMapCount; ++currentMIP)
        {
            var width = Math.max(1, header.width>>currentMIP);
            var height = Math.max(1, header.height>>currentMIP);
            var depth = Math.max(1, header.depth>>currentMIP);

            if(header.pixelFormatH == 0)
            {
                // Pad the dimensions if the texture is compressed
                width = width + ((-1*width)%smallestWidth);
                height = height + ((-1*height)%smallestHeight);
                depth = depth + ((-1*depth)%smallestDepth);
            }

            // Add the current MIP map's data size
            dataSize += PVRTexture.getBitsPerPixel(header) * width * height * depth;
        }
    }
    else
    {
        var width = Math.max(1, header.width>>MIPLevel);
        var height = Math.max(1, header.height>>MIPLevel);
        var depth = Math.max(1, header.depth>>MIPLevel);

        if(header.pixelFormatH == 0)
        {
            // Pad the dimensions if the texture is compressed
            width = width + ((-1*width)%smallestWidth);
            height = height + ((-1*height)%smallestHeight);
            depth = depth + ((-1*depth)%smallestDepth);
        }

        // Add the current MIP map's data size
        dataSize += PVRTexture.getBitsPerPixel(header) * width * height * depth;
    }

    var numFaces = (allFaces ? header.numFaces : 1);
    var numSurfs = (allSurfaces ? header.numSurfaces : 1);

    return (dataSize/8) * numSurfs * numFaces;
}

PVRTexture.loadFromURI = function(gl, uri, loadFromLevel, callback)
{
    var fs = new PVRFileStream();
    var args = [uri, true, PVRTexture.loadFromMemory, gl, null, loadFromLevel, null, callback];
    args = args.concat(Array.prototype.slice.call(arguments, 4));
    fs.Open.apply(fs, args);
}

PVRTexture.loadFromMemory = function(stream, gl, header, loadFromLevel, metaData, callback)
{
    var pvrHeader = new PVRTextureHeader();
    var pvrMetaData = new Object();
    pvrHeader.version = stream.ReadUInt32();

    if(pvrHeader.version != PVRTexture.PVRTEX3_IDENT)
    {
        return false;
    }

    pvrHeader.flags        = stream.ReadUInt32();
    pvrHeader.pixelFormatH = stream.ReadUInt32();
    pvrHeader.pixelFormatL = stream.ReadUInt32();
    pvrHeader.colourSpace  = stream.ReadUInt32();
    pvrHeader.channelType  = stream.ReadUInt32();
    pvrHeader.height       = stream.ReadUInt32();
    pvrHeader.width        = stream.ReadUInt32();
    pvrHeader.depth        = stream.ReadUInt32();
    pvrHeader.numSurfaces  = stream.ReadUInt32();
    pvrHeader.numFaces     = stream.ReadUInt32();
    pvrHeader.MIPMapCount  = stream.ReadUInt32();
    pvrHeader.metaDataSize = stream.ReadUInt32();

    //Get the meta data.
    var metaDataSize = 0;
    while(metaDataSize < pvrHeader.metaDataSize)
    {
        var devFourCC = stream.ReadUInt32();
        metaDataSize += 4;

        var key = stream.ReadUInt32();
        metaDataSize += 4;

        var dataSize = stream.ReadUInt32();
        metaDataSize += 4;

        if(!(devFourCC in pvrMetaData))
            pvrMetaData[devFourCC] = new Object();

        pvrMetaData[devFourCC][key] = new Object();
        var currentData = pvrMetaData[devFourCC][key];
        currentData.devFourCC = devFourCC;
        currentData.key = key;
        currentData.dataSize = dataSize;

        if(dataSize > 0)
        {
            currentData.data = stream.ReadArrayBuffer(dataSize);
            metaDataSize += dataSize;
        }
    }

    var ret = PVRTexture.getTextureFormat(gl, pvrHeader);
    var textureFormat         = ret.format;
    var textureInternalFormat = ret.internalFormat;
    var textureType           = ret.type;

    if(textureInternalFormat == 0)
        return false;

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    var textureID = gl.createTexture();
    var target    = gl.TEXTURE_2D;

    if(pvrHeader.numFaces > 1)
    {
        target = gl.TEXTURE_CUBE_MAP;
    }

    if(pvrHeader.numSurfaces > 1)
    {
        return false;
    }

    gl.bindTexture(target, textureID);

    var currentMIPSize = 0;

    // Loop through the faces
    if(pvrHeader.numFaces > 1)
        target = gl.TEXTURE_CUBE_MAP_POSITIVE_X;

    var MIPWidth = pvrHeader.width;
    var MIPHeight = pvrHeader.height;

    for(var MIPLevel = 0; MIPLevel < pvrHeader.MIPMapCount; ++MIPLevel)
    {
        currentMIPSize = PVRTexture.getDataSize(pvrHeader, MIPLevel, false, false);
        var eTextureTarget = target;

        for(var face = 0; face < pvrHeader.numFaces; ++face)
        {
            if(MIPLevel >= loadFromLevel)
            {
                var textureData = stream.ReadByteArray(currentMIPSize);
                gl.texImage2D(eTextureTarget, MIPLevel-loadFromLevel, textureInternalFormat, MIPWidth, MIPHeight, 0, textureFormat, textureType, textureData);
            }
            eTextureTarget++;
        }

        // Reduce the MIP size
        MIPWidth = Math.max(1, MIPWidth >> 1);
        MIPHeight = Math.max(1, MIPHeight >> 1);
    }

    if(header != null)
        header = pvrHeader;

    if(metaData != null)
        metaData = pvrMetaData;

    if(typeof callback == "function")
    {
        var args = [gl, textureID, pvrHeader, pvrMetaData];
        args = args.concat(Array.prototype.slice.call(arguments, 6));
        callback.apply(null, args);
    }

    return true;
}

