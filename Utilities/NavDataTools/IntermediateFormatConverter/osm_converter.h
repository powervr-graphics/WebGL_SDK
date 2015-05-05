/******************************************************************************

 @File         osm_converter.h

 @Title        IntermediateFormatConverter

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  OSM transformation utility interface file.

******************************************************************************/
#ifndef _OSM_CONVERTER__H_
#define _OSM_CONVERTER__H_

#include "common.h"
#include "PVRNavigation.h"

/*!****************************************************************************
 @Function		OSM_process_data
 @Input			pszFile      The directory containing all the layer files. 
 @Output		layers       The extracted layer information will be stored 
                             in this vector.
 @Return                     True if successful, false otherwise.
 @Description	Extracts all data according to the set filters and stores it for 
                later usage.
******************************************************************************/
bool OSM_process_data(const char *pszFilename, std::vector<MapDescription> &layers);

#endif // _OSM_CONVERTER__H_

