function WebGLWater()
{
    // Camera constants. Used for making the projection matrix
    var CAM_NEAR = 12.0;
    var CAM_FAR  = 4000.0;

    // Index the attributes that are bound to vertex shaders
    var VERTEX_ARRAY   = 0;
    var NORMAL_ARRAY   = 1;
    var TEXCOORD_ARRAY = 2;

    var ENABLE_UI = 0;			// Remove when user input is not required

    /****************************************************************************
     ** Enums
     ****************************************************************************/
    var ETextureNames =
    {
        eSKYBOX_TEX : 0,
        eWATER_NORMAL_TEX : 1,
        eTEX_NAME_SIZE : 2
    };

    var EShaderNames =
    {
        eREFLECTION_ONLY_SHADER : 0,
        eSKYBOX_SHADER : 1,
        eMODEL_SHADER : 2,
        eTEX2D_SHADER : 3,
        ePLANE_TEX_SHADER : 4,
        eSHADER_SIZE : 5
    };

    var EDefineShaderNames =
    {
        eFULL_WATER_SHADER : 0,
        eNO_FRESNEL_SHADER : 1,
        eFOG_MODEL_SHADER : 2,
        eLIGHT_MODEL_SHADER : 3,
        eBUMP_REFLECT_WATER_SHADER : 4,
        eSPECULAR_MODEL_SHADER : 5,
        ePERTURB_MODEL_SHADER : 6,
        eDEFINE_SHADER_SIZE : 7
    };

    var EVertexBufferObjects =
    {
        eSKYBOX_VBO     : 0,
        eWATERPLANE_VBO : 1,
        eVBO_SIZE       : 2,
    };

    var EFrameBufferObjects =
    {
        eREFLECTION_FBO : 0,
        eREFRACTION_FBO : 1,
        eWATER_FBO : 2,
        eFBO_SIZE : 3
    };

    var EUserInterface =
    {
        eUI_NULL : 0,
        eTOGGLE_REFRACTION : 1,
        eTOGGLE_FRESNEL : 2,
        eTOGGLE_FOG : 3,
        eFOG_DEPTH : 4,
        eWAVE_DISTORTION : 5,
        eARTEFACT_FIX : 6,
        eRENDER_WATER_SCREEN_RES : 7,
        eUI_SIZE : 8
    };

    var ENodeNames =
    {
        eNODE_GROUND : 0,
        eNODE_BOXES : 1,
        eNODE_OLDBOAT : 2,
        eNODE_COINS : 3,
        eNODE_SHIP : 4,
        eNODE_SAILS : 5,
        eNODE_SHIPFLAG : 6,
        eNODE_PALMTREETRUNK : 7,
        eNODE_PALMLEAVES : 8,
        eNODE_SIZE : 9,
    };

    /****************************************************************************
     ** Structures
     ****************************************************************************/
    // Group shader programs and their uniform locations together
    var WaterShader = function()
    {
        this.uiId = 0;
        this.uiMVMatrixLoc = -1;
        this.uiMVPMatrixLoc = -1;
        this.uiEyePosLoc = -1;
        this.uiWaterColourLoc = -1;
        this.uiBumpTranslation0Loc = -1;
        this.uiBumpScale0Loc = -1;
        this.uiBumpTranslation1Loc = -1;
        this.uiBumpScale1Loc = -1;
        this.uiWaveDistortionLoc = -1;
        this.uiRcpWindowSizeLoc = -1;
        this.uiRcpMaxFogDepthLoc = -1;
        this.uiFogColourLoc = -1;
    };

    var SkyboxShader = function()
    {
        this.uiId = 0;
        this.uiMVPMatrixLoc = -1;
        this.uiModelMatrixLoc = -1;
        this.uiLightDirLoc = -1;
        this.uiEyePosLoc = -1;
        this.uiWaterHeightLoc = -1;
        this.uiFogColourLoc = -1;
        this.uiMaxFogDepthLoc = -1;
    };

    var ModelShader = function()
    {
        this.uiId = 0;
        this.uiMVPMatrixLoc = -1;
        this.uiModelMatrixLoc = -1;
        this.uiEyePosLoc = -1;
        this.uiLightDirectionLoc = -1;
        this.uiWaterHeightLoc = -1;
        this.uiFogColourLoc = -1;
        this.uiMaxFogDepthLoc = -1;
        this.uiTimeLoc = -1;
        this.uiEmissiveColLoc = -1;
        this.uiDiffuseColLoc = -1;
        this.uiSpecularColLoc = -1;

    };

    var Tex2DShader = function()
    {
        this.uiId = 0;
        this.uiMVPMatrixLoc = -1;
    };

    var PlaneTexShader = function()
    {
        this.uiId = 0;
        this.uiMVPMatrixLoc = -1;
        this.uiRcpWindowSizeLoc = -1;
    };

    /****************************************************************************
     ** Consts
     ****************************************************************************/
    // Water plane equations
    var c_uiNumberOfSkyboxTextures = 1;
    var c_uiNoOfDefines            = [3,2,2,1,1,2,2];
    var c_uiNoOfModels             = 1;
    var c_fDemoFrameRate           = 1.0 / 30.0;	// Used during animation
    var c_uiCamera                 = 0;  			// The camera to use from the .pod file

    var c_aszNodeNames =
    [
        "Ground",
        "Boxes",
        "OldBoat",
        "Coins",
        "Ship",
        "Sails",
        "ShipFlag",
        "PalmTreeTrunk",
        "PalmTreeLeaves",
    ];

    /******************************************************************************
      Content file names
     ******************************************************************************/
    // Source and binary shaders
    var c_aszFragShaderSrcFile=
    [
        "FragShader.fsh",
        "SkyboxFShader.fsh",
        "ModelFShader.fsh",
        "Tex2DFShader.fsh",
        "PlaneTexFShader.fsh"
    ];
    var c_aszFragShaderBinFile=
    [
        "FragShader.fsc",
        "SkyboxFShader.fsc",
        "ModelFShader.fsc",
        "Tex2DFShader.fsc",
        "PlaneTexFShader.fsc"
    ];
    var c_aszVertShaderSrcFile=
    [
        "VertShader.vsh",
        "SkyboxVShader.vsh",
        "ModelVShader.vsh",
        "Tex2DVShader.vsh",
        "PlaneTexVShader.vsh"
    ];
    var c_aszVertShaderBinFile=
    [
        "VertShader.vsc",
        "SkyboxVShader.vsc",
        "ModelVShader.vsc",
        "Tex2DVShader.vsc",
        "PlaneTexVShader.vsc"
    ];

    // PVR texture files
    var c_aszTextureNames=
    [
        "skybox.pvr",
        "normalmap.pvr"
    ];

    // Shader defines are used to control which code path is taken in each shader
    var c_aszFullWaterShaderDefines =
    [
        "ENABLE_REFRACTION",
        "ENABLE_FRESNEL",
        "ENABLE_DISTORTION"
    ];
    var c_aszFogShaderDefines =
    [
        "ENABLE_FOG_DEPTH",
        "ENABLE_LIGHTING"
    ];
    var c_aszNoFresnelShaderDefines =
    [
        "ENABLE_REFRACTION",
        "ENABLE_DISTORTION"

    ];
    var c_aszModelLightingDefines =
    [
        "ENABLE_LIGHTING"
    ];
    var c_aszModelSpecularDefines =
    [
        "ENABLE_LIGHTING",
        "ENABLE_SPECULAR",
    ];
    var c_aszModelPerturbDefines =
    [
        "ENABLE_LIGHTING",
        "ENABLE_PERTURB_VTX",
    ];
    var c_aszBumpedReflectionShaderDefines =
    [
        "ENABLE_DISTORTION"
    ];

    // Array of pointers to the defines for shaders
    var c_aszAllDefines =
    [
        c_aszFullWaterShaderDefines,
        c_aszNoFresnelShaderDefines,
        c_aszFogShaderDefines,
        c_aszModelLightingDefines,
        c_aszBumpedReflectionShaderDefines,
        c_aszModelSpecularDefines,
        c_aszModelPerturbDefines
    ];

    // POD scene files
    var c_aszModelFiles = "Scene.pod";

    /*!****************************************************************************
      @Function		sgn
      @Return		a			Returns the result of the signum function.
      @Description	Takes a var input and determines if it's value is greater than,
      equal to or less than zero. It returns a value within normal
      space to reflect this outcome
     ******************************************************************************/
    this.sgn = function(a)
    {
        if(a > 0.0) return(1.0);
        if(a < 0.0) return(-1.0);
        return 0.0;
    }

    var PVRSkybox = function(scale, adjustUV, textureSize)
    {
        this.setVertex = function(vertices, index, x, y, z, s, t)
        {
            vertices[index*5+0] = x;
            vertices[index*5+1] = y;
            vertices[index*5+2] = z;
            vertices[index*5+3] = s;
            vertices[index*5+4] = t;
        }

        var vertices = new Array();
        var unit     = 1;
        var a0 = 0, a1 = unit;

        if(adjustUV)
        {
            var oneOver = 1.0 / textureSize;
            a0 = 4.0 * oneOver;
            a1 = unit - a0;
        }

        // Front
        this.setVertex(vertices, 0, -unit, +unit, -unit, a0, a1);
        this.setVertex(vertices, 1, +unit, +unit, -unit, a1, a1);
        this.setVertex(vertices, 2, -unit, -unit, -unit, a0, a0);
        this.setVertex(vertices, 3, +unit, -unit, -unit, a1, a0);

        // Right
        this.setVertex(vertices, 4, +unit, +unit, -unit, a0, a1);
        this.setVertex(vertices, 5, +unit, +unit, +unit, a1, a1);
        this.setVertex(vertices, 6, +unit, -unit, -unit, a0, a0);
        this.setVertex(vertices, 7, +unit, -unit, +unit, a1, a0);

        // Back
        this.setVertex(vertices, 8 , +unit, +unit, +unit, a0, a1);
        this.setVertex(vertices, 9 , -unit, +unit, +unit, a1, a1);
        this.setVertex(vertices, 10, +unit, -unit, +unit, a0, a0);
        this.setVertex(vertices, 11, -unit, -unit, +unit, a1, a0);

        // Left
        this.setVertex(vertices, 12, -unit, +unit, +unit, a0, a1);
        this.setVertex(vertices, 13, -unit, +unit, -unit, a1, a1);
        this.setVertex(vertices, 14, -unit, -unit, +unit, a0, a0);
        this.setVertex(vertices, 15, -unit, -unit, -unit, a1, a0);

        // Top
        this.setVertex(vertices, 16, -unit, +unit, +unit, a0, a1);
        this.setVertex(vertices, 17, +unit, +unit, +unit, a1, a1);
        this.setVertex(vertices, 18, -unit, +unit, -unit, a0, a0);
        this.setVertex(vertices, 19, +unit, +unit, -unit, a1, a0);

        // Bottom
        this.setVertex(vertices, 20, -unit, -unit, -unit, a0, a1);
        this.setVertex(vertices, 21, +unit, -unit, -unit, a1, a1);
        this.setVertex(vertices, 22, -unit, -unit, +unit, a0, a0);
        this.setVertex(vertices, 23, +unit, -unit, +unit, a1, a0);

        for (var i=0; i<24*5; i+=5)
        {
            vertices[i+0] = vertices[i+0] * scale;
            vertices[i+1] = vertices[i+1] * scale;
            vertices[i+2] = vertices[i+2] * scale;
        }

        return vertices;
    }

    var PVRCalculateIntersectionLinePlane = function(intersection, plane, pv0, pv1, offset)
    {
        var vD = new PVRVector3();
        var fN, fD, fT;

        /* Calculate vector from point0 to point1 */
        vD.data[0] = pv1.data[0] - pv0.data[0];
        vD.data[1] = pv1.data[1] - pv0.data[1];
        vD.data[2] = pv1.data[2] - pv0.data[2];

        /* Denominator */
        fD =
            (plane.data[0] * vD.data[0]) +
            (plane.data[1] * vD.data[1]) +
            (plane.data[2] * vD.data[2]);

        /* Numerator */
        fN =
            (plane.data[0] * pv0.data[0]) +
            (plane.data[1] * pv0.data[1]) +
            (plane.data[2] * pv0.data[2]) +
            plane.data[3];

        fT = -fN / fD;

        /* And for a finale, calculate the intersection coordinate */
        intersection[0+offset] = pv0.data[0] + (fT * vD.data[0]);
        intersection[1+offset] = pv0.data[1] + (fT * vD.data[1]);
        intersection[2+offset] = pv0.data[2] + (fT * vD.data[2]);
    }

    var PVRInfinitePlane = function(stride, plane, viewProjInv, from, far)
    {
        var pvWorld  = [];
        var vertices = [];

        pvWorld[0] = {};
        pvWorld[1] = {};
        pvWorld[2] = {};
        pvWorld[3] = {};
        pvWorld[4] = {};

        /*
           Check whether the plane faces the camera
           */
        var fDotProduct = ((from.data[0] + (plane.data[0] * plane.data[3])) * plane.data[0]) +
                          ((from.data[1] + (plane.data[1] * plane.data[3])) * plane.data[1]) +
                          ((from.data[2] + (plane.data[2] * plane.data[3])) * plane.data[2]);

        if(fDotProduct < 0)
        {
            /* Camera is behind plane, hence it's not visible */
            return 0;
        }

        /*
           Back transform front clipping plane into world space,
           to give us a point on the line through each corner of the screen
           (from the camera).
           */

        /*             x = -1.0f;    y = -1.0f;     z = 1.0f;      w = 1.0f */
        pvWorld[0].x = ((-viewProjInv.data[ 0] - viewProjInv.data[ 4] + viewProjInv.data[ 8] + viewProjInv.data[12])* far);
        pvWorld[0].y = ((-viewProjInv.data[ 1] - viewProjInv.data[ 5] + viewProjInv.data[ 9] + viewProjInv.data[13])* far);
        pvWorld[0].z = ((-viewProjInv.data[ 2] - viewProjInv.data[ 6] + viewProjInv.data[10] + viewProjInv.data[14])* far);
        /*             x =  1.0f,    y = -1.0f,     z = 1.0f;      w = 1.0f */
        pvWorld[1].x = (( viewProjInv.data[ 0] - viewProjInv.data[ 4] + viewProjInv.data[ 8] + viewProjInv.data[12])* far);
        pvWorld[1].y = (( viewProjInv.data[ 1] - viewProjInv.data[ 5] + viewProjInv.data[ 9] + viewProjInv.data[13])* far);
        pvWorld[1].z = (( viewProjInv.data[ 2] - viewProjInv.data[ 6] + viewProjInv.data[10] + viewProjInv.data[14])* far);
        /*             x =  1.0f,    y =  1.0f,     z = 1.0f;      w = 1.0f */
        pvWorld[2].x = (( viewProjInv.data[ 0] + viewProjInv.data[ 4] + viewProjInv.data[ 8] + viewProjInv.data[12])* far);
        pvWorld[2].y = (( viewProjInv.data[ 1] + viewProjInv.data[ 5] + viewProjInv.data[ 9] + viewProjInv.data[13])* far);
        pvWorld[2].z = (( viewProjInv.data[ 2] + viewProjInv.data[ 6] + viewProjInv.data[10] + viewProjInv.data[14])* far);
        /*             x = -1.0f,    y =  1.0f,     z = 1.0f;      w = 1.0f */
        pvWorld[3].x = ((-viewProjInv.data[ 0] + viewProjInv.data[ 4] + viewProjInv.data[ 8] + viewProjInv.data[12])* far);
        pvWorld[3].y = ((-viewProjInv.data[ 1] + viewProjInv.data[ 5] + viewProjInv.data[ 9] + viewProjInv.data[13])* far);
        pvWorld[3].z = ((-viewProjInv.data[ 2] + viewProjInv.data[ 6] + viewProjInv.data[10] + viewProjInv.data[14])* far);

        /* We need to do a closed loop of the screen vertices, so copy the first vertex into the last */
        pvWorld[4] = pvWorld[0];

        /*
           Now build a pre-clipped polygon
           */

        /* Lets get ready to loop */
        var dwCount		= 0;
        var bClip		= false;

        var nVert  = 5;
        var offset = 0;
        while(nVert)
        {
            nVert--;

            /*
               Check which side of the Plane this corner of the far clipping
               plane is on. [A,B,C] of plane equation is the plane normal, D is
               distance from origin; hence [pvPlane->x * -pvPlane->w,
               pvPlane->y * -pvPlane->w,
               pvPlane->z * -pvPlane->w]
               is a point on the plane
               */
            fDotProduct =
                ((pvWorld[nVert].x + (plane.data[0] * plane.data[3])) * plane.data[0]) +
                ((pvWorld[nVert].y + (plane.data[1] * plane.data[3])) * plane.data[1]) +
                ((pvWorld[nVert].z + (plane.data[2] * plane.data[3])) * plane.data[2]);

            if(fDotProduct < 0)
            {
                /*
                   Behind plane; Vertex does NOT need clipping
                   */
                if(bClip == true)
                {
                    /* Clipping finished */
                    bClip = false;

                    /*
                       We've been clipping, so we need to add an additional
                       point on the line to this point, where clipping was
                       stopped.
                       */
                    var v0 = new PVRVector3(pvWorld[nVert+1].x, pvWorld[nVert+1].y, pvWorld[nVert+1].z);
                    var v1 = new PVRVector3(pvWorld[nVert].x,   pvWorld[nVert].y,   pvWorld[nVert].z);
                    PVRCalculateIntersectionLinePlane(vertices, plane, v0, v1, offset);
                    offset += stride;
                    dwCount++;
                }

                if(!nVert)
                {
                    /* Abort, abort: we've closed the loop with the clipped point */
                    break;
                }

                /* Add the current point */
                var v1 = new PVRVector3(pvWorld[nVert].x,   pvWorld[nVert].y,   pvWorld[nVert].z);
                PVRCalculateIntersectionLinePlane(vertices, plane, from, v1, offset);
                offset += stride;
                dwCount++;
            }
            else
            {
                /*
                   Before plane; Vertex DOES need clipping
                   */
                if(bClip == true)
                {
                    /* Already in clipping, skip point */
                    continue;
                }

                /* Clipping initiated */
                bClip = true;

                /* Don't bother with entry point on first vertex; will take care of it on last vertex (which is a repeat of first vertex) */
                if(nVert != 4)
                {
                    /* We need to add an additional point on the line to this point, where clipping was started */
                    var v0 = new PVRVector3(pvWorld[nVert+1].x, pvWorld[nVert+1].y, pvWorld[nVert+1].z);
                    var v1 = new PVRVector3(pvWorld[nVert].x,   pvWorld[nVert].y,   pvWorld[nVert].z);
                    PVRCalculateIntersectionLinePlane(vertices, plane, v0, v1, offset);
                    offset += stride;
                    dwCount++;
                }
            }
        }

        var ret = {};
        ret.count    = dwCount;
        ret.vertices = vertices;

        return ret;
    }

    /*!****************************************************************************
      @Function		LoadTextures
      @Output		pErrorStr		A string describing the error on failure
      @Return		bool			true if no error occured
      @Description	Loads the textures required for this training course
     ******************************************************************************/
    this.loadTextures = function(gl, errorStr)
    {
        // Load textures to array
        var i = 0;

        // Load cubemaps first
        for(; i < c_uiNumberOfSkyboxTextures; ++i)
        {
            (function(index, demo)
             {
                 PVRTexture.loadFromURI(gl, c_aszTextureNames[index], 0,
                     function(gl, id, h, m)
                     {
                         demo.auiTextureIds[index] = id;

                         //Clear the bit that denotes that this texture is loaded
                         demo.LoadingTextures &= ~(1<<index);
                         
                         if(gl.getError()) { alert("Error while loading texture!"); }
                         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                         gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                     });
             })(i, this);
        }

        // Load remaining textures
        for(; i < ETextureNames.eTEX_NAME_SIZE; ++i)
        {
            (function(index, demo)
             {
                 PVRTexture.loadFromURI(gl, c_aszTextureNames[index], 0,
                     function(gl, id, h, m)
                     {
                         demo.auiTextureIds[index] = id;
                         //Clear the bit that denotes that this texture is loaded
                         demo.LoadingTextures &= ~(1<<index);
                         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                     });
             })(i, this);
        }

        //Create normalisation cube map
        this.uiNormalisationCubeMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.uiNormalisationCubeMap);
        this.generateNormalisationCubeMap(gl, 8);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        // Allocate textures for reflection and refraction FBOs
        for(i = 0; i < EFrameBufferObjects.eFBO_SIZE - 1; ++i)
        {
            this.auiRendToTexture[i] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.auiRendToTexture[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB/*A*/, this.uiTexSize, this.uiTexSize, 0, gl.RGB/*A*/, gl.UNSIGNED_BYTE, null);

            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        // Allocate texture for water FBO
        this.auiRendToTexture[EFrameBufferObjects.eWATER_FBO] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.auiRendToTexture[EFrameBufferObjects.eWATER_FBO]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.uiWaterTexSize, this.uiWaterTexSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        // Load all textures for each model
        this.apuiModelTextureIds = new Array();

        for(var i = 0; i < this.Mesh.data.numMaterials; ++i)
        {
            this.apuiModelTextureIds[i] = new Object();
            this.apuiModelTextureIds[i].diffuse  = null;
            this.apuiModelTextureIds[i].specular = null;
            var Material = this.Mesh.data.materials[i];

            if(Material.data.diffuseTextureIndex != -1)
            {
                /*
                   Using the tools function PVRTTextureLoadFromPVR load the textures required by the pod file.

                   Note: This function only loads .pvr files. You can set the textures in 3D Studio Max to .pvr
                   files using the PVRTexTool plug-in for max. Alternatively, the pod material properties can be
                   modified in PVRShaman.
                   */

                var sTextureName = this.Mesh.data.textures[Material.data.diffuseTextureIndex].data.name;
                (function(texName, index, demo)
                 {
                     PVRTexture.loadFromURI(gl, sTextureName, 0,
                         function(gl, id, h, m)
                         {
                             demo.apuiModelTextureIds[index].diffuse = id;
                             gl.bindTexture(gl.TEXTURE_2D, id);
                             gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                             gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                            if(texName == "sand.pvr" || texName == "coins.pvr")
                            {
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                            }
                            else
                            {
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                            }
                         });
                 })(sTextureName, i, this);
            }
            if(Material.data.specularLevelTextureIndex != -1)
            {
                /*
                   Using the tools function PVRTTextureLoadFromPVR load the textures required by the pod file.

                   Note: This function only loads .pvr files. You can set the textures in 3D Studio Max to .pvr
                   files using the PVRTexTool plug-in for max. Alternatively, the pod material properties can be
                   modified in PVRShaman.
                   */

                var sTextureName = this.Mesh.data.textures[Material.data.specularLevelTextureIndex].data.name;
                (function(texName, index, demo)
                 {
                     PVRTexture.loadFromURI(gl, sTextureName, 0,
                         function(gl, id, h, m)
                         {
                             demo.apuiModelTextureIds[index].specular = id;
                             gl.bindTexture(gl.TEXTURE_2D, id);
                             gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                             gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                            if(texName == "coins-specular.pvr")
                            {
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                            }
                            else
                            {
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                            }
                         });
                 })(sTextureName, i, this);
            }
        }

        return true;
    }

    /*!****************************************************************************
      @Function		LoadWaterShader
      @Input/output	shaderProgram	The water shader to load
      @Input			uiShaderId		The shader's ID
      @Output		pErrorStr		A string describing the error on failure
      @Return		bool			true if no error occured
      @Description	Loads and compiles a water shader and links it to a shader program
     ******************************************************************************/
    this.loadWaterShader = function(gl, shaderProgram, uiShaderId, errorStr)
    {
        var aszWaterAttribs = ["inVertex"];
        shaderProgram.uiId = PVRShader.createProgram(gl, this.auiVertShaderIds[uiShaderId], this.auiFragShaderIds[uiShaderId], aszWaterAttribs, function(e) { alert(e); });
        if(!shaderProgram.uiId)
            return false;

        // Set the sampler2D variables
        gl.uniform1i(gl.getUniformLocation(shaderProgram.uiId, "NormalTex"), 0);
        gl.uniform1i(gl.getUniformLocation(shaderProgram.uiId, "ReflectionTex"),1);
        gl.uniform1i(gl.getUniformLocation(shaderProgram.uiId, "RefractionTex"),2);
        gl.uniform1i(gl.getUniformLocation(shaderProgram.uiId, "NormalisationCubeMap"),3);

        // Store the location of uniforms for later use
        shaderProgram.uiMVMatrixLoc					= gl.getUniformLocation(shaderProgram.uiId, "ModelViewMatrix");
        shaderProgram.uiMVPMatrixLoc				= gl.getUniformLocation(shaderProgram.uiId, "MVPMatrix");
        shaderProgram.uiEyePosLoc					= gl.getUniformLocation(shaderProgram.uiId, "EyePosition");
        shaderProgram.uiWaterColourLoc				= gl.getUniformLocation(shaderProgram.uiId, "WaterColour");
        shaderProgram.uiBumpTranslation0Loc			= gl.getUniformLocation(shaderProgram.uiId, "BumpTranslation0");
        shaderProgram.uiBumpScale0Loc				= gl.getUniformLocation(shaderProgram.uiId, "BumpScale0");
        shaderProgram.uiBumpTranslation1Loc			= gl.getUniformLocation(shaderProgram.uiId, "BumpTranslation1");
        shaderProgram.uiBumpScale1Loc				= gl.getUniformLocation(shaderProgram.uiId, "BumpScale1");
        shaderProgram.uiWaveDistortionLoc			= gl.getUniformLocation(shaderProgram.uiId, "WaveDistortion");
        shaderProgram.uiRcpWindowSizeLoc			= gl.getUniformLocation(shaderProgram.uiId, "RcpWindowSize");
	    shaderProgram.uiRcpMaxFogDepthLoc           = gl.getUniformLocation(shaderProgram.uiId, "RcpMaxFogDepth");
	    shaderProgram.uiFogColourLoc                = gl.getUniformLocation(shaderProgram.uiId, "FogColour");

        return true;
    }

    /*!****************************************************************************
      @Function		LoadModelShader
      @Input/output	shaderProgram	The model shader to load
      @Input			uiShaderId		The shader's ID
      @Output		pErrorStr		A string describing the error on failure
      @Return		bool			true if no error occured
      @Description	Loads and compiles a model shader and links it to a shader program
     ******************************************************************************/
    this.loadModelShader = function(gl, shaderProgram, uiShaderId, errorStr)
    {
        var aszModelAttribs = [ "inVertex", "inNormal", "inTexCoord"];
        shaderProgram.uiId = PVRShader.createProgram(gl, this.auiVertShaderIds[uiShaderId], this.auiFragShaderIds[uiShaderId], aszModelAttribs, function(e) { alert(e);});
        if(!shaderProgram.uiId)
            return false;

        gl.uniform1i(gl.getUniformLocation(shaderProgram.uiId, "ModelTexture"),0);
        gl.uniform1i(gl.getUniformLocation(shaderProgram.uiId, "ModelTextureSpec"),1);

        shaderProgram.uiMVPMatrixLoc				= gl.getUniformLocation(shaderProgram.uiId, "MVPMatrix");
        shaderProgram.uiModelMatrixLoc				= gl.getUniformLocation(shaderProgram.uiId, "ModelMatrix");
        shaderProgram.uiEyePosLoc              		= gl.getUniformLocation(shaderProgram.uiId, "EyePos");
        shaderProgram.uiLightDirectionLoc			= gl.getUniformLocation(shaderProgram.uiId, "LightDirection");
        shaderProgram.uiWaterHeightLoc				= gl.getUniformLocation(shaderProgram.uiId, "WaterHeight");
        shaderProgram.uiFogColourLoc				= gl.getUniformLocation(shaderProgram.uiId, "FogColour");
        shaderProgram.uiMaxFogDepthLoc				= gl.getUniformLocation(shaderProgram.uiId, "RcpMaxFogDepth");
    	shaderProgram.uiTimeLoc		    	    	= gl.getUniformLocation(shaderProgram.uiId, "fTime");
	    shaderProgram.uiEmissiveColLoc              = gl.getUniformLocation(shaderProgram.uiId, "EmissiveColour");
	    shaderProgram.uiDiffuseColLoc               = gl.getUniformLocation(shaderProgram.uiId, "DiffuseColour");
	    shaderProgram.uiSpecularColLoc              = gl.getUniformLocation(shaderProgram.uiId, "SpecularColour");

        return true;
    }

    /*!****************************************************************************
      @Function		LoadShaders
      @Output		pErrorStr		A string describing the error on failure
      @Return		bool			true if no error occured
      @Description	Loads and compiles shaders and links them to shader programs
     ******************************************************************************/
    this.loadShaders = function(gl, errorStr)
    {
        /*
           Load and compile the shaders from files.
           Binary shaders are tried first, source shaders
           are used as fallback.
           */

        for(var i = 0; i < EShaderNames.eSHADER_SIZE; ++i)
        {
            this.auiVertShaderIds[i] = PVRShader.loadFromURI(gl, c_aszVertShaderSrcFile[i], gl.VERTEX_SHADER, [], function(e){alert(e);});
            this.auiFragShaderIds[i] = PVRShader.loadFromURI(gl, c_aszFragShaderSrcFile[i], gl.FRAGMENT_SHADER, [], function(e){alert(e);});
        }

        // Assign pointers to the original source files the defines need to be prepended to
        var pDefVertShaderSrcFile = [	c_aszVertShaderSrcFile[EShaderNames.eREFLECTION_ONLY_SHADER],
            c_aszVertShaderSrcFile[EShaderNames.eREFLECTION_ONLY_SHADER],
            c_aszVertShaderSrcFile[EShaderNames.eMODEL_SHADER],
            c_aszVertShaderSrcFile[EShaderNames.eMODEL_SHADER],
            c_aszVertShaderSrcFile[EShaderNames.eREFLECTION_ONLY_SHADER],
            c_aszVertShaderSrcFile[EShaderNames.eMODEL_SHADER],
            c_aszVertShaderSrcFile[EShaderNames.eMODEL_SHADER]];
        var pDefFragShaderSrcFile = [	c_aszFragShaderSrcFile[EShaderNames.eREFLECTION_ONLY_SHADER],
            c_aszFragShaderSrcFile[EShaderNames.eREFLECTION_ONLY_SHADER],
            c_aszFragShaderSrcFile[EShaderNames.eMODEL_SHADER],
            c_aszFragShaderSrcFile[EShaderNames.eMODEL_SHADER],
            c_aszFragShaderSrcFile[EShaderNames.eREFLECTION_ONLY_SHADER],
            c_aszFragShaderSrcFile[EShaderNames.eMODEL_SHADER],
            c_aszFragShaderSrcFile[EShaderNames.eMODEL_SHADER]];

        // Load shaders using defines
        for(var i = 0; i < EDefineShaderNames.eDEFINE_SHADER_SIZE; ++i)
        {
            this.auiVertShaderIds[EShaderNames.eSHADER_SIZE + i] = PVRShader.loadFromURI(gl, pDefVertShaderSrcFile[i], gl.VERTEX_SHADER, c_aszAllDefines[i], function(e){alert(e);});
            this.auiFragShaderIds[EShaderNames.eSHADER_SIZE + i] = PVRShader.loadFromURI(gl, pDefFragShaderSrcFile[i], gl.FRAGMENT_SHADER, c_aszAllDefines[i], function(e){alert(e);});
        }


        /*
           Set up and link to water shader programs
           */

        if(!this.loadWaterShader(gl, this.ReflectionOnlyShader = new Object(), EShaderNames.eREFLECTION_ONLY_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadWaterShader(gl, this.FullWaterShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.eFULL_WATER_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadWaterShader(gl, this.NoFresnelWaterShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.eNO_FRESNEL_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadWaterShader(gl, this.BumpReflectionWaterShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.eBUMP_REFLECT_WATER_SHADER, errorStr))
        {
            return false;
        }

        /*
           Set up and link the sky box shader program
           */
        var aszSkyboxAttribs = [ "inVertex"];
        this.SkyboxShader = new Object();
        this.SkyboxShader.uiId = PVRShader.createProgram(gl, this.auiVertShaderIds[EShaderNames.eSKYBOX_SHADER], this.auiFragShaderIds[EShaderNames.eSKYBOX_SHADER], aszSkyboxAttribs, function(e){alert(e);});

        gl.uniform1i(gl.getUniformLocation(this.SkyboxShader.uiId, "CubeMap"),0);

        this.SkyboxShader.uiMVPMatrixLoc				= gl.getUniformLocation(this.SkyboxShader.uiId, "MVPMatrix");
        this.SkyboxShader.uiModelMatrixLoc				= gl.getUniformLocation(this.SkyboxShader.uiId, "ModelMatrix");
        this.SkyboxShader.uiEyePosLoc					= gl.getUniformLocation(this.SkyboxShader.uiId, "EyePosition");
        this.SkyboxShader.uiWaterHeightLoc				= gl.getUniformLocation(this.SkyboxShader.uiId, "WaterHeight");
        this.SkyboxShader.uiFogColourLoc				= gl.getUniformLocation(this.SkyboxShader.uiId, "FogColour");
        this.SkyboxShader.uiMaxFogDepthLoc				= gl.getUniformLocation(this.SkyboxShader.uiId, "RcpMaxFogDepth");

        /*
           Set up and link to the model shader programs
           */
        if(!this.loadModelShader(gl, this.ModelShader = new Object(), EShaderNames.eMODEL_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadModelShader(gl, this.FogModelShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.eFOG_MODEL_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadModelShader(gl, this.LightModelShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.eLIGHT_MODEL_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadModelShader(gl, this.SpecularModelShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.eSPECULAR_MODEL_SHADER, errorStr))
        {
            return false;
        }
        if(!this.loadModelShader(gl, this.PerturbModelShader = new Object(), EShaderNames.eSHADER_SIZE + EDefineShaderNames.ePERTURB_MODEL_SHADER, errorStr))
        {
            return false;
        }

        /*
           Set up and link to the Tex2D shader program
           */
        var aszTex2DAttribs = [ "inVertex", "inNormal", "inTexCoord"];
        this.Tex2DShader = new Object();
        this.Tex2DShader.uiId = PVRShader.createProgram(gl, this.auiVertShaderIds[EShaderNames.eTEX2D_SHADER], this.auiFragShaderIds[EShaderNames.eTEX2D_SHADER], aszTex2DAttribs, function(e){alert(e);});

        gl.uniform1i(gl.getUniformLocation(this.Tex2DShader.uiId, "Texture"),0);

        this.Tex2DShader.uiMVPMatrixLoc					= gl.getUniformLocation(this.Tex2DShader.uiId, "MVPMatrix");

        /*
           Set up and link to plane texturing shader program
           */
        var aszPlaneTexAttribs = ["inVertex"];
        this.PlaneTexShader = new Object();
        this.PlaneTexShader.uiId = PVRShader.createProgram(gl, this.auiVertShaderIds[EShaderNames.ePLANE_TEX_SHADER], this.auiFragShaderIds[EShaderNames.ePLANE_TEX_SHADER], aszPlaneTexAttribs, function(e){alert(e);});

        gl.uniform1i(gl.getUniformLocation(this.PlaneTexShader.uiId, "Texture"),0);

        this.PlaneTexShader.uiMVPMatrixLoc					= gl.getUniformLocation(this.PlaneTexShader.uiId, "MVPMatrix");
        this.PlaneTexShader.uiRcpWindowSizeLoc				= gl.getUniformLocation(this.PlaneTexShader.uiId, "RcpWindowSize");

        return true;
    }

    /*!****************************************************************************
      @Function		LoadVbos
      @Output		pErrorStr		A string describing the error on failure
      @Description	Loads data into	vertex buffer objects
     ******************************************************************************/
    this.loadVbos = function(gl, errorStr)
    {
        // Load models into VBOs
        if(!this.apuiModelVbo)
            this.apuiModelVbo = new Array();

        if(!this.apuiModelIndexVbo)
            this.apuiModelIndexVbo = new Array();

        /*
           Load vertex data of all meshes in the scene into VBOs

           The meshes have been exported with the "Interleave Vectors" option,
           so all data is interleaved in the buffer at pMesh->pInterleaved.
           Interleaving data improves the memory access pattern and cache efficiency,
           thus it can be read faster by the hardware.
           */
        for (var i = 0; i < this.Mesh.data.numMeshes; ++i)
        {
            this.apuiModelVbo[i] = gl.createBuffer();

            // Load vertex data into buffer object
            var Mesh = this.Mesh.data.meshes[i];
            gl.bindBuffer(gl.ARRAY_BUFFER, this.apuiModelVbo[i]);
            gl.bufferData(gl.ARRAY_BUFFER, Mesh.data.vertexElementData[0], gl.STATIC_DRAW);

            // Load index data into buffer object if available
            this.apuiModelIndexVbo[i] = 0;
            if (Mesh.data.faces.data.length)
            {
                this.apuiModelIndexVbo[i] = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.apuiModelIndexVbo[i]);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Mesh.data.faces.data, gl.STATIC_DRAW);
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // Skybox
        this.auiVBOIds[EVertexBufferObjects.eSKYBOX_VBO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.auiVBOIds[EVertexBufferObjects.eSKYBOX_VBO]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.SkyboxVertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Water plane
        this.auiVBOIds[EVertexBufferObjects.eWATERPLANE_VBO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.auiVBOIds[EVertexBufferObjects.eWATERPLANE_VBO]);
        gl.bufferData(gl.ARRAY_BUFFER, 5*3*4, gl.DYNAMIC_DRAW); // 5 vertices with 3 components which are 4 bytes wide
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return true;
    }

    var loadPOD = function(stream, demo)
    {
		demo.Mesh = new PVRModel();
		var podLoader    = new PVRPODLoader();
		var result       = podLoader.load(stream, demo.Mesh);
		if(result != EPODErrorCodes.eNoError)
		{
			alert("Failed to load POD: " + result);
			return;
		}

        // Retrieve node indexes
	    for(var i = 0; i < ENodeNames.eNODE_SIZE; ++i)
	    {
		    for(var j = 0; j < demo.Mesh.data.numNodes; ++j)
		    {
			    var node = demo.Mesh.data.nodes[j];
			    if(node.data.name == c_aszNodeNames[i])
			    {
				    demo.NodeIndexName[j] = i;
				    demo.NodeNameIndex[i] = j;
		    	}
		    }
	    }

        // Set light direction
        demo.vLightDirection = demo.Mesh.getLightDirection(0);

        demo.MeshesLoadFinished = 1;
    }

    /*!****************************************************************************
      @Function		InitApplication
      @Return		bool		true if no error occured
      @Description	Code in InitApplication() will be called by PVRShell once per
      run, before the rendering context is created.
      Used to initialize variables that are not dependant on it
      (e.g. external modules, loading meshes, etc.)
      If the rendering context is lost, InitApplication() will
      not be called again.
     ******************************************************************************/
    this.initApplication = function()
    {
        this.apuiModelVbo = [];
        this.apuiModelIndexVbo = [];
        this.apuiModelTextureIds = [];
        this.Mesh = [];
        this.auiRendToTexture = [];
        this.auiVBOIds = [];
        this.auiVertShaderIds = [];
        this.auiFragShaderIds = [];
        this.auiFBOIds = [];
        this.auiDepthBuffer = [];
        this.NodeIndexName = [];
        this.NodeNameIndex = [];
        this.auiTextureIds = [null, null];
        this.vRcpWindowSize = new PVRVector2();

        this.bPause = false;					// NOTE: Should be set to false!
        // Set null pointers for all models
        this.apuiModelVbo = null;
        this.apuiModelIndexVbo = null;
        this.apuiModelTextureIds = null;

        // Set timer variables
        this.ulCurrentTime  = PVRShell.getTimeNow();
        this.ulPreviousTime = this.ulCurrentTime;
        this.fCount = 0;
        this.uiFrameCount = 0;
        this.uiFPS = 0;

        // Load meshes
        this.MeshesLoadFinished = 0;
        this.LoadingTextures = 0;
        //Set a bit for each texture so that we can check completion
        for (var i = 0 ; i < ETextureNames.eTEX_NAME_SIZE; ++i)
        {
            this.LoadingTextures |= (1<<i);
        }

        // Load the POD file
        (function(demo)
         {
             var fs = new PVRFileStream();
             fs.Open(c_aszModelFiles, true, loadPOD, demo);
         })(this);

        // Set UI variables
        this.iCurrentUIOption = 0;
        this.resetVariables();

        // Set animation variables
        this.fFOV = 60.0 * (PVRMaths.PI/180.0);
        this.fFrame = 0;

        return true;
    }

    /*!****************************************************************************
      @Function		ResetVariables
      @Description	Resets all variables to their original value. This allows
      the user to reset the scene during run-time
     ******************************************************************************/
    this.resetVariables = function()
    {
        this.vCamUp = new PVRVector3(0.00, 1.0001, 0.00);


        // Set variables
        this.vPlaneWater        = new PVRVector4(0.0, 1.0, 0.0, 0.0);
        this.vWaterColour       = new PVRVector4(0.2,0.25,0.30,1.0);
        this.vFogColour         = new PVRVector4(0.85, 0.95, 1.0, 1.0);
        this.fWaterHeight       = 0.0;
        this.fMaxFogDepth       = 100.0;
        this.fMaxFogHeight      = 2000.0;
        this.fWaveDistortion    = 100.0;
        this.fWindSpeed         = 10.0;
        this.bFogDepth          = false;
        this.fWaterArtefactFix  = 3.0;
        this.fBoatSpeed         = 0.05;

        // Normal map values
        this.vBumpVelocity0 = new PVRVector2(0.016,-0.014);
        this.vBumpTranslation0 = new PVRVector3(0.0,0.0,0.0);	// No translation should be applied
        this.vBumpScale0 = new PVRVector2(0.0012,0.0012);
        this.vBumpVelocity1 = new PVRVector2(0.025,-0.03);
        this.vBumpTranslation1 = new PVRVector3(0.0,0.0,0.0);	// No translation should be applied
        this.vBumpScale1 = new PVRVector2(0.0005,0.0005);

        this.bShaderRefraction = true;
        this.bShaderFogging = true;
        this.bShaderFresnel = true;
        this.bDisplayDebugWindows = false;
        this.bClipPlane = false;
        this.bWaterAtScreenRes = true;
    }

    /*!****************************************************************************
      @Function		QuitApplication
      @Return		bool		true if no error occured
      @Description	Code in QuitApplication() will be called by PVRShell once per
      run, just before exiting the program.
      If the rendering context is lost, QuitApplication() will
      not be called.
     ******************************************************************************/
    this.quitApplication = function()
    {
        return true;
    }

    /*!****************************************************************************
      @Function		InitView
      @Return		bool		true if no error occured
      @Description	Code in InitView() will be called by PVRShell upon
      initialization or after a change in the rendering context.
      Used to initialize variables that are dependant on the rendering
      context (e.g. textures, vertex buffers, etc.)
     ******************************************************************************/
    this.initialiseScene = function(gl)
    {
        var errorStr;

        // Calculate our FBO sizes based on the window dimensions
        this.uiWaterTexSize = this.uiTexSize = PVRMaths.POTLower(Math.min(PVRShell.data.width, PVRShell.data.height), 1);

        // Create the skybox
        var data = new PVRSkybox(1500.0, true, 512);
        this.SkyboxVertices  = data;

        /*
           Load textures
           */
        if (!this.loadTextures(gl, errorStr))
        {
            return false;
        }

        /*
           Load in the vertex buffered objects
           */
        if(!this.loadVbos(gl, errorStr))
        {
            return false;
        }

        /*
           Load ad compile the shaders & link programs
           */
        if (!this.loadShaders(gl, errorStr))
        {
            return false;
        }

        this.windowWidth  = PVRShell.data.width;
        this.windowHeight = PVRShell.data.height;

        /*
           Initialize Print3D
           */
        this.Print3D = new PVRPrint3D();
        this.Print3D.setTextures(gl, PVRShell.data.width, PVRShell.data.height)

        /*
           Calculate the projection and view matrices
           */
        this.setProjection();
        this.setView();

        this.iOriginalFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        // Enable culling and depth test
        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Use the water colour for clearing
        gl.clearColor(this.vWaterColour.data[0], this.vWaterColour.data[1], this.vWaterColour.data[2], 1.0);

        // Reflection and refraction FBO
        for(var i = 0; i < EFrameBufferObjects.eFBO_SIZE - 1; ++i)
        {
            this.auiFBOIds[i] = gl.createFramebuffer();
            this.auiDepthBuffer[i] = gl.createRenderbuffer();

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.auiFBOIds[i]);

            // Attach the texture that the frame buffer will render to
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.auiRendToTexture[i],0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Create anda attach a depth buffer
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.auiDepthBuffer[i]);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.uiTexSize, this.uiTexSize);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.auiDepthBuffer[i]);

            if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
            {
                return false;
            }
        }

        this.auiFBOIds[EFrameBufferObjects.eWATER_FBO] = gl.createFramebuffer();
        this.auiDepthBuffer[EFrameBufferObjects.eWATER_FBO] = gl.createRenderbuffer();

        // The water texture size may be different from the reflection & refraction textures, so it is set up seperately
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.auiFBOIds[EFrameBufferObjects.eWATER_FBO]);

        // Attach the texture that the frame buffer will render to
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.auiRendToTexture[EFrameBufferObjects.eWATER_FBO],0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Create anda attach a depth buffer
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.auiDepthBuffer[EFrameBufferObjects.eWATER_FBO]);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.uiWaterTexSize, this.uiWaterTexSize);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.auiDepthBuffer[EFrameBufferObjects.eWATER_FBO]);

        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
        {
            return false;
        }

        // Bind the original frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.iOriginalFBO);

        return true;
    }

    /*!****************************************************************************
      @Function		ReleaseView
      @Return		bool		true if no error occured
      @Description	Code in ReleaseView() will be called by PVRShell when the
      application quits or before a change in the rendering context.
     ******************************************************************************/
    this.releaseView = function(gl)
    {
        // Delete textures
        for(var i = 0; i < ETextureNames.eTEX_NAME_SIZE; ++i)
        {
            gl.deleteTexture(this.auiTextureIds[i]);
        }

        for(var i = 0; i < EFrameBufferObjects.eFBO_SIZE; ++i)
            gl.deleteTexture(this.auiRendToTexture[i]);

        for(var j = 0; j < this.Mesh.nNumMaterial; ++j)
        {
            gl.deleteTexture(this.apuiModelTextureIds[j].diffuse);
            gl.deleteTexture(this.apuiModelTextureIds[j].specular);
        }

        this.apuiModelTextureIds = 0;

        // Delete program and shader objects
        gl.deleteProgram(this.ReflectionOnlyShader.uiId);
        gl.deleteProgram(this.SkyboxShader.uiId);
        gl.deleteProgram(this.Tex2DShader.uiId);
        gl.deleteProgram(this.FullWaterShader.uiId);
        gl.deleteProgram(this.BumpReflectionWaterShader.uiId);
        gl.deleteProgram(this.NoFresnelWaterShader.uiId);
        gl.deleteProgram(this.ModelShader.uiId);
        gl.deleteProgram(this.FogModelShader.uiId);
        gl.deleteProgram(this.PlaneTexShader.uiId);
        gl.deleteProgram(this.LightModelShader.uiId);
        gl.deleteProgram(this.SpecularModelShader.uiId);
        gl.deleteProgram(this.PerturbModelShader.uiId);
        for(var i = 0 ; i < EShaderNames.eSHADER_SIZE + EDefineShaderNames.eDEFINE_SHADER_SIZE; ++i)
        {
            gl.deleteShader(this.auiVertShaderIds[i]);
            gl.deleteShader(this.auiFragShaderIds[i]);
        }

        // Delete buffer objects
        for(var i = 0; i < EVertexBufferObjects.eVBO_SIZE; ++i)
            gl.deleteBuffer(this.auiVBOIds[i]);


        for(var i = 0; i < EFrameBufferObjects.eFBO_SIZE; ++i)
            gl.deleteFramebuffer(this.auiFBOIds[i]);

        for(var j = 0; j < this.Mesh.data.numMesh; ++j)
        {
            gl.deleteBuffer(this.apuiModelVbo[j]);
            gl.deleteBuffer(this.apuiModelIndexVbo[j]);
        }

        // Release Print3D Textures
//         this.Print3D.releaseTextures(); // TODO

        // Destroy the Skybox
  // TODO      PVRTDestroySkybox( this.SkyboxVertices, this.SkyboxTexCoords);

        return true;
    }

    /*!****************************************************************************
      @Function		RenderScene
      @Return		bool		true if no error occured
      @Description	Main rendering loop function of the program. The shell will
      call this function every frame.
      egl.swapBuffers() will be performed by PVRShell automatically.
      PVRShell will also manage important OS events.
      The user has access to these events through an abstraction
      layer provided by PVRShell.
     ******************************************************************************/
    this.renderScene = function(gl)
    {
        if(!this.MeshesLoadFinished) //Wait for models
        {
			return true;
        }

        if(!this.sceneInitialised)  //Wait for scene initialisation
        {
            if(!this.initialiseScene(gl))
                return false;

            this.sceneInitialised = true;
        }

        if (this.LoadingTextures)
        {
            return true; //Wait for texture loading
        }
        this.updateTimer();			// Update timer variables

        // Set the scene animation
        if(!this.bPause)
        {
            this.fFrame += (((this.ulCurrentTime - this.ulPreviousTime) * c_fDemoFrameRate)) * this.fBoatSpeed;	// value is scaled by animation speed
            if(this.fFrame > this.Mesh.data.numFrames - 1)
            {
                this.fFrame = 0;
            }
        }
        this.Mesh.setCurrentFrame(this.fFrame);

        if(PVRShell.data.width != this.windowWidth || PVRShell.data.heigt != this.windowHeight)
        {
            // Resize Print3D
            this.Print3D.resize(PVRShell.data.width, PVRShell.data.height);
            this.windowWidth  = PVRShell.data.width;
            this.windowHeight = PVRShell.data.height;
        }

        // Perform reflection render pass
        gl.cullFace(gl.FRONT);

        this.renderReflectionTexture(gl);

        gl.cullFace(gl.BACK);

        if(this.bShaderRefraction)
        {
            this.renderRefractionTexture(gl);	// Only perform the refraction render pass if it is needed
        }

        if(!this.bWaterAtScreenRes)
        {
            // Render water texture
            if(this.bShaderRefraction && this.bShaderFresnel)
            {
                this.renderWaterTexture(gl, this.FullWaterShader);
            }
            else if(this.bShaderRefraction)
            {
                this.renderWaterTexture(gl, this.NoFresnelWaterShader);
            }
            else
            {
                this.renderWaterTexture(gl, this.BumpReflectionWaterShader);
            }
        }

        // Bind the main frame bufffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.iOriginalFBO);
        gl.viewport(0,0, PVRShell.data.width, PVRShell.data.height);
        // Clear the color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.setView();
        this.setProjection(this.fFOV);

        /*
           Draw the scene
           */
        this.drawScene(gl);

        /*
           The water can be rendered at the screen resolution,
           or at a lower res to reduce the fragment processing workload
           */
        if(this.bWaterAtScreenRes)
        {
            if(this.bShaderRefraction && this.bShaderFresnel)
            {
                this.drawWater(gl, this.FullWaterShader, PVRShell.data.width, PVRShell.data.height, this.vPlaneWater);
            }
            else if(this.bShaderRefraction)
            {
                this.drawWater(gl, this.NoFresnelWaterShader, PVRShell.data.width, PVRShell.data.height, this.vPlaneWater);
            }
            else
            {
                this.drawWater(gl, this.BumpReflectionWaterShader, PVRShell.data.width, PVRShell.data.height, this.vPlaneWater);
            }
        }
        else
        {
            this.drawWaterFromTexture(gl);
        }

        // Displays the demo name using the Print3D tool. For a detailed explanation, see the training course IntroducingPVRTools
        this.Print3D.displayDefaultTitle("Water", "", EPVRPrint3D.Logo.PowerVR);

        this.Print3D.flush(gl);

        return true;
    }

    /*!****************************************************************************
      @Function		RenderReflectionTexture
      @Description	Renders the scence (excluding the water) so a reflection
      texture for the frame can be calculated. The water plane is used
      during clipping so that only objects above the water are rendered.
      See section 2.3 of the corresponding white paper for more information
     ******************************************************************************/
    this.renderReflectionTexture = function(gl)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.auiFBOIds[EFrameBufferObjects.eREFLECTION_FBO]);	// Bind a frame buffer that has a texture attached (stores the render in a texture)
        gl.viewport(0,0, this.uiTexSize, this.uiTexSize);							// Set the viewport to the texture size
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        this.setView();
        this.setProjection(this.fFOV);

        // Mirror the view matrix about the plane.
        var mMirrorCam = PVRMatrix4x4.identity();
        mMirrorCam.data[1] = -this.vPlaneWater.data[0];
        mMirrorCam.data[5] = -this.vPlaneWater.data[1];
        mMirrorCam.data[9] = -this.vPlaneWater.data[2];
        mMirrorCam.data[13] = -(2.0 * this.vPlaneWater.data[3]);

        this.mView = PVRMatrix4x4.matrixMultiply(this.mView, mMirrorCam);

        this.modifyProjectionForClipping(PVRVector4.add(this.vPlaneWater, new PVRVector4(0.0,0.0,0.0, this.fWaterArtefactFix)));

        this.drawScene(gl);
    }

    /*!****************************************************************************
      @Function		RenderRefractionTexture
      @Description	Renders the scence (excluding the water) so that refraction
      (including depth, when enabled) for the frame can be calculated.
      When depth shading is enabled, the skybox is ommited from the render.
      See section 2.4 of the corresponding white paper for more information
     ******************************************************************************/
    this.renderRefractionTexture = function(gl)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.auiFBOIds[EFrameBufferObjects.eREFRACTION_FBO]);	// Bind a frame buffer that has a texture and depth texture attached (stores the render in a texture)
        gl.viewport(0,0, this.uiTexSize, this.uiTexSize);
        // Use the water colour for clearing
        gl.clearColor(this.vWaterColour.data[0], this.vWaterColour.data[1], this.vWaterColour.data[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        this.setView();
        this.setProjection(this.fFOV);

        var vPlaneView = new PVRVector4(-this.vPlaneWater.data[0], -this.vPlaneWater.data[1], -this.vPlaneWater.data[2], -this.vPlaneWater.data[3] + this.fWaterArtefactFix);
        this.modifyProjectionForClipping(vPlaneView);

        // Allow fogging to be toggled by the user
        if(this.bShaderFogging)
        {
            this.drawRefractionScene(gl);
        }
        else
        {
            this.drawScene(gl);
        }
    }

    /*!****************************************************************************
      @Function		RenderWaterTexture
      @Input			shaderProgram	The water shader program to be applied during the render
      @Description	Render the water effect to a lower resolution texture
      that can then be applied to the plane's surface.
      See section 3.3.3 of the corresponding white paper for more information
     ******************************************************************************/
    this.renderWaterTexture = function(shaderProgram)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.auiFBOIds[EFrameBufferObjects.eWATER_FBO]);
        gl.viewport(0,0, this.uiWaterTexSize, this.uiWaterTexSize);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        this.setView();
        this.setProjection(this.fFOV);

        this.drawMesh(this.NodeNameIndex[ENodeNames.eNODE_GROUND], this.LightModelShader);				// Only draw the terrain
        this.drawWater(shaderProgram, this.uiWaterTexSize, this.uiWaterTexSize, this.vPlaneWater);
    }

    /*!****************************************************************************
      @Function		DrawScene
      @Input			shaderProgram	The water shader program to be applied during the render
      @Description	Draw all elements of the scene, excluding the water
     ******************************************************************************/
    this.drawScene = function(gl)
    {
        // Draw meshes
        for (var i = 0; i < this.Mesh.data.numMeshNodes; ++i)
        {
            var shaderProgram = null;
            switch (this.NodeIndexName[i])
            {
                case ENodeNames.eNODE_COINS:
                    shaderProgram = this.SpecularModelShader;
                    break;
                case ENodeNames.eNODE_SHIPFLAG:
                    shaderProgram = this.PerturbModelShader;
                    break;
                default:
                    shaderProgram = this.LightModelShader;
                    break;
            }

		    this.drawMesh(gl, i, shaderProgram);
	    }

        // Reset the projection before the skyox so that the sky box wont be clipped, as it should appear infinite.
        this.setProjection(this.fFOV);

        this.drawSkybox(gl, this.auiTextureIds[ETextureNames.eSKYBOX_TEX], this.SkyboxShader, EVertexBufferObjects.eSKYBOX_VBO, new PVRVector3(0.0, 0.0, 0.0));
    }

    /*!****************************************************************************
      @Function		DrawRefractionScene
      @Input			shaderProgram	The water shader program to be applied during the render
      @Description	Draw
      all elements of the scene, excluding the water and the sky box.
     ******************************************************************************/
    this.drawRefractionScene = function(gl)
    {
        // Draw meshes
        for (var i = 0; i < this.Mesh.data.numMeshNodes; ++i)
        {
            var shaderProgram = null;
            switch (this.NodeIndexName[i])
            {
                case ENodeNames.eNODE_COINS:
                    shaderProgram = this.SpecularModelShader;  // Override the incoming shader.
                    break;
                default:
                    shaderProgram = this.FogModelShader;
                    break;
            }

            this.drawMesh(gl, i, shaderProgram);
        }
    }

    /*!****************************************************************************
      @Function		DrawMesh
      @Input			uiModelNumber		The element to draw from the POD array
      @Input			i32NodeIndex		Node index of the mesh to draw
      @Input			shaderProgram		The water shader program to be applied during the render
      @Description	Draws a SPODMesh after the model view matrix has been set and
      the material has been prepared.
     ******************************************************************************/
    this.drawMesh = function(gl, i32NodeIndex, shaderProgram)
    {
        var node         = this.Mesh.data.nodes[i32NodeIndex];
        var i32MeshIndex = node.data.index;
        var Mesh         = this.Mesh.data.meshes[i32MeshIndex];

        // Load the correct texture using the texture lookup table
        var uiDiffuse  = null;
        var uiSpecular = null;
        if(node.materialIndex != -1)
        {
            uiDiffuse  = this.apuiModelTextureIds[node.data.materialIndex].diffuse;
            uiSpecular = this.apuiModelTextureIds[node.data.materialIndex].specular;
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, uiDiffuse);

        // Activate the specular map unit
        if(uiSpecular)
        {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, uiSpecular);
            gl.activeTexture(gl.TEXTURE0);
        }

        // Use shader program
        gl.useProgram(shaderProgram.uiId);

        /*
           Set the shading parameters
           */

        // Extract the world matrix for the model from the POD file
        var mModel = this.Mesh.getWorldMatrix(i32NodeIndex);

        var mModelView = PVRMatrix4x4.matrixMultiply(this.mView, mModel);
        gl.uniformMatrix4fv(shaderProgram.uiModelMatrixLoc, gl.FALSE, mModel.data);

        // Set eye position in world space
        gl.uniform3fv(shaderProgram.uiEyePosLoc, this.vEyePos.data);

        var mMVP       = PVRMatrix4x4.matrixMultiply(this.mProjection, mModelView);
        gl.uniformMatrix4fv(shaderProgram.uiMVPMatrixLoc, gl.FALSE, mMVP.data);

        // Set light direction in world space
        gl.uniform4fv(shaderProgram.uiLightDirectionLoc, this.vLightDirection.data);

        var vWaterCol3 = new PVRVector3(this.vWaterColour.data[0], this.vWaterColour.data[1], this.vWaterColour.data[2]);
        gl.uniform1f(shaderProgram.uiWaterHeightLoc, -this.vPlaneWater.data[3]);		// Negate the scale to represent the water's distance along the y-axis in world coordinates
        gl.uniform3fv(shaderProgram.uiFogColourLoc,   vWaterCol3.data);	// Only requires the rgb values of colour
        gl.uniform1f(shaderProgram.uiMaxFogDepthLoc,  1.0/this.fMaxFogDepth);	// Invert fog depth to avoid division in fragment shader
        gl.uniform1f(shaderProgram.uiTimeLoc, this.fElapsedTimeInSecs * this.fWindSpeed);

        // Colours
        var mat = this.Mesh.data.materials[node.data.materialIndex];
        gl.uniform3fv(shaderProgram.uiDiffuseColLoc,  mat.data.diffuse);
        gl.uniform3fv(shaderProgram.uiEmissiveColLoc, mat.data.ambient);
        gl.uniform3fv(shaderProgram.uiSpecularColLoc, mat.data.specular);

        // bind the VBO for the mesh
        gl.bindBuffer(gl.ARRAY_BUFFER, this.apuiModelVbo[i32MeshIndex]);
        // bind the index buffer, won't hurt if the handle is 0
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.apuiModelIndexVbo[i32MeshIndex]);

        // Enable the vertex attribute arrays
        gl.enableVertexAttribArray(VERTEX_ARRAY);
        gl.enableVertexAttribArray(NORMAL_ARRAY);
        gl.enableVertexAttribArray(TEXCOORD_ARRAY);

        // Set the vertex attribute offsets
        var positions = Mesh.data.vertexElements["POSITION0"];
        var normals   = Mesh.data.vertexElements["NORMAL0"];
        var uvs       = Mesh.data.vertexElements["UV0"];
        gl.vertexAttribPointer(VERTEX_ARRAY, positions.numComponents, gl.FLOAT, gl.FALSE, positions.stride, positions.offset);
        gl.vertexAttribPointer(NORMAL_ARRAY, normals.numComponents, gl.FLOAT, gl.FALSE, normals.stride, normals.offset);
        gl.vertexAttribPointer(TEXCOORD_ARRAY, uvs.numComponents, gl.FLOAT, gl.FALSE, uvs.stride, uvs.offset);

        /*
           The geometry can be exported in 4 ways:
           - Indexed Triangle list
           - Non-Indexed Triangle list
           - Indexed Triangle strips
           - Non-Indexed Triangle strips
           */
        if(Mesh.data.primitiveData.numStrips == 0)
        {
            if(this.apuiModelIndexVbo[i32MeshIndex])
            {
                // Indexed Triangle list
                gl.drawElements(gl.TRIANGLES, Mesh.data.faces.data.length, gl.UNSIGNED_SHORT, 0);
            }
            else
            {
                // Non-Indexed Triangle list
                gl.drawArrays(gl.TRIANGLES, 0, Mesh.data.faces.data.length);
            }
        }
        else
        {
            for(var i = 0; i < Mesh.data.primitiveData.numStrips; ++i)
            {
                var offset = 0;
                if(this.apuiModelIndexVbo[i32MeshIndex])
                {
                    // Indexed Triangle strips
                    gl.drawElements(gl.TRIANGLE_STRIP, Mesh.data.primitiveData.stripLengths[i]+2, gl.UNSIGNED_SHORT, (offset*2));
                }
                else
                {
                    // Non-Indexed Triangle strips
                    gl.drawArrays(gl.TRIANGLE_STRIP, offset, Mesh.data.primitiveData.stripLength[i]+2);
                }
                offset += Mesh.data.primitiveData.stripLength[i]+2;
            }
        }

        // Safely disable the vertex attribute arrays
        gl.disableVertexAttribArray(VERTEX_ARRAY);
        gl.disableVertexAttribArray(NORMAL_ARRAY);
        gl.disableVertexAttribArray(TEXCOORD_ARRAY);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    /*!****************************************************************************
      @Function		DrawInfinitePlane
      @Input			vPlane				The plane (in the form (A,B,C,D)) that represents the plane in the world
      @Input			fFarDistance		The far clip plane distance
      @Description	Draws an infinite plane using variables from the program
     ******************************************************************************/
    this.drawInfinitePlane = function(gl, vPlane, fFarDistance)
    {
        if(fFarDistance == undefined)
            fFarDistance = CAM_FAR;

        // Calc ViewProjInv matrix
        var mTmp = PVRMatrix4x4.matrixMultiply(this.mProjection, this.mView);
        mTmp     = PVRMatrix4x4.inverse(mTmp);

        var data = PVRInfinitePlane(3, vPlane, mTmp, this.vEyePos, fFarDistance);
        this.i32WaterPlaneNo = data.count;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.auiVBOIds[EVertexBufferObjects.eWATERPLANE_VBO]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.DYNAMIC_DRAW);

        gl.disable(gl.CULL_FACE);

        // Enable the vertex attribute arrays
        gl.enableVertexAttribArray(VERTEX_ARRAY);

        // Draw water
        if(this.i32WaterPlaneNo)
        {
            // Set the vertex attribute offsets
            gl.vertexAttribPointer(VERTEX_ARRAY, 3, gl.FLOAT, gl.FALSE, 0, 0);

            // Draw primitive
            gl.drawArrays(gl.TRIANGLE_FAN, 0, this.i32WaterPlaneNo);
        }

        // Safely disable the vertex attribute arrays
        gl.disableVertexAttribArray(VERTEX_ARRAY);

        gl.enable(gl.CULL_FACE);
    }

    /*!****************************************************************************
      @Function		DrawWater
      @Input			shaderProgram		The shader to be applied to the water plane
      @Input			uiViewPortWidth		The width of current viewport
      @Input			uiViewPortHeight	The height of the current viewport
      @Input			vPlane				The plane (in the form (A,B,C,D)) that represents the plane in the world
      @Input			fFarDistance		The far clip plane distance
      @Description	Draws the water
     ******************************************************************************/
    this.drawWater = function(gl, shaderProgram, uiViewPortWidth, uiViewPortHeight, vPlane, fFarDistance)
    {
        if(fFarDistance == undefined)
            fFarDistance = CAM_FAR;

        // Use shader program
        gl.useProgram(shaderProgram.uiId);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.auiTextureIds[ETextureNames.eWATER_NORMAL_TEX]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.auiRendToTexture[EFrameBufferObjects.eREFLECTION_FBO]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.auiRendToTexture[EFrameBufferObjects.eREFRACTION_FBO]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.uiNormalisationCubeMap);

        // Set model view matrix for water
        gl.uniformMatrix4fv(shaderProgram.uiMVMatrixLoc, gl.FALSE, this.mView.data);

        // Set model view projection matrix for water
        var mMVP = PVRMatrix4x4.matrixMultiply(this.mProjection, this.mView);
        gl.uniformMatrix4fv(shaderProgram.uiMVPMatrixLoc, gl.FALSE, mMVP.data);

        // Set eye position in model space
        var vEyePosModel = PVRMatrix4x4.vectorMultiply(PVRMatrix4x4.inverse(this.mView), new PVRVector4(0.0, 0.0, 0.0, 1.0));
        var vEyePos3 = new PVRVector3(vEyePosModel.data[0], vEyePosModel.data[1], vEyePosModel.data[2]);
        gl.uniform3fv(shaderProgram.uiEyePosLoc, vEyePos3.data);

        /*
           Set the remaining shader parameters
           */
        gl.uniform4fv(shaderProgram.uiWaterColourLoc, this.vWaterColour.data);

        if(!this.bPause)
        {
            var tmp;

            tmp = PVRVector2.scalarMultiply(this.vBumpVelocity0, this.fDeltaTime);
            this.vBumpTranslation0 = PVRVector2.add(this.vBumpTranslation0, tmp);
            tmp = PVRVector2.scalarMultiply(this.vBumpVelocity1, this.fDeltaTime);
            this.vBumpTranslation1 = PVRVector2.add(this.vBumpTranslation1, tmp);

            this.vBumpTranslation0 = new PVRVector2(this.vBumpTranslation0.data[0] % 1.0,
                                                    this.vBumpTranslation0.data[1] % 1.0);

            this.vBumpTranslation1 = new PVRVector2(this.vBumpTranslation1.data[0] % 1.0,
                                                    this.vBumpTranslation1.data[1] % 1.0);
        }

        gl.uniform2fv(shaderProgram.uiBumpTranslation0Loc, this.vBumpTranslation0.data);
        gl.uniform2fv(shaderProgram.uiBumpScale0Loc, this.vBumpScale0.data);
        gl.uniform2fv(shaderProgram.uiBumpTranslation0Loc, this.vBumpTranslation1.data);
        gl.uniform2fv(shaderProgram.uiBumpScale1Loc, this.vBumpScale1.data);
        gl.uniform1f(shaderProgram.uiWaveDistortionLoc, this.fWaveDistortion);
        gl.uniform1f(shaderProgram.uiRcpMaxFogDepthLoc, 1.0/this.fMaxFogHeight);
        gl.uniform4fv(shaderProgram.uiFogColourLoc, this.vFogColour.data);

        this.vRcpWindowSize.data[0] = 1.0/uiViewPortWidth;
        this.vRcpWindowSize.data[1] = 1.0/uiViewPortHeight;

        gl.uniform2fv(shaderProgram.uiRcpWindowSizeLoc, this.vRcpWindowSize.data);

        this.drawInfinitePlane(gl, vPlane, fFarDistance);
    }

    /*!****************************************************************************
      @Function		DrawWaterFromTexture
      @Input			fFarDistance			The far clip plane distance
      @Description	Renders a plane that is textured with the texture created in the
      water texture render pass
     ******************************************************************************/
    this.drawWaterFromTexture = function(gl, fFarDistance)
    {
        if(fFarDistance == undefined)
            fFarDistance = CAM_FAR;

        // Use shader program
        gl.useProgram(this.PlaneTexShader.uiId);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.auiRendToTexture[EFrameBufferObjects.eWATER_FBO]);

        var mMVP = PVRMatrix4x4.matrixMultiply(this.mProjection, this.mView);
        gl.uniformMatrix4fv(this.PlaneTexShader.uiMVPMatrixLoc, gl.FALSE, mMVP.data);

        this.vRcpWindowSize.x = 1.0/PVRShell.data.width;
        this.vRcpWindowSize.y = 1.0/PVRShell.data.height;

        gl.uniform2fv(this.PlaneTexShader.uiRcpWindowSizeLoc, this.vRcpWindowSize.data);

        this.drawInfinitePlane(this.vPlaneWater, fFarDistance);
    }

    /*!****************************************************************************
      @Function		DrawSkybox
      @Input			uiCubeMapHandle		The handle to the skybox's cube map
      @Input			shaderProgram		The shader to apply to the skybox
      @Input			uiVboId				The id of the skybox's VBO
      @Input			vTranslation		The translation appied to the skybox
      @Description	Draws the skybox
     ******************************************************************************/
    this.drawSkybox = function(gl, uiCubeMapHandle, shaderProgram, uiVboId, vTranslation)
    {
        if(vTranslation == undefined)
            vTranslation = new PVRVector3(0.0, 0.0, 0.0);

        // Use shader program
        gl.useProgram(shaderProgram.uiId);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, uiCubeMapHandle);

        // Rotate and Translate the model matrix (if required)
        var mModel = PVRMatrix4x4.identity();
        mModel = PVRMatrix4x4.matrixMultiply(mModel, PVRMatrix4x4.translation(vTranslation.data[0],
                    vTranslation.data[1], vTranslation.data[2]));
        gl.uniformMatrix4fv(shaderProgram.uiModelMatrixLoc, gl.FALSE, mModel.data);

        // Set model view projection matrix
        var mModelView = PVRMatrix4x4.matrixMultiply(this.mView, mModel);
        var mMVP       = PVRMatrix4x4.matrixMultiply(this.mProjection, mModelView);
        gl.uniformMatrix4fv(shaderProgram.uiMVPMatrixLoc, gl.FALSE, mMVP.data);

        // Set eye position in model space
        var vEyePosModel = PVRMatrix4x4.vectorMultiply(PVRMatrix4x4.inverse(mModelView), new PVRVector4(0.0, 0.0, 0.0, 1.0));
        vEyePosModel = new PVRVector3(vEyePosModel.data[0], vEyePosModel.data[1], vEyePosModel.data[2]);
        gl.uniform3fv(shaderProgram.uiEyePosLoc, vEyePosModel.data);

        gl.uniform1f(shaderProgram.uiWaterHeightLoc, -this.vPlaneWater.data[3]);		// Negate the scale to represent it in world sapce
        gl.uniform4fv(shaderProgram.uiFogColourLoc, this.vFogColour.data);	// Only requires the rgb values of colour
        gl.uniform1f(shaderProgram.uiMaxFogDepthLoc, 1.0/(this.fMaxFogHeight/5.0));	// Invert fog depth to save division in fragment shader. Compress.

        gl.disable(gl.CULL_FACE);

        // bind the VBO for the mesh
        gl.bindBuffer(gl.ARRAY_BUFFER, this.auiVBOIds[uiVboId]);
        gl.vertexAttribPointer(VERTEX_ARRAY, 3, gl.FLOAT, gl.FALSE, 4*5, 0);

        // Enable the vertex attribute arrays
        gl.enableVertexAttribArray(VERTEX_ARRAY);

        for(var i = 0; i < 6; ++i)
        {
            // Draw primitive
            gl.drawArrays(gl.TRIANGLE_STRIP, i*4, 4);
        }

        // Safely disable the vertex attribute arrays
        gl.disableVertexAttribArray(VERTEX_ARRAY);

        gl.enable(gl.CULL_FACE);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /*!****************************************************************************
      @Function		SetProjection
      @Input			fVOV		The field of view required.
      @Input			fFarClip	The far clip plane
      @Description	Sets the projection matrix using the width, height, near clipping,
      far clipping etc.
     ******************************************************************************/
    this.setProjection = function(fFOV, fFarClip)
    {
        if(fFOV == undefined)
        {
            fFOV = 60.0 * (PVRMaths.PI/180.0);
        }
        if(fFarClip == undefined)
        {
            fFarClip = CAM_FAR;
        }

        var fAspect = PVRShell.data.width/PVRShell.data.height;
        this.mProjection = PVRMatrix4x4.createPerspectiveProjection(CAM_NEAR, fFarClip, fFOV, fAspect);
    }

    /*!****************************************************************************
      @Function		SetView
      @Description	Sets the view matrix using the camera variables
     ******************************************************************************/
    this.setView = function()
    {
        var i32CamID = this.Mesh.data.nodes[this.Mesh.data.numMeshNodes + this.Mesh.data.numLights + c_uiCamera].data.index;

        // Get the camera position, target and field of view
        if(this.Mesh.data.cameras[i32CamID].data.targetIndex != -1)
        {
            var props = this.Mesh.getCameraProperties(c_uiCamera);
            this.fFOV = props.fov;
            this.vEyePos = props.from;
            this.vLookAt = props.to;
        }
        else
        {
            this.fFOV = this.Mesh.getCamera(this.vEyePos, this.vLookAt, this.vCamUp, c_uiCamera);	// vLookAt is calculated from the rotation
        }

        // Create the view matrix from the camera information extracted from the pod
        this.mView = PVRMatrix4x4.createLookAt(this.vEyePos, this.vLookAt, this.vCamUp);
    }
    /*!****************************************************************************
      @Function		ModifyProjectionForClipping
      @Input			vClipPlane	The user defined clip plane
      @Description	Modifies the projection matrix so that the near clipping plane
      matches that of the clip plane that has been passed in. This allows
      the projection matrix to be used to perform clipping -
      See section 3.1 of the corresponding white paper for more information
     ******************************************************************************/
    this.modifyProjectionForClipping = function(vClipPlane)
    {
        // TODO
        var brokenMultiply = function(matrix, vector)
        {
            // Do an 'incorrect' vector*matrix, to replicate the old tools.
            var v = new PVRVector4();
            v.data[0] = matrix.data[0]*vector.data[0] + matrix.data[1]*vector.data[1] + matrix.data[2]*vector.data[2]  + matrix.data[3]*vector.data[3];
            v.data[1] = matrix.data[4]*vector.data[0] + matrix.data[5]*vector.data[1] + matrix.data[6]*vector.data[2]  + matrix.data[7]*vector.data[3];
            v.data[2] = matrix.data[8]*vector.data[0] + matrix.data[9]*vector.data[1] + matrix.data[10]*vector.data[2] + matrix.data[11]*vector.data[3];
            v.data[3] = matrix.data[12]*vector.data[0] + matrix.data[13]*vector.data[1] + matrix.data[14]*vector.data[2] + matrix.data[15]*vector.data[3];
            return v
        }

        var mInvView = PVRMatrix4x4.inverse(this.mView);
        // Do an 'incorrect' multiply to replicate the old tools.
        var vClipPlaneView = brokenMultiply(mInvView, vClipPlane);

        /*
           Calculate the clip-space corner point opposite the clipping plane
           and transform it into camera space by multiplying it by the inverse
           projection matrix.
           */
        var vClipSpaceCorner = new PVRVector4(this.sgn(vClipPlaneView.data[0]), this.sgn(vClipPlaneView.data[1]),1.0,1.0);
        vClipSpaceCorner = brokenMultiply(PVRMatrix4x4.inverse(this.mProjection), vClipSpaceCorner);

        // Calculate the scaled plane vector
        var vScaledPlane = PVRVector4.scalarMultiply(vClipPlaneView, (2.0 / PVRVector4.dot(vClipSpaceCorner, vClipPlaneView)));

        // Replace the third row of the matrix
        this.mProjection.data[2]  = vScaledPlane.data[0];
        this.mProjection.data[6]  = vScaledPlane.data[1];
        this.mProjection.data[10] = vScaledPlane.data[2] + 1.0;
        this.mProjection.data[14] = vScaledPlane.data[3];
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    //	//	Generate normalisation cube map
    //	Downloaded from: www.paulsprojects.net
    //	Created:	20th July 2002
    //
    //	Copyright (c) 2006, Paul Baker
    //	Distributed under the New BSD Licence. (http://www.paulsprojects.net/NewBSDLicense.txt)
    //////////////////////////////////////////////////////////////////////////////////////////
    /*!****************************************************************************
      @Function		GenerateNormalisationCubeMap
      @Input			uiTextureSize		The size of the cube map's textures
      @Description	Generates a normalization cube map for the shaders to use -
      See section 3.3.1 of the whitepaper for more information
     ******************************************************************************/
    this.generateNormalisationCubeMap = function(gl, uiTextureSize)
    {
        if(uiTextureSize == undefined)
            uiTextureSize = 32;

        // variables
        var fOffset = 0.5;
        var fHalfSize = uiTextureSize *0.5;
        var vTemp = new PVRVector3();
        var offset;
        var pData = new Uint8Array(uiTextureSize*uiTextureSize*3);

        // Positive X
        offset = 0;

        for(var j = 0; j < uiTextureSize; ++j)
        {
            for(var i = 0; i < uiTextureSize; ++i)
            {
                vTemp.data[0] = fHalfSize;
                vTemp.data[1] = -(j + fOffset - fHalfSize);
                vTemp.data[2] = -(i + fOffset - fHalfSize);

                // normalise, pack 0 to 1 here, and normalise again
                vTemp.normalise();
                vTemp = PVRVector3.scalarMultiply(vTemp, 0.5);
                vTemp = PVRVector3.scalarAdd(vTemp, 0.5);

                pData[0+offset] = (vTemp.data[0] * 255);
                pData[1+offset] = (vTemp.data[1] * 255);
                pData[2+offset] = (vTemp.data[2] * 255);

                offset += 3;
            }
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB /*gl.RGBA8*/, uiTextureSize, uiTextureSize, 0, gl.RGB, gl.UNSIGNED_BYTE, pData);

        // Negative X
        offset = 0;

        for(var j = 0; j < uiTextureSize; ++j)
        {
            for(var i = 0; i < uiTextureSize; ++i)
            {
                vTemp.data[0] = -fHalfSize;
                vTemp.data[1] = -(j + fOffset - fHalfSize);
                vTemp.data[2] = (i + fOffset - fHalfSize);


                // normalise, pack 0 to 1 here, and normalise again
                vTemp.normalise();
                vTemp = PVRVector3.scalarMultiply(vTemp, 0.5);
                vTemp = PVRVector3.scalarAdd(vTemp, 0.5);

                pData[0+offset] = (vTemp.data[0] * 255);
                pData[1+offset] = (vTemp.data[1] * 255);
                pData[2+offset] = (vTemp.data[2] * 255);

                offset += 3;
            }
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB /*gl.RGBA8*/, uiTextureSize, uiTextureSize, 0, gl.RGB, gl.UNSIGNED_BYTE, pData);

        // Positive Y
        offset = 0;

        for(var j = 0; j < uiTextureSize; ++j)
        {
            for(var i = 0; i < uiTextureSize; ++i)
            {
                vTemp.data[0] = i + fOffset - fHalfSize;
                vTemp.data[1] = fHalfSize;
                vTemp.data[2] = j + fOffset - fHalfSize;

                // normalise, pack 0 to 1 here, and normalise again
                vTemp.normalise();
                vTemp = PVRVector3.scalarMultiply(vTemp, 0.5);
                vTemp = PVRVector3.scalarAdd(vTemp, 0.5);

                pData[0+offset] = (vTemp.data[0] * 255);
                pData[1+offset] = (vTemp.data[1] * 255);
                pData[2+offset] = (vTemp.data[2] * 255);

                offset += 3;
            }
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB /*gl.RGBA8*/, uiTextureSize, uiTextureSize, 0, gl.RGB, gl.UNSIGNED_BYTE, pData);

        // Negative Y
        offset = 0;

        for(var j = 0; j < uiTextureSize; ++j)
        {
            for(var i = 0; i < uiTextureSize; ++i)
            {
                vTemp.data[0] = i + fOffset - fHalfSize;
                vTemp.data[1] = -fHalfSize;
                vTemp.data[2] = -(j + fOffset - fHalfSize);

                // normalise, pack 0 to 1 here, and normalise again
                vTemp.normalise();
                vTemp = PVRVector3.scalarMultiply(vTemp, 0.5);
                vTemp = PVRVector3.scalarAdd(vTemp, 0.5);

                pData[0+offset] = (vTemp.data[0] * 255);
                pData[1+offset] = (vTemp.data[1] * 255);
                pData[2+offset] = (vTemp.data[2] * 255);

                offset += 3;
            }
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB /*gl.RGBA8*/, uiTextureSize, uiTextureSize, 0, gl.RGB, gl.UNSIGNED_BYTE, pData);

        // Positive Z
        offset = 0;

        for(var j = 0; j < uiTextureSize; ++j)
        {
            for(var i = 0; i < uiTextureSize; ++i)
            {
                vTemp.data[0] = i + fOffset - fHalfSize;
                vTemp.data[1] = -(j + fOffset - fHalfSize);
                vTemp.data[2] = fHalfSize;

                // normalise, pack 0 to 1 here, and normalise again
                vTemp.normalise();
                vTemp = PVRVector3.scalarMultiply(vTemp, 0.5);
                vTemp = PVRVector3.scalarAdd(vTemp, 0.5);

                pData[0+offset] = (vTemp.data[0] * 255);
                pData[1+offset] = (vTemp.data[1] * 255);
                pData[2+offset] = (vTemp.data[2] * 255);

                offset += 3;
            }
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB /*gl.RGBA8*/, uiTextureSize, uiTextureSize, 0, gl.RGB, gl.UNSIGNED_BYTE, pData);

        // Negative Z
        offset = 0;

        for(var j = 0; j < uiTextureSize; ++j)
        {
            for(var i = 0; i < uiTextureSize; ++i)
            {
                vTemp.data[0] = -(i + fOffset - fHalfSize);
                vTemp.data[1] = -(j + fOffset - fHalfSize);
                vTemp.data[2] = -fHalfSize;

                // normalise, pack 0 to 1 here, and normalise again
                vTemp.normalise();
                vTemp = PVRVector3.scalarMultiply(vTemp, 0.5);
                vTemp = PVRVector3.scalarAdd(vTemp, 0.5);

                pData[0+offset] = (vTemp.data[0] * 255);
                pData[1+offset] = (vTemp.data[1] * 255);
                pData[2+offset] = (vTemp.data[2] * 255);

                offset += 3;
            }
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB /*gl.RGBA8*/, uiTextureSize, uiTextureSize, 0, gl.RGB, gl.UNSIGNED_BYTE, pData);

        return true;
    }

    /*!****************************************************************************
      @Function		UpdateTimer
      @Input			none
      @Description	Updates the values of the current time, previous time, current time
      in seconds, delta time and the FPS counter used in the program
     ******************************************************************************/
    this.updateTimer = function()
    {
        this.uiFrameCount++;

        this.ulPreviousTime = this.ulCurrentTime;
        this.ulCurrentTime = PVRShell.getTimeNow();

        this.fElapsedTimeInSecs = this.ulCurrentTime * 0.001;
        this.fDeltaTime = (this.ulCurrentTime - this.ulPreviousTime)*0.001;

        this.fCount += this.fDeltaTime;

        if(this.fCount >= 1.0)			// Update FPS once a second
        {
            this.uiFPS = this.uiFrameCount;
            this.uiFrameCount = 0;
            this.fCount = 0;
        }
    }
}
