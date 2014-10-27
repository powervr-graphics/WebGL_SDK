/*
	PVRPODLoader
*/

EPODDefines =
{
	startTagMask : 0x0,
	endTagMask   : 0x80000000,
	tagMash      : 0x80000000,
	PODFormatVersion : "AB.POD.2.0",
	PODFormatVersionLen : 11,
}

EPODErrorCodes =
{
	eNoError             : 0,
	eFileNotFound        : 1,
	eFileVersionMismatch : 2,
	eFileStreamError     : 3,
	eKeyAlreadyExists    : 4,
	eUnknown             : 5,
}

EPODIdentifiers = 
{
	eFormatVersion  : 1000,
	eScene          : 1001,
	eExportOptions  : 1002,
	eHistory        : 1003,
	eEndiannessMismatch : -402456576,
	
	// Scene
	eSceneClearColour	 : 2000,
	eSceneAmbientColour  : 2001,
	eSceneNumCameras     : 2002,
	eSceneNumLights      : 2003,
	eSceneNumMeshes      : 2004,
	eSceneNumNodes       : 2005,
	eSceneNumMeshNodes   : 2006,
	eSceneNumTextures    : 2007,
	eSceneNumMaterials   : 2008,
	eSceneNumFrames      : 2009,
	eSceneCamera         : 2010,		// Will come multiple times
	eSceneLight          : 2011,		// Will come multiple times
	eSceneMesh           : 2012,		// Will come multiple times
	eSceneNode           : 2013,		// Will come multiple times
	eSceneTexture        : 2014,	    // Will come multiple times
	eSceneMaterial       : 2015,	    // Will come multiple times
	eSceneFlags          : 2016,
	eSceneFPS            : 2017,
	eSceneUserData       : 2018,
	eSceneUnits          : 2019,

	// Materials
	eMaterialName                       : 3000,
	eMaterialDiffuseTextureIndex        : 3001,
	eMaterialOpacity                    : 3002,
	eMaterialAmbientColour              : 3003,
	eMaterialDiffuseColour              : 3004,
	eMaterialSpecularColour             : 3005,
	eMaterialShininess                  : 3006,
	eMaterialEffectFile                 : 3007,
	eMaterialEffectName                 : 3008,
	eMaterialAmbientTextureIndex        : 3009,
	eMaterialSpecularColourTextureIndex : 3010,
	eMaterialSpecularLevelTextureIndex  : 3011,
	eMaterialBumpMapTextureIndex        : 3012,
	eMaterialEmissiveTextureIndex       : 3013,
	eMaterialGlossinessTextureIndex     : 3014,
	eMaterialOpacityTextureIndex        : 3015,
	eMaterialReflectionTextureIndex     : 3016,
	eMaterialRefractionTextureIndex     : 3017,
	eMaterialBlendingRGBSrc             : 3018,
	eMaterialBlendingAlphaSrc           : 3019,
	eMaterialBlendingRGBDst             : 3020,
	eMaterialBlendingAlphaDst           : 3021,
	eMaterialBlendingRGBOperation       : 3022,
	eMaterialBlendingAlphaOperation     : 3023,
	eMaterialBlendingRGBAColour         : 3024,
	eMaterialBlendingFactorArray        : 3025,
	eMaterialFlags                      : 3026,
	eMaterialUserData                   : 3027,

	// Textures
	eTextureFilename				    : 4000,

	// Nodes
	eNodeIndex				     : 5000,
	eNodeName                    : 5001,
	eNodeMaterialIndex           : 5002,
	eNodeParentIndex             : 5003,
	eNodePosition                : 5004,    // Deprecated 
	eNodeRotation                : 5005,    // Deprecated
	eNodeScale                   : 5006,	// Deprecated
	eNodeAnimationPosition       : 5007,
	eNodeAnimationRotation       : 5008,
	eNodeAnimationScale          : 5009,
	eNodeMatrix                  : 5010,	// Deprecated
	eNodeAnimationMatrix         : 5011,
	eNodeAnimationFlags          : 5012,
	eNodeAnimationPositionIndex  : 5013,
	eNodeAnimationRotationIndex  : 5014,
	eNodeAnimationScaleIndex     : 5015,
	eNodeAnimationMatrixIndex    : 5016,
	eNodeUserData                : 5017,

	// Mesh
	eMeshNumVertices			 : 6000,
	eMeshNumFaces                : 6001,
	eMeshNumUVWChannels          : 6002,
	eMeshVertexIndexList         : 6003,
	eMeshStripLength             : 6004,
	eMeshNumStrips               : 6005,
	eMeshVertexList              : 6006,
	eMeshNormalList              : 6007,
	eMeshTangentList             : 6008,  
	eMeshBinormalList            : 6009,
	eMeshUVWList                 : 6010,			// Will come multiple times
	eMeshVertexColourList        : 6011,
	eMeshBoneIndexList           : 6012,
	eMeshBoneWeightList          : 6013,
	eMeshInteravedDataList       : 6014,
	eMeshBoneBatchIndexList      : 6015,
	eMeshNumBoneIndicesPerBatch  : 6016,
	eMeshBoneOffsetPerBatch      : 6017,
	eMeshMaxNumBonesPerBatch     : 6018,
	eMeshNumBoneBatches          : 6019,
	eMeshUnpackMatrix            : 6020,

	// Light
	eLightTargetObjectIndex		   : 7000,
	eLightColour                   : 7001,
	eLightType                     : 7002,
	eLightConstantAttenuation      : 7003,
	eLightLinearAttenuation        : 7004,
	eLightQuadraticAttenuation     : 7005,
	eLightFalloffAngle             : 7006,
	eLightFalloffExponent          : 7007,

	// Camera
	eCameraTargetObjectIndex	   : 8000,
	eCameraFOV                     : 8001,
	eCameraFarPlane                : 8002,
	eCameraNearPlane               : 8003,
	eCameraFOVAnimation            : 8004,

	// Mesh data block
	eBlockDataType			: 9000,
	eBlockNumComponents     : 9001,
	eBlockStride            : 9002,
	eBlockData              : 9003
}

