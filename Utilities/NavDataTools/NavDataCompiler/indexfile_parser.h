/******************************************************************************

 @File         indexfile_parser.h

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Indexfile parser declarations.

******************************************************************************/

#ifndef _INDEXFILE_PARSER__H_
#define _INDEXFILE_PARSER__H_

#include "PVRTVector.h"
#include <string>
#include <vector>
#include <set>

/*!****************************************************************************
 @Enum  	MapLayerOperation
 @Brief     Enumeration of all map layer related transformation operations
            available.
******************************************************************************/
enum MapLayerOperation
{
	EXTRACT_ROADS,	
	EXTRACT_SIGNS,
	EXTRACT_TEXT_BILLBOARDS,
	EXTRACT_TEXT_TRIANGLES,
	EXTRACT_POLYGONS,
};

/*!****************************************************************************
 @Struct	TextureAttributes
 @Brief     Texture related attributes used for data transformation.
******************************************************************************/
struct TextureAttributes
{
	std::string texture_atlas;
};

/*!****************************************************************************
 @Struct	RoadAttributes
 @Brief     Road triangulation related attributes.
******************************************************************************/
struct RoadAttributes
{
	float width;
	PVRTMat3 texture_matrix;
	bool triangulate_caps;
	bool triangulate_intersections;
	std::set<int> func_classes;
};

/*!****************************************************************************
 @Struct	TextAttributes
 @Brief     Text related attributes used for data transformation.
******************************************************************************/
struct TextAttributes
{
	std::string texture_atlas;
	PVRTVec2 scale;
};

/*!****************************************************************************
 @Struct	MapFileDescription
 @Brief     Contains all necessary information for data transformation step.
******************************************************************************/
struct MapFileDescription
{
	MapFileDescription()
	{
		identifier = "unknown";
		input_path = "input path unknown";
		output_path = "output path unknown";
		input_filename = "input file unknown";
		output_filename = "output file unknown";

		map_subdiv_recursions = 0;
		bucket_subdiv_recursions = 0;
		min_primitive_count = 0;
	}

	std::string identifier;
	std::string input_path;
	std::string input_filename;
	std::string output_path;
	std::string output_filename;

	MapLayerOperation layeroperation;
	
	TextureAttributes texture_attributes;
	RoadAttributes    road_attributes;
	TextAttributes    text_attributes;
	
	unsigned int map_subdiv_recursions;
	unsigned int bucket_subdiv_recursions;
	unsigned int min_primitive_count;
};


/*!********************************************************************************************
 @Function		parse_indexfile
 @Input			pszFilename         Name of the file to parse.
 @Input         filedescripions     Vector where all the descriptions will be stored.
 @Return        bool                Indicates whether the primitives intersect or not.
 @Description	Parses a file 
***********************************************************************************************/
bool parse_indexfile(const char *pszFilename, std::vector<MapFileDescription> &filedescriptions);

#endif // _INDEXFILE_PARSER__H_
