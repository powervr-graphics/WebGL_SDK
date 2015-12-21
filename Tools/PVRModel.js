/*
	PVRModel
*/

EPVRModel =
{
	Light:
	{
		ePoint       : 0,
		eDirectional : 1,
		eSpot        : 2,
	},

	Material:
	{
		BlendFunction:
		{
			eZERO                   : 0,
			eONE                    : 1,
			eBLEND_FACTOR           : 2,
			eONE_MINUS_BLEND_FACTOR : 3,

			eSRC_COLOR              : 0x0300,
			eONE_MINUS_SRC_COLOR    : 0x0301,
			eSRC_ALPHA              : 0x0302,
			eONE_MINUS_SRC_ALPHA    : 0x0303,
			eDST_ALPHA              : 0x0304,
			eONE_MINUS_DST_ALPHA    : 0x0305,
			eDST_COLOR              : 0x0306,
			eONE_MINUS_DST_COLOR    : 0x0307,
			eSRC_ALPHA_SATURATE     : 0x0308,

			eCONSTANT_COLOR           : 0x8001,
			eONE_MINUS_CONSTANT_COLOR : 0x8002,
			eCONSTANT_ALPHA           : 0x8003,
			eONE_MINUS_CONSTANT_ALPHA : 0x8004,
		},

		BlendOperation:
		{
			eADD              : 0x8006,
			eMIN              : 0x8007,
			eMAX              : 0x8008,
			eSUBTRACT         : 0x800A,
			eREVERSE_SUBTRACT : 0x800B,
		}
	}
}