function PVRVertexDataTypeSize(type)
{
	switch(type)
	{
		default:
			throw "Unhandled data type";
			return 0;
		case EPVRMesh.VertexData.eFloat:
			return 4;
		case EPVRMesh.VertexData.eInt:
		case EPVRMesh.VertexData.eUnsignedInt:
			return 4;
		case EPVRMesh.VertexData.eShort:
		case EPVRMesh.VertexData.eShortNorm:
		case EPVRMesh.VertexData.eUnsignedShort:
		case EPVRMesh.VertexData.eUnsignedShortNorm:
			return 2;
		case EPVRMesh.VertexData.eRGBA:
			return 4;
		case EPVRMesh.VertexData.eABGR:
			return 4;
		case EPVRMesh.VertexData.eARGB:
			return 4;
		case EPVRMesh.VertexData.eD3DCOLOR:
			return 4;
		case EPVRMesh.VertexData.eUBYTE4:
			return 4;
		case EPVRMesh.VertexData.eDEC3N:
			return 4;
		case EPVRMesh.VertexData.eFixed16_16:
			return 4;
		case EPVRMesh.VertexData.eUnsignedByte:
		case EPVRMesh.VertexData.eUnsignedByteNorm:
		case EPVRMesh.VertexData.eByte:
		case EPVRMesh.VertexData.eByteNorm:
			return 1;
	}
}

