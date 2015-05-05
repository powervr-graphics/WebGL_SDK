/******************************************************************************

 @File         PVRTTextureAtlas.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#ifndef _PVRTEXTUREATLAS__H_
#define _PVRTEXTUREATLAS__H_

#include <map>
#include <string>
#include <istream>

#include "PVRParser.h"
#include "PVRTVector.h"

namespace pvrnavigation
{
/*!***********************************************************************
 *	@Struct PVRTTextureAtlasIndex
 *	@Brief  Structure describing an entity in a texture atlas. The item is
 *          described by an offset and it's dimensions within the atlas
 ************************************************************************/
struct PVRTTextureAtlasIndex
{
	PVRTVec2 offset;
	PVRTVec2 span;
};


/*!***********************************************************************
 *	@Class  PVRTTextureAtlas
 *	@Brief  Class implementing functionality of a simple texture atlas.
 ************************************************************************/
class PVRTTextureAtlas
{
public:

	/*!********************************************************************************************
     @Function		Constructor
    ***********************************************************************************************/
	PVRTTextureAtlas();

	/*!********************************************************************************************
     @Function		Destructor
    ***********************************************************************************************/
	~PVRTTextureAtlas();

	/*!********************************************************************************************
     @Function		LoadAtlasDefinitionFromFile
     @Input			pszFilename     The file to load the atlas definition from.
     @Return        bool            True if successful, false otherwise.
     @Description	Loads an atlas definition from a textual description.
    ***********************************************************************************************/
	bool LoadAtlasDefinitionFromFile(const char *pszFilename);

	/*!********************************************************************************************
     @Function		LoadAtlasDefinitionFromFile
     @Input			file            The file to load the atlas definition from.
     @Return        bool            True if successful, false otherwise.
     @Description	Loads an atlas definition from a textual description.
    ***********************************************************************************************/
	bool LoadAtlasDefinitionFromFile(std::istream &file);

	/*!********************************************************************************************
     @Function		GetTextureMatrix
     @Input			szTextureName   The name of the texture.
     @Return        PVRTMat3        Matrix describing the transformation to map a unit quad onto the
	                                desired texture.
     @Description	Calculates a transformation matrix for the texture coordinates to map onto the 
	                desired texture.
    ***********************************************************************************************/
	PVRTMat3 GetTextureMatrix(const std::string &szTextureName) const;

	/*!********************************************************************************************
     @Function		GetTextureOffset
     @Input			szTextureName   The name of the texture.
     @Input         offset          The uv-start coordinates in the texture atlas will be stored
	                                into that variable.
	 @Return                        True when the texture was found in the atlas, false otherwise.
     @Description	Returns the uv-coordinates of the lower left corner of the queried texture in
	                the atlas.
    ***********************************************************************************************/
	bool GetTextureOffset(const std::string &szTextureName, PVRTVec2 &offset) const;

	/*!********************************************************************************************
     @Function		GetTextureSpan
     @Input			szTextureName   The name of the texture.
     @Input         span            The width and height of the texture encoded as uv-coordinates
	                                will be stored in that variable.
	 @Return                        True when the texture was found in the atlas, false otherwise.
     @Description	Returns the width and height of the texture in the atlas encoded as 
	                uv-coordinates.
    ***********************************************************************************************/
	bool GetTextureSpan(const std::string &szTextureName, PVRTVec2 &span) const;

	/*!********************************************************************************************
     @Function		Contains
     @Input			szTextureName   The name of the texture.
     @Return        bool            True if the texture was found in the atlas, false otherwise.
     @Description	Checks whether a given texture is contained within the texture atlas.
    ***********************************************************************************************/
	bool Contains(const std::string &szTextureName) const;

protected:

	bool LoadAtlasDefinitionFromFile(PVRParser &parser);

	PVRTMat3 CalculateTransformation(const PVRTVec2 start, const PVRTVec2 end, const PVRTVec2 border) const;

	struct TexRegistrationInfo
	{
		PVRTTextureAtlasIndex uv_coords;
		PVRTMat3 transformation;
	};

	std::map<std::string, TexRegistrationInfo> m_vRegistrationMap;
};

};

#endif // _PVRTEXTUREATLAS__H_

/******************************************************************************
 End of file (PVRTextureAtlas.h)
******************************************************************************/

