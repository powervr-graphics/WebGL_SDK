/******************************************************************************

 @File         indexfile_parser.cpp

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Functionality to parse indexfiles which define the data
               transformation process.

******************************************************************************/

#include "indexfile_parser.h"
#include "common.h"
#include "PVRNavigation.h"
using namespace pvrnavigation;

#include <vector>
#include <iostream>
using namespace std;

//********************************************
//*  Function declarations
//********************************************
void parse_texture_attributes(PVRParser &parser, TextureAttributes &attribs);
void parse_road_attributes(PVRParser &parser, RoadAttributes &attribs);
void parse_text_attributes(PVRParser &parser, TextAttributes &attribs);

/*!********************************************************************************************
 @Function		parse_indexfile
 @Input			pszFilename         Name of the file to parse.
 @Input         filedescripions     Vector where all the descriptions will be stored.
 @Return        bool                Indicates whether the primitives intersect or not.
 @Description	Parses a file 
***********************************************************************************************/
bool parse_indexfile(const char *pszFilename, vector<MapFileDescription> &filedescriptions)
{
	MapFileDescription desc;

	PVRParser parser;
	if (!parser.parse(pszFilename))
		return false;
	
	unsigned int filecount = parser.parse_unsigned_int();
	if (filecount == 0)
		return false;
	
	desc.input_path = parser.parse_string();
	desc.output_path = parser.parse_string();
	
	for (unsigned int i=0; i < filecount; i++)
	{
		desc.identifier = parser.parse_string();
		desc.map_subdiv_recursions = parser.parse_unsigned_int();
		desc.bucket_subdiv_recursions = parser.parse_unsigned_int();
		desc.min_primitive_count = parser.parse_unsigned_int();
		desc.input_filename = parser.parse_string();
		desc.output_filename = parser.parse_string();
		desc.road_attributes.func_classes.clear();

		string operation = parser.parse_string();

		if (operation == "EXTRACT_ROADS")
		{
			desc.layeroperation = EXTRACT_ROADS;
			parse_road_attributes(parser, desc.road_attributes);
			desc.road_attributes.func_classes.insert(-1);
		}
		else if (operation == "EXTRACT_STREETS")
		{
			desc.layeroperation = EXTRACT_ROADS;
			parse_road_attributes(parser, desc.road_attributes);
			desc.road_attributes.func_classes.insert(5);
			desc.road_attributes.func_classes.insert(-1);
		}
		else if (operation == "EXTRACT_MAJHWYS")
		{
			desc.layeroperation = EXTRACT_ROADS;
			parse_road_attributes(parser, desc.road_attributes);
			desc.road_attributes.func_classes.insert(1);
			desc.road_attributes.func_classes.insert(2);
		}		
		else if (operation == "EXTRACT_SECHWYS")
		{
			desc.layeroperation = EXTRACT_ROADS;
			parse_road_attributes(parser, desc.road_attributes);
			desc.road_attributes.func_classes.insert(3);
			desc.road_attributes.func_classes.insert(4);
		}
		else if (operation == "EXTRACT_WATERSEG")
		{
			desc.layeroperation = EXTRACT_ROADS;
			parse_road_attributes(parser, desc.road_attributes);
			desc.road_attributes.func_classes.insert(-1);			
		}
		else if (operation == "EXTRACT_SIGNS")
		{
			desc.layeroperation = EXTRACT_SIGNS;
			parse_texture_attributes(parser, desc.texture_attributes);
		}		
		else if (operation == "EXTRACT_TEXT_BILLBOARDS")
		{
			desc.layeroperation = EXTRACT_TEXT_BILLBOARDS;
			parse_texture_attributes(parser, desc.texture_attributes);
		}
		else if (operation == "EXTRACT_POLYGONS")
		{
			desc.layeroperation = EXTRACT_POLYGONS;
		}
		else if (operation == "EXTRACT_TEXT_TRIANGLES")
		{
			desc.layeroperation = EXTRACT_TEXT_TRIANGLES;
			parse_text_attributes(parser, desc.text_attributes);
		}
		else
		{
			cout << "Error -> Undefined operation: " << operation << endl;
			return false;
		}
		
		filedescriptions.push_back(desc);
	}

	return true;
}

/*!********************************************************************************************
 @Function		parse_texture_attributes
 @Input			parser         Name of the file to parse.
 @Input         attribs        Structure where all the attributes will be stored.
 @Description	Parses texture related attributes.
***********************************************************************************************/
void parse_texture_attributes(PVRParser &parser, TextureAttributes &attribs)
{
	attribs.texture_atlas = parser.parse_string();
}

/*!********************************************************************************************
 @Function		parse_road_attributes
 @Input			parser         Name of the file to parse.
 @Input         attribs        Structure where all the attributes will be stored.
 @Description	Parses road triangulation related attributes.
***********************************************************************************************/
void parse_road_attributes(PVRParser &parser, RoadAttributes &attribs)
{
	attribs.width = parser.parse_float();
	attribs.texture_matrix = parser.parse_PVRTMat3();
	string options = parser.parse_string();
	attribs.triangulate_caps = false;
	attribs.triangulate_intersections = false;
	if (options.find("CAPS") != string::npos) attribs.triangulate_caps = true;
	if (options.find("INTERSECTIONS") != string::npos) attribs.triangulate_intersections = true;
}

/*!********************************************************************************************
 @Function		parse_text_attributes
 @Input			parser         Name of the file to parse.
 @Input         attribs        Structure where all the attributes will be stored.
 @Description	Parses text related attributes.
***********************************************************************************************/
void parse_text_attributes(PVRParser &parser, TextAttributes &attribs)
{
	attribs.texture_atlas = parser.parse_string();
	attribs.scale = parser.parse_PVRTVec2();	
}

