/******************************************************************************

 @File         PVRMapTypes.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#ifndef _PVRMAPTYPES_INTERNAL__H_
#define _PVRMAPTYPES_INTERNAL__H_

#include "PVRTVector.h"
#include "PVRTBoundingPrimitives.h"

#include <vector>

namespace pvrnavigation
{

// All indices will be made up of 32 bit unsigned integers
typedef PVRTuint32 index_t;


/*!***********************************************************************
 *	@Struct PVRTTriangle
 *	@Brief  Stores indices for a single triangle. 
 ************************************************************************/
struct PVRTTriangle
{
	index_t a, b, c;

	// Comparison operator whether a triangle equals another based on the indices. Required for STL containers.
	bool operator==(const PVRTTriangle &t) { return ((t.a == a) && (t.b == b) && (t.c == c)); }
};


/*!***********************************************************************
 *	@Struct PVRTVertex
 *	@Brief  Stores three-dimensional position and texture coordinates. 
 ************************************************************************/
struct PVRTVertex
{
	PVRTVec3 position;
	PVRTVec2 texcoord;
};

/*!***********************************************************************
 *	@Struct PVRTPivotQuadVertex
 *	@Brief  The PivotQuadVertex structure describes a single vertex within
 *          a screen-space aligned series of quads. It contains the origin
 *          position, the word index determining the position of the letter
 *          within the word, the quad index which determines the position of
 *          the vertex within the quad and texture coordinates.
 ************************************************************************/
struct PVRTPivotQuadVertex
{
	PVRTVec2   origin;
	PVRTint8   word_index;
	PVRTint8   height_index;
	PVRTuint8  u;
	PVRTuint8  v;
};


typedef std::vector<PVRTVertex>          PVRTCoordinateVector;
typedef std::vector<PVRTTriangle>        PVRTTriangleVector;
typedef std::vector<index_t>             PVRTPointVector;
typedef std::vector<PVRTPivotQuadVertex> PVRTPivotQuadVertexVector;

/*!***********************************************************************
 *	@Struct PVRTRenderIndexSet
 *	@Brief  Contains index vectors of triangle based primitives.
 ************************************************************************/
struct PVRTRenderIndexSet
{
	PVRTTriangleVector      triangles;
	PVRTTriangleVector      pivotquadtriangles;

	bool IsEmpty() const { return (triangles.empty() && pivotquadtriangles.empty()); }
	size_t PrimitiveCount() const { return (triangles.size() + pivotquadtriangles.size()); }
};

/*!***********************************************************************
 *	@Struct PVRTCoordinateBucket
 *	@Brief  Contains a coordinate vector, a vector of pivotquads and a
 *          bounding box describing the extents.
 ************************************************************************/
struct PVRTCoordinateBucket
{
	PVRTBoundingBox2D           boundingbox;
	PVRTCoordinateVector        coordinates;
	PVRTPivotQuadVertexVector   pivotquads;
};

/*!***********************************************************************
 *	@Struct PVRTBucketIndexSet
 *	@Brief  A bucket indexset is a regular indexset which is defined within
 *          a coordinate bucket. The bounding box describes the extents of
 *          the contained primitives, which are defined	by the indexset.
 ************************************************************************/
struct PVRTBucketIndexSet
{
	unsigned int       bucketindex;
	PVRTBoundingBox2D  boundingbox;
	PVRTRenderIndexSet indexset;
};

// Vector type definitions for custom primitive types
typedef std::vector<PVRTCoordinateBucket>  PVRTCoordinateBucketVector;
typedef std::vector<PVRTBucketIndexSet>    PVRTBucketIndexSetVector;

/*!***********************************************************************
 *	@Struct PVRTBucketMapLayer
 *	@Brief  A bucket map layer is a regular map layer which has been split
 *          up into smaller regions, the buckets, which contain the coordinates
 *			and primitives. The bounding box describes the extents of the whole
 *   		layer.
 ************************************************************************/
struct PVRTBucketMapLayer
{
	PVRTBoundingBox2D          boundingbox;
	PVRTCoordinateBucketVector coordinatebuckets;
	PVRTBucketIndexSetVector   bucketindexsets;
};


/*!***********************************************************************
 *	@Struct PVRTLinestrip
 *	@Brief  Stores a vector containing indices of a linestrip. 
 ************************************************************************/
struct PVRTLinestrip
{
	int ref_in_id;
	int nref_in_id;
	int func_class;
	std::vector<index_t> indices;
};


/*!***********************************************************************
 *	@Struct PVRTPolygon
 *	@Brief  Stores a vector containing indices of a polygon. 
 ************************************************************************/
struct PVRTPolygon
{
	std::vector<index_t> indices;
};
typedef std::vector<PVRTPolygon>    PVRTPolygonVector;

/*!***********************************************************************
 *	@Struct PVRTMultiPolygon
 *	@Brief  Stores a vector of polygons defining a shape.
 ************************************************************************/
struct PVRTMultiPolygon
{
	PVRTPolygonVector polygons;
};
typedef std::vector<PVRTMultiPolygon>    PVRTMultiPolygonVector;

/*!***********************************************************************
 *	@Struct PVRTText
 *	@Brief  Stores an index into the linestring vector and name of a street, 
 *          only used during data conversion. 
 ************************************************************************/
struct PVRTText
{	
	unsigned int index;	
	char szName[64];	
};

/*!***********************************************************************
 *	@Struct PVRTSign
 *	@Brief  Stores the position and name of a sign, only used during
 *          data conversion. 
 ************************************************************************/
struct PVRTSign
{	
	PVRTVec2 position;
	// Odd number to take care of alignment
	char szName[64];	
};

// Vector type definitions for custom primitive types
typedef std::vector<PVRTLinestrip>       PVRTLinestripVector;
typedef std::vector<PVRTText>            PVRTTextVector;
typedef std::vector<PVRTSign>            PVRTSignVector;


/*!***********************************************************************
 *	@Struct PVRTIndexSet
 *	@Brief  Container for all types of index based primtives, which stores 
 *          the individual indices.
 ************************************************************************/
struct PVRTIndexSet
{
	PVRTLinestripVector     linestrips;		
	PVRTPolygonVector       polygons;
	PVRTMultiPolygonVector  multipolygons;
	PVRTTriangleVector      triangles;
	PVRTPointVector         points;
	PVRTSignVector          signs;
	PVRTTextVector          texts;

	PVRTTriangleVector      pivotquadtriangles;

	bool IsEmpty() const { return (linestrips.empty() && polygons.empty() && triangles.empty() && points.empty() && pivotquadtriangles.empty() && texts.empty()); }
	size_t PrimitiveCount() const { return (linestrips.size() + polygons.size() + triangles.size() + points.size() + pivotquadtriangles.size()+ texts.size()); }
};

/*!***********************************************************************
 *	@Struct PVRTMapLayer
 *	@Brief  A navigation map layer consists of a bounding box, describing 
 *          the extents of a layer, a vector of coordinates which is shared
 *          among all primitives, a vector of pivotquads and the indexset
 *          for all other primitives.
 ************************************************************************/
struct PVRTMapLayer
{
	PVRTBoundingBox2D         boundingbox;
	PVRTCoordinateVector      coordinates;	
	PVRTPivotQuadVertexVector pivotquads;
	PVRTIndexSet              indexset;
};

};

#endif // _PVRMAPTYPES_INTERNAL__H_

/******************************************************************************
 End of file (PVRMapTypes.h)
******************************************************************************/

