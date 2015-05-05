/******************************************************************************

 @File         common.h

 @Title        IntermediateFormatConverter

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Commonly used type definitions.

******************************************************************************/

#ifndef _COMMON__H_
#define _COMMON__H_

#include <map>
#include <string>

#include "PVRNavigation.h"

#define EXTRACT_ALL_DATA       0xFFFFFFFF
#define EXTRACT_GEOMETRY_DATA  1
#define EXTRACT_HIGHWAYNAMES   2
#define EXTRACT_STREETNAMES    4
#define EXTRACT_POI            8

// The following STL map stores the map filename and the corresponding features to extract
typedef std::map<std::string, int> MapFilter;

/*!****************************************************************************
 @Struct	MapDescription
 @Brief     This structure stores a readable description of the map and the map
            layer itself.
******************************************************************************/
struct MapDescription
{
	std::string name;
	pvrnavigation::PVRTMapLayer maplayer;
};

#endif // _COMMON__H_

