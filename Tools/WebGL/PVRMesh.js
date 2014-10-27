/*
	PVRMesh
*/

EPVRMesh =
{
	eTriangleList:          0,
	eIndexedTriangleList:   1,
	eTriangleStrips:        2,
	eIndexedTriangleStrips: 3,
	eTriPatchList:          4,
	eQuadPatchList:         5,
	
	VertexData:
	{
		eNone:               0,
		eFloat:              1,
		eInt:                2,
		eUnsignedShort:      3,
		eRGBA:               4,
		eARGB:               5,
		eD3DCOLOR:           6,
		eUBYTE4:             7,
		eDEC3N:              8,
		eFixed16_16:         9,
		eUnsignedByte:      10,
		eShort:             11,
		eShortNorm:         12,
		eByte:              13,
		eByteNorm:          14,
		eUnsignedByteNorm:  15,
		eUnsignedShortNorm: 16,
		eUnsignedInt:       17,
		eABGR:              18,

		eCustom:            1000,
	},
	
	FaceData:
	{
		e16Bit: 3,
		e32Bit: 17,
	},
}

function PVRMesh()
{
	// Public data
	this.data = 
	{
		unpackMatrix: new Array(),
		vertexElementData: new Array(), // Allows us to have multiple interleaved/non-interleaved arrays.
		vertexElements: new Object(),   // Map of semantics (e.g POSITION0, NORMALS0)
		
		primitiveData:
		{
			numVertices: 0,
			numFaces: 0,
			numStrips: 0,
			numPatchesSubdivisions: 0,
			numPatches: 0,
			numControlPointsPerPatch: 0,
			
			stripLengths: null,
			primitiveType: EPVRMesh.eIndexedTriangleList
		},
		
		boneBatches:
		{
			boneMax: 0,
			count: 0,
			batches: null,
			boneCounts: null,
			offsets: null
		},
		
		faces:
		{
			indexType: EPVRMesh.FaceData.e16Bit,
			data: null
		},
	}
	
	// Private methods
	var VertexData = function(semantic, type, numComponents, stride, offset, dataIndex)
	{
		this.semantic = semantic;
		this.dataType = type;
		this.numComponents = numComponents;
		this.stride = stride;
		this.offset = offset;
		this.dataIndex = dataIndex;
	} 
	
	// Public methods
	this.AddData = function (data)
	{
		this.data.vertexElementData.push(data);
		return this.data.vertexElementData.length - 1;
	}
	
	this.AddFaces = function (data, type)
	{
		this.data.faces.indexType = type;
		this.data.faces.data      = data;
		
		if(data.length > 0)
		{
			this.data.primitiveData.numFaces = data.length / 3;
		}
		else
		{
			this.data.primitiveData.numFaces = 0;
		}
		
		return EPODErrorCodes.eNoError;
	}
	
	this.AddElement = function (semantic, type, numComponents, stride, offset, dataIndex)
	{
		if(this.data.vertexElements.hasOwnProperty(semantic))
			return EPODErrorCodes.eKeyAlreadyExists;
		
		var vertexData = new VertexData(semantic, type, numComponents, stride, offset, dataIndex);
		this.data.vertexElements[semantic] = vertexData;
		
		return EPODErrorCodes.eNoError;
	}
	
	this.GetNumElementsOfSemantic = function (semantic)
	{
		var count = 0;
		for(k in this.data.vertexElements)
		{
			if(semantic == k)
				++count;
		}
		return count;
	}
}