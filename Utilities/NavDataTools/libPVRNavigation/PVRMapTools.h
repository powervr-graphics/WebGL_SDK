/******************************************************************************

 @File         PVRMapTools.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#ifndef _PVRMAPTOOLS_INTERNAL__H_
#define _PVRMAPTOOLS_INTERNAL__H_

#include "PVRTVector.h"
#include "PVRMapTypes.h"
#include "PVRTBoundingPrimitives.h"

#include <vector>
#include <map>

namespace pvrnavigation
{

//********************************************
//*  Function declarations
//********************************************

/*!********************************************************************************************
 @Function		InterpolateLinestrip
 @Input			coordinates        The coordinate vector.
 @Input		    linestrip          Indices spanning the linestrip and pointing into the coordinate vector.
 @Input			a                  Scalar in [0, 1] range, which will be used to determine the interpolated position.
 @Return        Interpolated, three dimensional position.
 @Description	Calculates an interpolated position along a linestrip based on a given scalar.
***********************************************************************************************/
PVRTVec3 InterpolateLinestrip(const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip, float a);


/*!********************************************************************************************
 @Function		CalculateLinestripLength
 @Input			coordinates        The coordinate vector.
 @Input		    linestrip          Indices spanning the linestrip and pointing into the coordinate vector.
 @Return        Summed length of all linestrip segments.
 @Description	Calculates the total length of the linestrip by summing all segment lengths.
***********************************************************************************************/
float CalculateLinestripLength(const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip);

};

#endif // _PVRMAPTOOLS_INTERNAL__H_

/******************************************************************************
 End of file (PVRMapTools_internal.h)
******************************************************************************/