function PVRModel()
{
	// Public data
	this.data =
	{
		clearColour: null,
		ambientColour: null,

		numCameras: 0,
		cameras: new Array(),

		numLights: 0,
		lights: new Array(),

		numMeshes: 0,
		meshes: new Array(),

		numNodes: 0,
		numMeshNodes: 0,
		nodes: new Array(),

		numTextures: 0,
		textures: new Array(),

		numMaterials: 0,
		materials: new Array(),

		numFrames: 0,
		currentFrame: 0,
		fps: 0,

		userData: null,

		units: 0.0,
		flags: 0,

        cache: {}
	}

	// Public methods
	this.InitCache = function ()
	{
        this.data.cache.worldMatrixFrameZero = [];
        this.data.cache.cachedFrame = [];
        this.data.cache.worldMatrixFrameN = [];
        this.data.cache.frame = 0;
        this.data.cache.frameFraction = 0.0;

        this.FlushCache();

		return EPODErrorCodes.eNoError;
	}

    this.FlushCache = function ()
    {
        this.setCurrentFrame(0);

        for(var i = 0; i < this.data.numNodes; ++i)
        {
            var m = this.getWorldMatrixNoCache(i);
            this.data.cache.worldMatrixFrameZero[i] = m;

            // Set out caches to frame 0
            this.data.cache.worldMatrixFrameN[i] = m;
            this.data.cache.cachedFrame[i] = 0.0;
        }
    }

	this.Material = function ()
	{
		this.data =
		{
			name: "",
			diffuseTextureIndex        : -1,
			ambientTextureIndex        : -1,
			specularTextureIndex       : -1,
			specularLevelTextureIndex  : -1,
			bumpMapTextureIndex        : -1,
			emissiveTextureIndex       : -1,
			glossinessTextureIndex     : -1,
			opacityTextureIndex        : -1,
			reflectionTextureIndex     : -1,
			refractionTextureIndex     : -1,
			opacity    : 1,
			ambient    : null,
			diffuse    : null,
			specular   : null,
			shininess  : 0,
			effectFile : "",
			effectName : "",

			blendSrcRGB : EPVRModel.Material.BlendFunction.eONE,
			blendSrcA   : EPVRModel.Material.BlendFunction.eONE,
			blendDstRGB : EPVRModel.Material.BlendFunction.eZERO,
			blendDstA   : EPVRModel.Material.BlendFunction.eZERO,
			blendOpRGB  : EPVRModel.Material.BlendOperation.eADD,
			blendOpA    : EPVRModel.Material.BlendOperation.eADD,

			flags    : 0,
			userData : null,
		}
	}

	this.Texture = function ()
	{
		this.data =
		{
			name: ""
		}
	}

	this.Light = function ()
	{
		this.data =
		{
			targetIndex: -1,
			colour: null,
			type: EPVRModel.Light.ePoint,
			constantAttenuation: 1.0,
			linearAttenuation: 0.0,
			quadraticAttenuation: 0.0,
			falloffAngle: Math.pi,
			falloffExponent: 0.0,
		}
	}

	this.Camera = function ()
	{
		this.data =
		{
			targetIndex: 0,
			far: 0.0,
			near: 0.0,
			numFrames: 0,
			FOVs: null,
		}

		this.getFOV = function (frame, interp)
		{
			if(this.data.FOVs)
			{
				if(this.data.numFrames > 1)
				{
					if(frame >= this.data.numFrames-1)
						throw new RangeError;

					var fov0 = this.data.FOVs[frame+0];
					var fov1 = this.data.FOVs[frame+1];
					return fov0 + interp * (fov1 - fov0);
				}
				else
				{
					return this.data.FOVs[0];
				}
			}
			else
			{
				return 0.7;
			}
		}
	}

	this.Node = function ()
	{
		this.data =
		{
			index: -1,
			name: "",
			materialIndex: -1,

			parentIndex: -1,

			animation: null,

			userData: null,
		}
	}

	this.setCurrentFrame = function(frame)
	{
		if(this.data.numFrames > 0)
		{
			/*
				Limit animation frames.

				Example: If there are 100 frames of animation, the highest frame
				number allowed is 98, since that will blend between frames 98 and
				99. (99 being of course the 100th frame.)
			*/

			if(frame > (this.data.numFrames - 1))
				throw new RangeError;

			this.data.cache.frame = Math.floor(frame);
			this.data.cache.frameFraction = frame - this.data.cache.frame;
		}
		else
		{
			if(Math.floor(frame) != 0)
				throw new RangeError;

			this.data.cache.frame = 0;
			this.data.cache.frameFraction = 0;
		}

        this.data.currentFrame = frame;
	}

    this.getWorldMatrix = function(id)
    {
        // There is a dedicated cache for frame 0
        if(this.data.currentFrame == 0)
        {
            return this.data.cache.worldMatrixFrameZero[id];
        }

        // Has this matrix been calculated and cached?
        if(this.data.currentFrame == this.data.cache.cachedFrame[id])
        {
            return this.data.cache.worldMatrixFrameN[id];
        }

        // Calculate the matrix and cache it
        var node = this.data.nodes[id];
        var m = this.data.cache.worldMatrixFrameN[id] = node.data.animation.getTransformationMatrix(this.data.cache.frame,
                                                                                                    this.data.cache.frameFraction);
        var parentID = node.data.parentIndex;
        if(parentID < 0)
        {
            this.data.cache.worldMatrixFrameN[id] = m;
        }
        else
        {
            this.data.cache.worldMatrixFrameN[id] = PVRMatrix4x4.matrixMultiply(this.getWorldMatrix(parentID), m);
        }

        this.data.cache.cachedFrame[id] = this.data.currentFrame;
        return this.data.cache.worldMatrixFrameN[id];
    }

	this.getWorldMatrixNoCache = function(id)
	{
		var m        = this.data.nodes[id].data.animation.getTransformationMatrix(this.data.cache.frame,
																				  this.data.cache.frameFraction);
		var parentID = this.data.nodes[id].data.parentIndex;

		if(parentID < 0)
			return m;

		return PVRMatrix4x4.matrixMultiply(this.getWorldMatrixNoCache(parentID), m);
	}

	this.getCameraProperties = function(cameraIdx)
	{
		if(cameraIdx < 0 || cameraIdx >= this.data.numCameras)
			throw new RangeError;

		var m     = this.getWorldMatrix(this.data.numMeshNodes + this.data.numLights + cameraIdx);
		var props = {};

		props.from = new PVRVector3();
		props.up   = new PVRVector3();
		props.to   = new PVRVector3();

		// View position is 0,0,0,1 transformed by world matrix
		props.from.data[0] = m.data[12];
		props.from.data[1] = m.data[13];
		props.from.data[2] = m.data[14];

		// When you rotate the camera from "straight forward" to "straight down", in OpenGL the UP vector will be [0, 0, -1]
		props.up.data[0] = -m.data[8];
		props.up.data[1] = -m.data[9];
		props.up.data[2] = -m.data[10];

		var camera = this.data.cameras[cameraIdx];

		// TODO: Experimental!
		if(camera.data.targetIndex != -1)
		{
			var atCurrent, atTarget;
			var targetMatrix = this.getWorldMatrix(camera.data.targetIndex);

			props.to.data[0] = targetMatrix.data[12];
			props.to.data[1] = targetMatrix.data[13];
			props.to.data[2] = targetMatrix.data[14];

			// Rotate our up vector
			atTarget = PVRVector3.subtract(props.to, props.from);
			atTarget.normalise();

			atCurrent = PVRVector3.subtract(props.to, props.from);
			atCurrent.normalise();

			var axis  = PVRVector3.cross(atCurrent, atTarget);
			var angle = PVRVector3.dot(atCurrent, atTarget);

			var q    = PVRQuaternion.createFromAxisAndAngle(axis, angle);
			props.up = PVRVector3.matrixMultiply(props.up, q.toRotationMatrix());
			props.up.normalise();
		}
		else
		{
			// View direction is 0,-1,0,1 transformed by world matrix
			props.to.data[0] = -m.data[4] + props.from.data[0];
			props.to.data[1] = -m.data[5] + props.from.data[1];
			props.to.data[2] = -m.data[6] + props.from.data[2];
		}

		props.fov = camera.getFOV(this.data.cache.frame, this.data.cache.frameFraction);
		return props;
	}

	this.getLightDirection = function (lightIdx)
	{
		if(lightIdx < 0 || lightIdx >= this.data.numLights)
			throw new RangeError;

		var m = this.getWorldMatrix(this.data.numMeshNodes + lightIdx);
		var targetIndex = this.data.lights[lightIdx].data.targetIndex;

		var directionVector = new PVRVector4();
		directionVector.data[3] = 0.0;
		if(targetIndex != -1)
		{
			var targetMatrix = this.getWorldMatrix(targetIndex);
			directionVector.data[0] = targetMatrix.data[12] - m.data[12];
			directionVector.data[1] = targetMatrix.data[13] - m.data[13];
			directionVector.data[2] = targetMatrix.data[14] - m.data[14];
			directionVector.normalise();
		}
		else
		{
			directionVector.data[0] = -m.data[4];
			directionVector.data[1] = -m.data[5];
			directionVector.data[2] = -m.data[6];
		}

		return directionVector;
	}
}
