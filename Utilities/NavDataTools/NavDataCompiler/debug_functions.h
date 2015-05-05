/******************************************************************************

 @File         debug_functions.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities to draw debug shapes as lines.

******************************************************************************/

#ifndef _DEBUG_FUNCTIONS__H_
#define _DEBUG_FUNCTIONS__H_

#include "PVRNavigation.h"
using namespace pvrnavigation;

#include <vector>

/*!*************************************************************************************************
 @Function		debug_generate_linestrip
 @Input			colour          The colour of the generated linestrip.
 @Input			coordinates     Coordinates of the linestrip. 
 @Output		lines           Vector of linestrips where the generated one will be appended to.
 @Description	Creates a linestrip out of a set of specified coordinates.
***************************************************************************************************/
void debug_generate_linestrip(const PVRTVec3 colour, const std::vector<PVRTVec3> &coordinates, std::vector<PVRTVec3> &lines);

/*!*************************************************************************************************
 @Function		debug_generate_linestrip
 @Input			colour          The colour of the generated linestrip.
 @Input			coordinates     Coordinates of the linestrip. 
 @Input			linestrip       Indices of the linestrip.
 @Output		lines           Vector of linestrips where the generated one will be appended to.
 @Description	Creates a linestrip out of a set of specified coordinates and indices.
***************************************************************************************************/
void debug_generate_linestrip(const PVRTVec3 colour, const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip, std::vector<PVRTVec3> &lines);

/*!*************************************************************************************************
 @Function		debug_generate_arrow
 @Input			colour          The colour of the generated linestrip.
 @Input			start           Starting point of the arrow. 
 @Input			end             End point of the arrow. The tip will be generated here.
 @Input			tipsize         Size of the arrow head.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a vector with an arrow head at one end.
***************************************************************************************************/
void debug_generate_arrow(const PVRTVec3 colour, const PVRTVec3 start, const PVRTVec3 end, const float tipsize, std::vector<PVRTVec3> &lines);

/*!*************************************************************************************************
 @Function		debug_generate_arrow
 @Input			colour          The colour of the generated linestrip.
 @Input			coordinates     Coordinates of the line geometry.
 @Input			indices         Indices describing the linestrip. The tip will be generated at the last index.
 @Input			tipsize         Size of the arrow head.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a linestrip with an arrow head at one end.
***************************************************************************************************/
void debug_generate_arrow(const PVRTVec3 colour, const PVRTCoordinateVector &coordinates, const std::vector<index_t> indices, const float tipsize, std::vector<PVRTVec3> &lines);

/*!*************************************************************************************************
 @Function		debug_generate_circle
 @Input			colour          The colour of the generated linestrip.
 @Input			center          Center of the circle.
 @Input			radius          Radius of the circle.
 @Input			numsubdivs      Number of subdivisions of the circle.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a circle out of a linestrip.
***************************************************************************************************/
void debug_generate_circle(const PVRTVec3 colour, const PVRTVec3 center, const float radius, const unsigned int numsubdivs, std::vector<PVRTVec3> &lines);

/*!*************************************************************************************************
 @Function		debug_generate_number
 @Input			colour          The colour of the generated linestrip.
 @Input			pos             Starting position of the number in world coordinates.
 @Input			scale           Scale of the text.
 @Input			number          The actual number to print.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a vectorized text out of a number.
***************************************************************************************************/
void debug_generate_number(const PVRTVec3 colour, const PVRTVec3 pos, const float scale, const unsigned int number, std::vector<PVRTVec3> &lines);

#endif // _DEBUG_FUNCTIONS__H_

