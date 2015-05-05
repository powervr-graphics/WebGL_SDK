/******************************************************************************

 @File         PVRMapFileIO.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#ifndef _PVRMAPFILEIO_INTERNAL__H_
#define _PVRMAPFILEIO_INTERNAL__H_

#include <istream>
#include "PVRNavigation.h"

namespace pvrnavigation
{
/*!********************************************************************************************
 @Function		writeMapLayer
 @Input			pszFilename      Filename to write the map layer to.
 @Input			layer            The layer to write.
 @Return        bool             True if successful, false otherwise.
 @Description	Writes a map layer to a given file.
***********************************************************************************************/
bool writeMapLayer(const char *pszFilename, const PVRTMapLayer &layer);

/*!********************************************************************************************
 @Function		readMapLayer
 @Input			pszFilename      Filename to read the map layer from.
 @Input			layer            The read layer will be written to that layer.
 @Return        bool             True if successful, false otherwise.
 @Description	Reads a map layer from a file.
***********************************************************************************************/
bool readMapLayer(const char *pszFilename, PVRTMapLayer &layer);

/*!********************************************************************************************
 @Function		readBucketMapLayer
 @Input			pszFilename      Filename to write the map layer to.
 @Input			layer            The layer to write.
 @Return        bool             True if successful, false otherwise.
 @Description	Writes a bucket map layer to a file.
***********************************************************************************************/
bool readBucketMapLayer(const char *pszFilename, PVRTBucketMapLayer &layer);

/*!********************************************************************************************
 @Function		readBucketMapLayer
 @Input			file             File to write the map layer to.
 @Input			layer            The layer to write.
 @Return        bool             True if successful, false otherwise.
 @Description	Writes a bucket map layer to a file.
***********************************************************************************************/
bool readBucketMapLayer(std::istream &file, PVRTBucketMapLayer &layer);

/*!********************************************************************************************
 @Function		writeBucketMapLayer
 @Input			pszFilename      Filename to read the map layer from.
 @Input			layer            The read layer will be written to that layer.
 @Return        bool             True if successful, false otherwise.
 @Description	Reads a bucket map layer from a file.
***********************************************************************************************/
bool writeBucketMapLayer(const char *pszFilename, const PVRTBucketMapLayer &layer);

/*!********************************************************************************************
 @Function		checkDirectory
 @Input			pszDirectory   The directory to check.
 @Return        bool           True if it exists, false otherwise.
 @Description	Checks if a certain directory exists.
***********************************************************************************************/
bool checkDirectory(const char *pszDirectory);


/*!********************************************************************************************
 @Function		createDirectory
 @Input			pszDirectory   The directory to create.
 @Return        bool           True if successful, false otherwise.
 @Description	Creates the specified directory.
***********************************************************************************************/
bool createDirectory(const char *pszDirectory);

};

#endif // _PVRMAPFILEIO_INTERNAL__H_

/******************************************************************************
 End of file (PVRMapFileIO_internal.h)
******************************************************************************/

