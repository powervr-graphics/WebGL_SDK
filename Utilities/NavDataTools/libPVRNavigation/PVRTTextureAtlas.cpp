/******************************************************************************

 @File         PVRTTextureAtlas.cpp

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#include "PVRTTextureAtlas.h"

#include <fstream>
#include <map>
#include <string>
using namespace std;

#include "PVRParser.h"


namespace pvrnavigation
{

PVRTTextureAtlas::PVRTTextureAtlas()
{
}

PVRTTextureAtlas::~PVRTTextureAtlas()
{
}

bool PVRTTextureAtlas::LoadAtlasDefinitionFromFile(const char *pszFilename)
{
	PVRParser parser;
	if (!parser.parse(pszFilename))
		return false;

	return LoadAtlasDefinitionFromFile(parser);
}

bool PVRTTextureAtlas::LoadAtlasDefinitionFromFile(istream &file)
{	
	PVRParser parser;
	if (!parser.parse(file))
		return false;
		
	return LoadAtlasDefinitionFromFile(parser);
}

bool PVRTTextureAtlas::LoadAtlasDefinitionFromFile(PVRParser &parser)
{	
	unsigned int ui32Width = parser.parse_unsigned_int();
	unsigned int ui32Height = parser.parse_unsigned_int();

	const unsigned int numTextures = parser.parse_unsigned_int();
	
	for (unsigned int i=0; i < numTextures; i++)
	{
		string name = parser.parse_string();

		TexRegistrationInfo info;

		info.uv_coords.offset.x = parser.parse_float();
		info.uv_coords.offset.y = parser.parse_float();
		info.uv_coords.span.x = parser.parse_float();
		info.uv_coords.span.y = parser.parse_float();

		info.transformation = CalculateTransformation(info.uv_coords.offset, info.uv_coords.span, PVRTVec2(0.0f, 0.0f));
		
		m_vRegistrationMap[name] = info;
	}
	
	return true;
}



PVRTMat3 PVRTTextureAtlas::GetTextureMatrix(const std::string &szTextureName) const
{
	map<string, TexRegistrationInfo>::const_iterator iter = m_vRegistrationMap.find(szTextureName);
	if (iter == m_vRegistrationMap.end())
		return PVRTMat3::Identity();

	return iter->second.transformation;
}

bool PVRTTextureAtlas::GetTextureOffset(const std::string &szTextureName, PVRTVec2 &offset) const
{
	map<string, TexRegistrationInfo>::const_iterator iter = m_vRegistrationMap.find(szTextureName);
	if (iter == m_vRegistrationMap.end())
	{
		offset = PVRTVec2(0.0f, 0.0f);
		return false;
	}

	offset = iter->second.uv_coords.offset;
	return true;
}

bool PVRTTextureAtlas::GetTextureSpan(const std::string &szTextureName, PVRTVec2 &span) const
{
	map<string, TexRegistrationInfo>::const_iterator iter = m_vRegistrationMap.find(szTextureName);
	if (iter == m_vRegistrationMap.end())
	{
		span = PVRTVec2(0.0f, 0.0f);
		return false;
	}

	span = iter->second.uv_coords.span;
	return true;
}


bool PVRTTextureAtlas::Contains(const std::string &szTextureName) const
{
	map<string, TexRegistrationInfo>::const_iterator iter = m_vRegistrationMap.find(szTextureName);
	if (iter == m_vRegistrationMap.end())
		return false;
	else
		return true;
}


PVRTMat3 PVRTTextureAtlas::CalculateTransformation(const PVRTVec2 offset, const PVRTVec2 span, const PVRTVec2 border) const
{	
	return PVRTMat3(span.x - border.x, 0.0f, 0.0f,
		            0.0f, span.y - border.y, 0.0f,
		            offset.x + border.x, offset.y + border.y, 0.0f);
}

};


/******************************************************************************
 End of file (PVRTextureAtlas.cpp)
******************************************************************************/

