/******************************************************************************

 @File         PVRTriangulate.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#ifndef _PVRTRIANGULATE__H_
#define _PVRTRIANGULATE__H_

#include <vector>  // Include STL vector class.
#include "PVRMapTypes.h"

namespace pvrnavigation
{

bool TriangulatePolygon(const PVRTCoordinateVector &coordinates, const PVRTPolygon &indices, PVRTCoordinateVector &triangle_coords, PVRTTriangleVector &triangles);
bool TriangulatePolygon(const PVRTCoordinateVector &coordinates, const PVRTMultiPolygon &polygons, PVRTCoordinateVector &triangle_coords, PVRTTriangleVector &triangles);

};

#endif // _PVRTRIANGULATE__H_

/******************************************************************************
 End of file (PVRTriangulate.h)
******************************************************************************/

