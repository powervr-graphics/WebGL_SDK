/******************************************************************************

 @File         common.h

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Interface file for all data transformation functions.

******************************************************************************/

#ifndef _COMMON__H_
#define _COMMON__H_

#include <set>
#include <string>
#include <vector>

#include "PVRNavigation.h"

/*!*************************************************************************************************
 @Function		create_buckets
 @Input			layer              The layer to bucketize.
 @Input			numBucketRec       Number of bucket subdivision recursions. 
 @Input			numIndexSetRec     Number of indexset subdivision recurstions within each bucket.
 @Input			minPrimCnt         Minimum primitive count for each indexset.
 @Output		bucketlayer        The subdivided coordinate and indexset buckets will be stored here.
 @Description	Subdivides the map layer into equally spaced rectangles, called buckets, and 
                distributes the coordinates and primitives accordingly. Each bucket contains a set
				of indexsets which is subdivided according to the number of iterations specified.
***************************************************************************************************/
bool create_buckets(const pvrnavigation::PVRTMapLayer &layer, const unsigned int numBucketRec, const unsigned int numIndexSetRec, const unsigned int minPrimCnt, pvrnavigation::PVRTBucketMapLayer &bucketlayer);

/*!*************************************************************************************************
 @Function		convert_linestrips
 @Input			coordinates          The coordinate vector.
 @Input		    linestrips           Indices spanning the linestrips and pointing into the coordinate vector.
 @Input			width                The width of the triangulated linestrip.
 @Input			texmatrix            The texture transformation matrix used to calculate uv coordinates.
 @Input         caps
 @Input         intersections
 @Output		output_coordinates   Calculated coordinates from the triangulation.
 @Output		triangles            Triangle indices from the triangulation.
 @Description	Triangulates a linestrip based on the specified parameters.
***************************************************************************************************/
void convert_linestrips(const pvrnavigation::PVRTCoordinateVector &coordinates, const pvrnavigation::PVRTLinestripVector &linestrips, const float width, const PVRTMat3 &texmatrix, const bool tri_caps, const bool tri_intersections, pvrnavigation::PVRTCoordinateVector &output_coordinates, pvrnavigation::PVRTTriangleVector &triangles);

/*!********************************************************************************************
 @Function		convert_texts
 @Input			layer          The map layer to extract the texts from.
 @Input			atlas          The texture atlas used for uv-coordinate calculation.
 @Output		pivotquads     The generated pivotquad vertex data.
 @Output		triangles      Triangle indices used for rendering of the pivotquads. 
 @Description	Generates pivotquads for the text strings which will be screen-space aligned
                when being rendered.
***********************************************************************************************/
void convert_texts(const pvrnavigation::PVRTMapLayer &layer, const pvrnavigation::PVRTTextureAtlas &atlas, pvrnavigation::PVRTPivotQuadVertexVector &pivotquads, pvrnavigation::PVRTTriangleVector &triangles);

/*!********************************************************************************************
 @Function		convert_signs
 @Input			layer          The map layer to extract the texts from.
 @Input			atlas          The texture atlas used for uv-coordinate calculation.
 @Output		pivotquads     The generated pivotquad vertex data.
 @Output		triangles      Triangle indices used for rendering of the pivotquads. 
 @Description	Generates pivotquads for the signs which will be screen-space aligned when being 
                rendered.
***********************************************************************************************/
void convert_signs(const pvrnavigation::PVRTMapLayer &layer, const pvrnavigation::PVRTTextureAtlas &atlas, pvrnavigation::PVRTPivotQuadVertexVector &pivotquads, pvrnavigation::PVRTTriangleVector &triangles);

/*!********************************************************************************************
 @Function		convert_text_to_triangles
 @Input			layer          The map layer to extract the texts from.
 @Input			atlas          The texture atlas used for uv-coordinate calculation.
 @Output		coordinates    The generated triangle vertex data.
 @Output		triangles      Triangle indices used for rendering of the triangles. 
 @Description	Generates texture mappable triangles for the text strings.
***********************************************************************************************/
void convert_text_to_triangles(const pvrnavigation::PVRTMapLayer &layer, const pvrnavigation::PVRTTextureAtlas &atlas, PVRTVec2 scale, pvrnavigation::PVRTCoordinateVector &coordinates, pvrnavigation::PVRTTriangleVector &triangles);

/*!********************************************************************************************
 @Function		is_number
 @Input			c          The character to test.
 @Return 		True if the provided character is a number, false otherwise.
 @Description	Checks whether a certain character is a number or not.
***********************************************************************************************/
bool is_number(char c);

/*!********************************************************************************************
 @Function		get_letter_spacing
 @Input			letter     The letter to calculate the width for.
 @Return 		The spacing of the letter.
 @Description	Looks up the spacing for a given letter where a single width letter is 4 units.
                (2 is half the width of regular letter, etc).
***********************************************************************************************/
unsigned int get_letter_spacing(char letter);

/*!********************************************************************************************
 @Function		contains_ordinal
 @Input			name      The string to check.
 @Output		pos       The position of the ordinal.
 @Return 		True if the provided string contains an ordinal, false otherwise.
 @Description	Checks whether a given string includes a numeric ordinal (1ST, 2ND, 3RD, 4TH ...)
***********************************************************************************************/
bool contains_ordinal(const std::string &name, size_t &pos);

#endif // _COMMON__H_
