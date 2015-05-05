/******************************************************************************

 @File         PVRMapTools.cpp

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#include "PVRNavigation.h"

#include <vector>
using namespace std;

#include <math.h>

namespace pvrnavigation
{

float CalculateLinestripLength(const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip)
{
	float ln = 0.0f;

	for (unsigned int i=0; i < linestrip.indices.size()-1; i++)
		ln += (coordinates[linestrip.indices[i]].position - coordinates[linestrip.indices[i+1]].position).length();

	return ln;
}

PVRTVec3 InterpolateLinestrip(const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip, float a)
{
	if (linestrip.indices.empty())
		return PVRTVec3(0.0f);

	if (linestrip.indices.size() == 1)
		return coordinates[linestrip.indices.front()].position;		

	float linestrip_length = CalculateLinestripLength(coordinates, linestrip);
	float val = a * linestrip_length;

	for (unsigned int pos = 0; pos < linestrip.indices.size()-1; pos++)
	{
		const PVRTVec3 &pos_a = coordinates[linestrip.indices[pos]].position;
		const PVRTVec3 &pos_b = coordinates[linestrip.indices[pos+1]].position;
		const float seglength = (pos_a - pos_b).length();
		if (seglength == 0.0f)
			continue;

		if (val < seglength)
		{
			val = val / seglength;
			//return (pos_a * (1.0f - val) + pos_b * val);
			return (pos_a - pos_a * val + pos_b * val);
			//return (pos_a - (pos_a + pos_b) * val);
		}
		else
		{
			val -= seglength;
		}
	}

	// we are past the last coordinate, return the last position
	return coordinates[linestrip.indices.back()].position;
}



}; // namespace pvrnavigation


/******************************************************************************
 End of file (PVRMapTools.cpp)
******************************************************************************/

