/******************************************************************************

 @File         ogr_converter.h

 @Title        IntermediateFormatConverter

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  OGR transformation utility interface file.

******************************************************************************/
#ifndef _OGR_CONVERTER__H_
#define _OGR_CONVERTER__H_

#include "common.h"
#include "PVRNavigation.h"

/*!****************************************************************************
 @Function		OGR_process_data
 @Input			pszDirectory      The directory containing all the layer files.
 @Input			filter            Filter map to describe the features to extract 
                                  per layer.
 @Input			layers            The extracted layer information will be stored 
                                  in this vector.
 @Return                          True if successful, false otherwise.
 @Description	Extracts all data according to the set filters and stores it for 
                later usage.
******************************************************************************/
bool OGR_process_data(const char *pszDirectory, MapFilter &filter, std::vector<MapDescription> &layers);

#endif // _OGR_CONVERTER__H_