function PVRPODLoader() 
{
	/*
		ReadTag
	*/
	var ReadTag = function(stream, tag)
	{
		tag.identifier = stream.ReadInt32();
		tag.dataLength = stream.ReadInt32();
		
		return EPODErrorCodes.eNoError;
	}
	
	/*
		ReadVertexIndexData
	*/
	var ReadVertexIndexData = function(stream, mesh)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };
		var size = 0, data = null, type = EPVRMesh.FaceData.e16Bit;

		while ((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			if (tag.identifier == (EPODIdentifiers.eMeshVertexIndexList | EPODDefines.endTagMask))
			{
				return mesh.AddFaces(data, type);
			}

			switch (tag.identifier)
			{
				case EPODIdentifiers.eBlockDataType:
				{
					var tmp = stream.ReadUInt32();
					switch(tmp)
					{
						case EPVRMesh.VertexData.eUnsignedInt:   
							type = EPVRMesh.FaceData.e32Bit;
							break;
						case EPVRMesh.VertexData.eUnsignedShort: 
							type = EPVRMesh.FaceData.e16Bit; 
							break;
						default:
							throw "UnhandledFaceType";
					}
					break;
				}
				case EPODIdentifiers.eBlockData:
				{
					switch (type)
					{
						case EPVRMesh.FaceData.e16Bit:
						{
							data = stream.ReadUInt16Array(tag.dataLength / 2);
							break;
						}
						case EPVRMesh.FaceData.e32Bit:
						{
							data = stream.ReadUInt32Array(tag.dataLength / 4);
							break;
						}
					}

					size = tag.dataLength;
					break;
				}
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				break;
		}
		
		return result;
	}
	
	/*
		ReadVertexData
	*/
	var ReadVertexData = function(stream, mesh, semanticName, blockIdentifier, dataIndex)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };
		var numComponents = 0, stride = 0, offset = 0;
		var type          = EPVRMesh.VertexData.eNone;

		while ((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			if (tag.identifier == (blockIdentifier | EPODDefines.endTagMask))
			{
				if (numComponents != 0) // Is there a vertex element to add?
					return mesh.AddElement(semanticName, type, numComponents, stride, offset, dataIndex);
				else
					return EPODErrorCodes.eNoError;
			}

			switch (tag.identifier)
			{
				case EPODIdentifiers.eBlockDataType:
				{
					type = stream.ReadUInt32();
					continue;
				}
				case EPODIdentifiers.eBlockNumComponents:
					numComponents = stream.ReadInt32();
					break;
				case EPODIdentifiers.eBlockStride:
					stride = stream.ReadInt32();
					break;
				case EPODIdentifiers.eBlockData:
					if (dataIndex == -1) // This POD file isn't using interleaved data so this data block must be valid vertex data
					{
						var data = null;
						
						switch(type)
						{
						default:
							throw "Unhandled data type";
							return 0;
						case EPVRMesh.VertexData.eFloat:
							data = stream.ReadFloat32Array(tag.dataLength / 4);
							break;
						case EPVRMesh.VertexData.eInt:
							data = stream.ReadInt32Array(tag.dataLength / 4);
							break;
						case EPVRMesh.VertexData.eShort:
						case EPVRMesh.VertexData.eShortNorm:
							data = stream.ReadInt16Array(tag.dataLength / 2);
							break;
						case EPVRMesh.VertexData.eUnsignedShort:
						case EPVRMesh.VertexData.eUnsignedShortNorm:
							data = stream.ReadUInt16Array(tag.dataLength / 2);
							break;
						case EPVRMesh.VertexData.eUnsignedInt:
						case EPVRMesh.VertexData.eRGBA:
						case EPVRMesh.VertexData.eABGR:
						case EPVRMesh.VertexData.eARGB:
						case EPVRMesh.VertexData.eD3DCOLOR:
						case EPVRMesh.VertexData.eUBYTE4:
						case EPVRMesh.VertexData.eDEC3N:
						case EPVRMesh.VertexData.eFixed16_16:
							data = stream.ReadUInt32Array(tag.dataLength / 4);
							break;
						case EPVRMesh.VertexData.eUnsignedByte:
						case EPVRMesh.VertexData.eUnsignedByteNorm:
							data = stream.ReadByteArray(tag.dataLength);
							break;
						case EPVRMesh.VertexData.eByte:
						case EPVRMesh.VertexData.eByteNorm:
							data = stream.ReadSignedByteArray(tag.dataLength);
							break;
						}

						dataIndex = mesh.AddData(data);
					}
					else
					{
						offset = stream.ReadUInt32();
					}
					break;
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}
		
		return result;
	}
	
	/*
		ReadCameraBlock
	*/
	var ReadCameraBlock = function(stream, camera)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };	
				
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch (tag.identifier)
			{
				case EPODIdentifiers.eSceneCamera | EPODDefines.endTagMask:
					return EPODErrorCodes.eNoError;
				case EPODIdentifiers.eCameraTargetObjectIndex | EPODDefines.startTagMask:
					camera.data.targetIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eCameraFOV | EPODDefines.startTagMask:
				{
					if(camera.data.FOVs)
					{
						stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent);
					}
					else
					{
						camera.data.FOVs      = stream.ReadFloat32Array(1);
						camera.data.numFrames = 1;
					}
					break;
				}
				case EPODIdentifiers.eCameraFarPlane | EPODDefines.startTagMask:
					camera.data.far = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eCameraNearPlane | EPODDefines.startTagMask:
					camera.data.near = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eCameraFOVAnimation | EPODDefines.startTagMask:
				{
					camera.data.numFrames = tag.dataLength / 4; // sizeof(float)
					camera.data.FOVs      = stream.ReadFloat32Array(camera.data.numFrames);
					break;
				}
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}
		
		return result;
	}
	
	/*
		ReadLightBlock
	*/
	var ReadLightBlock = function(stream, light)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };	
				
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch (tag.identifier)
			{
				case EPODIdentifiers.eSceneLight | EPODDefines.endTagMask:
					return EPODErrorCodes.eNoError;
				case EPODIdentifiers.eLightTargetObjectIndex | EPODDefines.startTagMask:
					light.data.targetIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eLightColour | EPODDefines.startTagMask:
					light.data.colour = stream.ReadFloat32Array(3);
					break;
				case EPODIdentifiers.eLightType | EPODDefines.startTagMask:
					light.data.type = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eLightConstantAttenuation | EPODDefines.startTagMask:
					light.data.constantAttenuation = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eLightLinearAttenuation | EPODDefines.startTagMask:
					light.data.linearAttenuation = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eLightQuadraticAttenuation | EPODDefines.startTagMask:
					light.data.quadraticAttenuation = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eLightFalloffAngle | EPODDefines.startTagMask:
					light.data.falloffAngle = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eLightFalloffExponent | EPODDefines.startTagMask:
					light.data.falloffExponent = stream.ReadFloat32();
					break;
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}

		return result;
	}
	
	/*
		ReadMeshBlock
	*/
	var ReadMeshBlock = function(stream, mesh)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };
		var numUVWs = 0, podUVWs = 0;
		var interleavedDataIndex = -1;

		while ((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch(tag.identifier)
			{
				case EPODIdentifiers.eSceneMesh | EPODDefines.endTagMask:
				{
					if (mesh.data.faces.data.length > 0)
					{
						if (mesh.data.primitiveData.numStrips)
							mesh.data.primitiveData.primitiveType = EPVRMesh.eIndexedTriangleStrips;
						else
							mesh.data.primitiveData.primitiveType = EPVRMesh.eIndexedTriangleList;
					}
					else
					{
						if (mesh.data.primitiveData.numStrips)
							mesh.data.primitiveData.primitiveType = EPVRMesh.eTriangleStrips;
						else
							mesh.data.primitiveData.primitiveType = EPVRMesh.eTriangleList;
					}

					if (numUVWs != podUVWs || numUVWs != mesh.GetNumElementsOfSemantic("UV0"))  // TODO
						return EPODErrorCodes.eUnknown;

					return EPODErrorCodes.eNoError;
				}
				case EPODIdentifiers.eMeshNumVertices | EPODDefines.startTagMask:
					mesh.data.primitiveData.numVertices = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMeshNumFaces | EPODDefines.startTagMask:
					mesh.data.primitiveData.numFaces = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMeshNumUVWChannels | EPODDefines.startTagMask:
					podUVWs = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMeshStripLength | EPODDefines.startTagMask:
					mesh.data.primitiveData.stripLengths = stream.ReadUInt32Array(tag.dataLength / 4);
					break;
				case EPODIdentifiers.eMeshNumStrips | EPODDefines.startTagMask:
					mesh.data.primitiveData.numStrips = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMeshInteravedDataList | EPODDefines.startTagMask:
					{
						var data = stream.ReadByteArray(tag.dataLength);

						interleavedDataIndex = mesh.AddData(data);

						if (interleavedDataIndex == -1)
							return EPODErrorCodes.eUnknown;

						break;
					}
				case EPODIdentifiers.eMeshBoneBatchIndexList | EPODDefines.startTagMask:
					mesh.data.boneBatches.batches = stream.ReadUInt32Array(tag.dataLength / 4);
					break;
				case EPODIdentifiers.eMeshNumBoneIndicesPerBatch | EPODDefines.startTagMask:
					mesh.data.boneBatches.boneCounts = stream.ReadUInt32Array(tag.dataLength / 4);
					break;
				case EPODIdentifiers.eMeshBoneOffsetPerBatch | EPODDefines.startTagMask:
					mesh.data.boneBatches.offsets = stream.ReadUInt32Array(tag.dataLength / 4);
					break;
				case EPODIdentifiers.eMeshMaxNumBonesPerBatch | EPODDefines.startTagMask:
					mesh.data.boneBatches.boneMax = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMeshNumBoneBatches | EPODDefines.startTagMask:
					mesh.data.boneBatches.count = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMeshUnpackMatrix | EPODDefines.startTagMask:
					mesh.data.unpackMatrix = stream.ReadFloat32Array(16);
					break;
				case EPODIdentifiers.eMeshVertexIndexList | EPODDefines.startTagMask:
					result = ReadVertexIndexData(stream, mesh);
					break;
				case EPODIdentifiers.eMeshVertexList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "POSITION0", tag.identifier, interleavedDataIndex);
					break;
				case EPODIdentifiers.eMeshNormalList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "NORMAL0", tag.identifier, interleavedDataIndex);
					break;
				case EPODIdentifiers.eMeshTangentList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "TANGENT0", tag.identifier, interleavedDataIndex);
					break;
				case EPODIdentifiers.eMeshBinormalList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "BINORMAL0", tag.identifier, interleavedDataIndex);
					break;
				case EPODIdentifiers.eMeshUVWList | EPODDefines.startTagMask:
					{
						var semantic = "UV" + numUVWs++;
						result = ReadVertexData(stream, mesh, semantic, tag.identifier, interleavedDataIndex);
						break;
					}
				case EPODIdentifiers.eMeshVertexColourList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "VERTEXCOLOR0", tag.identifier, interleavedDataIndex);
					break;
				case EPODIdentifiers.eMeshBoneIndexList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "BONEINDEX0", tag.identifier, interleavedDataIndex);
					break;
				case EPODIdentifiers.eMeshBoneWeightList | EPODDefines.startTagMask:
					result = ReadVertexData(stream, mesh, "BONEWEIGHT0", tag.identifier, interleavedDataIndex);
					break;
					
				default:
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
							
					break;
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}

		return result;
	}
	
	/*
		ReadNodeBlock
	*/
	var ReadNodeBlock = function(stream, node)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };	
		var isOldFormat = false;
		var pos      = null;
		var rotation = null;
		var scale    = null;
		var matrix   = null;
		
		animation = node.data.animation;
				
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch (tag.identifier)
			{
				case EPODIdentifiers.eSceneNode | EPODDefines.endTagMask:
				{
					if(isOldFormat)
					{
						if(animation.data.positions != null)
							animation.data.flags |= EPVRMesh.Animation.eHasPositionAnimation;
						else
							animation.data.positions = pos;

						if(animation.data.rotations != null)
							animation.data.flags |= EPVRMesh.Animation.eHasRotationAnimation;
						else
							animation.data.rotations = rotation;
							
						if(animation.data.scales != null)
							animation.data.flags |= EPVRMesh.Animation.eHasScaleAnimation;
						else
							animation.data.scales = scale;
							
						if(animation.data.matrices != null)
							animation.data.flags |= EPVRMesh.Animation.eHasMatrixAnimation;
						else
							animation.data.matrices = matrix;
					}
					return EPODErrorCodes.eNoError;
				}
				case EPODIdentifiers.eNodeIndex | EPODDefines.startTagMask:
					node.data.index = stream.ReadInt32();
					break;
				case EPODIdentifiers.eNodeName | EPODDefines.startTagMask:
					node.data.name = stream.ReadString(tag.dataLength);
					break;
				case EPODIdentifiers.eNodeMaterialIndex | EPODDefines.startTagMask:
					node.data.materialIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eNodeParentIndex | EPODDefines.startTagMask:
					node.data.parentIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eNodePosition | EPODDefines.startTagMask:  // Deprecated
					pos = stream.ReadFloat32Array(3);
					isOldFormat = true;
					break;
				case EPODIdentifiers.eNodeRotation | EPODDefines.startTagMask:  // Deprecated
					rotation = stream.ReadFloat32Array(4);
					isOldFormat = true;
					break;
				case EPODIdentifiers.eNodeScale | EPODDefines.startTagMask:     // Deprecated
					scale = stream.ReadFloat32Array(3);
					isOldFormat = true;
					break;		
				case EPODIdentifiers.eNodeMatrix | EPODDefines.startTagMask:	// Deprecated
					matrix = stream.ReadFloat32Array(16);
					isOldFormat = true;
					break;
				case EPODIdentifiers.eNodeAnimationPosition | EPODDefines.startTagMask:
					animation.data.positions = stream.ReadFloat32Array(tag.dataLength / 4); // sizeof(float)
					break;
				case EPODIdentifiers.eNodeAnimationRotation | EPODDefines.startTagMask:
					animation.data.rotations = stream.ReadFloat32Array(tag.dataLength / 4); // sizeof(float)
					break;
				case EPODIdentifiers.eNodeAnimationScale | EPODDefines.startTagMask:
					animation.data.scales = stream.ReadFloat32Array(tag.dataLength / 4); // sizeof(float)
					break;
				case EPODIdentifiers.eNodeAnimationMatrix | EPODDefines.startTagMask:
					animation.data.matrices = stream.ReadFloat32Array(tag.dataLength / 4); // sizeof(float)
					break;
				case EPODIdentifiers.eNodeAnimationFlags | EPODDefines.startTagMask:
					animation.data.flags = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eNodeAnimationPositionIndex | EPODDefines.startTagMask:
					animation.data.positionIndices = stream.ReadUInt32Array(tag.dataLength / 4) // sizeof(Uint32)
					break;
				case EPODIdentifiers.eNodeAnimationRotationIndex | EPODDefines.startTagMask:
					animation.data.rotationIndices = stream.ReadUInt32Array(tag.dataLength / 4) // sizeof(Uint32)
					break;
				case EPODIdentifiers.eNodeAnimationScaleIndex | EPODDefines.startTagMask:
					animation.data.scaleIndices = stream.ReadUInt32Array(tag.dataLength / 4) // sizeof(Uint32)
					break;
				case EPODIdentifiers.eNodeAnimationMatrixIndex | EPODDefines.startTagMask:
					animation.data.matrixIndices = stream.ReadUInt32Array(tag.dataLength / 4) // sizeof(Uint32)
					break;
				case EPODIdentifiers.eNodeUserData | EPODDefines.startTagMask:
					node.userData = stream.ReadByteArray(tag.dataLength);
					break;
				
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}

		return result;
	}
	
	/*
		ReadTextureBlock
	*/
	var ReadTextureBlock = function(stream, texture)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };	
				
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch (tag.identifier)
			{
				case EPODIdentifiers.eSceneTexture | EPODDefines.endTagMask:
					return EPODErrorCodes.eNoError;
				case EPODIdentifiers.eTextureFilename | EPODDefines.startTagMask:
				{
					var filename = stream.ReadString(tag.dataLength);
					texture.data.name = filename;
					break;
				}
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}

		return result;
	}
	
	/*
		ReadMaterialBlock
	*/
	var ReadMaterialBlock = function(stream, material)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };	
				
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch (tag.identifier)
			{
				case EPODIdentifiers.eSceneMaterial | EPODDefines.endTagMask:
					return EPODErrorCodes.eNoError;
				case EPODIdentifiers.eMaterialName | EPODDefines.startTagMask:
					material.data.name = stream.ReadString(tag.dataLength);
					break;
				case EPODIdentifiers.eMaterialDiffuseTextureIndex | EPODDefines.startTagMask:
					material.data.diffuseTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialOpacity | EPODDefines.startTagMask:
					material.data.opacity = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eMaterialAmbientColour | EPODDefines.startTagMask:
					material.data.ambient = stream.ReadFloat32Array(3);
					break;
				case EPODIdentifiers.eMaterialDiffuseColour | EPODDefines.startTagMask:
					material.data.diffuse = stream.ReadFloat32Array(3);
					break;
				case EPODIdentifiers.eMaterialSpecularColour | EPODDefines.startTagMask:
					material.data.specular = stream.ReadFloat32Array(3);
					break;
				case EPODIdentifiers.eMaterialShininess | EPODDefines.startTagMask:
					material.data.shininess = stream.ReadFloat32();
					break;
				case EPODIdentifiers.eMaterialEffectFile | EPODDefines.startTagMask:
					material.data.effectFile = stream.ReadString(tag.dataLength);
					break;
				case EPODIdentifiers.eMaterialEffectName | EPODDefines.startTagMask:
					material.data.effectName = stream.ReadString(tag.dataLength);
					break;
				case EPODIdentifiers.eMaterialAmbientTextureIndex | EPODDefines.startTagMask:
					material.data.ambientTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialSpecularColourTextureIndex | EPODDefines.startTagMask:
					material.data.specularColourTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialSpecularLevelTextureIndex | EPODDefines.startTagMask:
					material.data.specularLevelTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialBumpMapTextureIndex | EPODDefines.startTagMask:
					material.data.bumpMapTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialEmissiveTextureIndex | EPODDefines.startTagMask:
					material.data.emissiveTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialGlossinessTextureIndex | EPODDefines.startTagMask:
					material.data.glossinessTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialOpacityTextureIndex | EPODDefines.startTagMask:
					material.data.opacityTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialReflectionTextureIndex | EPODDefines.startTagMask:
					material.data.reflectionTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialRefractionTextureIndex | EPODDefines.startTagMask:
					material.data.refractionTextureIndex = stream.ReadInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingRGBSrc | EPODDefines.startTagMask:
					material.data.blendSrcRGB = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingAlphaSrc | EPODDefines.startTagMask:
					material.data.blendSrcA = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingRGBDst | EPODDefines.startTagMask:
					material.data.blendDstRGB = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingAlphaDst | EPODDefines.startTagMask:
					material.data.blendDstA = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingRGBOperation | EPODDefines.startTagMask:
					material.data.blendOpRGB = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingAlphaOperation | EPODDefines.startTagMask:
					material.data.blendOpA = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialBlendingRGBAColour | EPODDefines.startTagMask:
					material.data.blendColour = stream.ReadFloat32Array(4);
					break;
				case EPODIdentifiers.eMaterialBlendingFactorArray | EPODDefines.startTagMask:
					material.data.blendFactor = stream.ReadFloat32Array(4);
					break;
				case EPODIdentifiers.eMaterialFlags | EPODDefines.startTagMask:
					material.data.flags = stream.ReadUInt32();
					break;
				case EPODIdentifiers.eMaterialUserData | EPODDefines.startTagMask:
					material.data.userData = stream.ReadByteArray(tag.dataLength);
					break;
				default:
				{
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
				}
			}

			if (result != EPODErrorCodes.eNoError)
				return result;
		}

		return result;
	}
	
	/*
		ReadSceneBlock
	*/
	var ReadSceneBlock = function(stream, model)
	{
		var result = EPODErrorCodes.eNoError;
		var tag = { identifier: 0, dataLength: 0 };	
		var numCameras = 0, numLights = 0, numMaterials = 0, 
			numMeshes = 0, numTextures = 0, numNodes = 0;
		
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch(tag.identifier)
			{
				case EPODIdentifiers.eScene | EPODDefines.endTagMask:
					if(numCameras != model.data.numCameras)
						return EPODErrorCodes.eUnknown;
						
					if(numLights != model.data.numLights)
						return EPODErrorCodes.eUnknown;
						
					if(numMaterials != model.data.numMaterials)
						return EPODErrorCodes.eUnknown;
						
					if(numMeshes != model.data.numMeshes)
						return EPODErrorCodes.eUnknown;
						
					if(numTextures != model.data.numTextures)
						return EPODErrorCodes.eUnknown;
						
					if(numNodes != model.data.numNodes)
						return EPODErrorCodes.eUnknown;
						
					return EPODErrorCodes.eNoError;

				case EPODIdentifiers.eSceneClearColour | EPODDefines.startTagMask:
					model.data.clearColour = stream.ReadFloat32Array(3);
					break;

				case EPODIdentifiers.eSceneAmbientColour | EPODDefines.startTagMask:
					model.data.ambientColour = stream.ReadFloat32Array(3);
					break;

				case EPODIdentifiers.eSceneNumCameras | EPODDefines.startTagMask:
					model.data.numCameras = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumLights | EPODDefines.startTagMask:
					model.data.numLights = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumMeshes | EPODDefines.startTagMask:
					model.data.numMeshes = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumNodes | EPODDefines.startTagMask:
					model.data.numNodes = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumMeshNodes | EPODDefines.startTagMask:
					model.data.numMeshNodes = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumTextures | EPODDefines.startTagMask:
					model.data.numTextures = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumMaterials | EPODDefines.startTagMask:
					model.data.numMaterials = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneNumFrames | EPODDefines.startTagMask:
					model.data.numFrames = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneFlags | EPODDefines.startTagMask:
					model.data.flags = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneFPS | EPODDefines.startTagMask:
					model.data.fps = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneUserData | EPODDefines.startTagMask:
					model.data.userData = stream.ReadByteArray(tag.dataLength);
					break;

				case EPODIdentifiers.eSceneUnits | EPODDefines.startTagMask:
					model.data.units = stream.ReadInt32();
					break;

				case EPODIdentifiers.eSceneCamera | EPODDefines.startTagMask:
					var camera = new model.Camera();	
					result = ReadCameraBlock(stream, camera);
					
					model.data.cameras.push(camera);
					numCameras++;
					break;

				case EPODIdentifiers.eSceneLight | EPODDefines.startTagMask:
					var light = new model.Light();
					result = ReadLightBlock(stream, light);
					
					model.data.lights.push(light);
					numLights++;
					break;

				case EPODIdentifiers.eSceneMesh | EPODDefines.startTagMask:
					var mesh = new PVRMesh();
					result = ReadMeshBlock(stream, mesh);
					
					model.data.meshes.push(mesh);
					numMeshes++;
					break;

				case EPODIdentifiers.eSceneNode | EPODDefines.startTagMask:
					var anim = new PVRAnimation();
					var node = new model.Node();
					node.data.animation = anim;
					result = ReadNodeBlock(stream, node);
					
					model.data.nodes.push(node);
					numNodes++;
					break;

				case EPODIdentifiers.eSceneTexture | EPODDefines.startTagMask:
					var texture = new model.Texture();
					result = ReadTextureBlock(stream, texture);
					
					model.data.textures.push(texture);
					numTextures++;
					break;
					
				case EPODIdentifiers.eSceneMaterial | EPODDefines.startTagMask:
					var material = new model.Material();
					result = ReadMaterialBlock(stream, material);
					
					model.data.materials.push(material);
					numMaterials++;
					break;
					
				default:
					// Unhandled data, skip it
					if(!stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent))
						result = EPODErrorCodes.eFileStreamError;
						
					break;
			}
			
			if(result != EPODErrorCodes.eNoError)
				return result;
		}
		
		return result;
	}

	/*
		load
	*/
	this.load = function(stream, model)
	{
		if(!stream.IsOpen())
			return EPODErrorCodes.eFileNotFound;
						
		var tag = { identifier: 0, dataLength: 0 };	
		while((result = ReadTag(stream, tag)) == EPODErrorCodes.eNoError)
		{
			switch(tag.identifier)
			{
				case EPODIdentifiers.eFormatVersion | EPODDefines.startTagMask:
				{
					// Is the version string in the file the same length as ours?
					if(tag.dataLength != EPODDefines.PODFormatVersionLen)
						return EPODErrorCodes.eFileVersionMismatch;
						
					// ... it is. Check to see if the string matches
					var version = stream.ReadString(tag.dataLength);					
					if(!(version === EPODDefines.PODFormatVersion))
						return EPODErrorCodes.eFileVersionMismatch;
						
					break;
				}
				case EPODIdentifiers.eScene | EPODDefines.startTagMask:
				{
					result = ReadSceneBlock(stream, model);
					if(result == EPODErrorCodes.eNoError)
					{
						result = model.InitCache();
					}
					return result;
				}
				default:
				{
					// Unhandled data, skip it.
					result = stream.Seek(tag.dataLength, EPVRFileStreamSeekMode.eFromCurrent);
					if(result == false)
						return EPODErrorCodes.eFileStreamError;
				}
			}
		}
		
		return EPODErrorCodes.eNoError;
	}
}