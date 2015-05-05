/******************************************************************************

 @File         PVRTBoundingPrimitives.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#ifndef _PVRTBOUNDINGPRIMITIVES__H_
#define _PVRTBOUNDINGPRIMITIVES__H_

#include "PVRTGlobal.h"
#include "PVRTVector.h"

namespace pvrnavigation
{

/*!***********************************************************************
 *	@Struct PVRTBoundingBox2D
 *	@Brief  Structure describing a 2D bounding box. Supports all kind of
 *          set operations and provides higher level functionality.
 ************************************************************************/
struct PVRTBoundingBox2D
{
	// Min and max coordinates
	PVRTVec2 minCoords;
	PVRTVec2 maxCoords;

	/*!****************************************************************************
	 @Function		Constructor
	 @Description	Initiales min and max coordinates to zero.
	******************************************************************************/
	PVRTBoundingBox2D()
	{
		minCoords = maxCoords = PVRTVec2(0.0f);
	}

	/*!****************************************************************************
	 @Function		Constructor
	 @Input         v    2D Initialisation vector.
	 @Description	Initiales min and max coordinates to the given coordinate.
	******************************************************************************/
	PVRTBoundingBox2D(const PVRTVec2 &v)
	{
		minCoords = maxCoords = v;
	}

	/*!****************************************************************************
	 @Function		Constructor
	 @Input         v    3D Initialisation vector; z component will be ignored.
	 @Description	Initiales min and max coordinates to the given coordinate.
	******************************************************************************/
	PVRTBoundingBox2D(const PVRTVec3 &v)
	{
		minCoords = maxCoords = PVRTVec2(v);
	}

	/*!****************************************************************************
	 @Function		Constructor
	 @Input         a    2D initialisation vector for min coordinates.
	                b    2D initialisation vector for max coordinates.
	 @Description	Initiales min and max coordinates to the given coordinates.
	******************************************************************************/
	PVRTBoundingBox2D(const PVRTVec2 &a, const PVRTVec2 &b)
	{
		minCoords = a;
		maxCoords = b;
	}

	/*!****************************************************************************
	 @Function		Constructor
	 @Input         a    3D initialisation vector for min coordinates; z will be ignored.
	                b    3D initialisation vector for max coordinates; z will be ignored.
	 @Description	Initiales min and max coordinates to the given coordinates.
	******************************************************************************/
	PVRTBoundingBox2D(const PVRTVec3 &a, const PVRTVec3 &b)
	{
		minCoords = PVRTVec2(a);
		maxCoords = PVRTVec2(b);
	}

	/*!****************************************************************************
	 @Function		Width
	 @Return        Absolute difference between min and max x coordinates.
	 @Description	Calculates the width of the bounding box.
	******************************************************************************/
	inline float Width() const { return fabs(maxCoords.x - minCoords.x); }

	/*!****************************************************************************
	 @Function		Height
	 @Return        Absolute difference between min and max y coordinates.
	 @Description	Calculates the height of the bounding box.
	******************************************************************************/
	inline float Height() const { return fabs(maxCoords.y - minCoords.y); }

	/*!****************************************************************************
	 @Function		Dimensions
	 @Return        Width and height of bounding box.
	 @Description	Calculates the width and height of the bounding box.
	******************************************************************************/
	inline PVRTVec2 Dimensions() const { return PVRTVec2(Width(), Height()); }

	/*!****************************************************************************
	 @Function		Center
	 @Return        The center of the bounding box.
	 @Description	Calculates the center of the bounding box.
	******************************************************************************/
	inline
	PVRTVec2 Center() const
	{
		return (minCoords + maxCoords) * 0.5f;
	}

	/*!****************************************************************************
	 @Function		Contains
	 @Input         v       The 2D point to test.
	 @Return        True if point is within bounding box, false otherwise.
	 @Description	Determines whether a given point is within the bounding box or not.
	******************************************************************************/
	inline
	bool Contains(const PVRTVec2 &v) const 
	{ 
		return ((v.x >= minCoords.x) && (v.y >= minCoords.y) && (v.x <= maxCoords.x) && (v.y <= maxCoords.y));
	}

	/*!****************************************************************************
	 @Function		Contains
	 @Input         v       The 3D point to test; z will be ignored.
	 @Return        True if point is within bounding box, false otherwise.
	 @Description	Determines whether a given point is within the bounding box or not.
	******************************************************************************/
	inline
	bool Contains(const PVRTVec3 &v) const 
	{ 
		return ((v.x > minCoords.x) && (v.y > minCoords.y) && (v.x < maxCoords.x) && (v.y < maxCoords.y));
	}

	/*!****************************************************************************
	 @Function		Overlaps
	 @Input         bb       The bounding box to test the overlap with.
	 @Return        True if bounding boxes overlap, false otherwise.
	 @Description	Determines whether a given bounding box overlaps or not.
	******************************************************************************/
	inline
	bool Overlaps(const PVRTBoundingBox2D &bb) const 
	{ 
		if ((bb.minCoords.x > maxCoords.x) || (bb.minCoords.y > maxCoords.y) ||
			(bb.maxCoords.x < minCoords.x) || (bb.maxCoords.y < minCoords.y))
			return false;
		return true;
	}

	/*!****************************************************************************
	 @Function		Extend
	 @Input         v       The vector to extend the bounding box with.
	 @Description	Extends a bounding box to include the given vector.
	******************************************************************************/
	inline
	void Extend(const PVRTVec3 &v) 
	{				
		minCoords.x = PVRT_MIN(minCoords.x, v.x);
		minCoords.y = PVRT_MIN(minCoords.y, v.y);
		maxCoords.x = PVRT_MAX(maxCoords.x, v.x);
		maxCoords.y = PVRT_MAX(maxCoords.y, v.y);
	}

	/*!****************************************************************************
	 @Function		Merge
	 @Input         v       The bounding box to extend the bounding box with.
	 @Description	Merges the extents of two bounding boxes.
	******************************************************************************/
	inline
	void Merge(const PVRTBoundingBox2D &b) 
	{
		minCoords.x = PVRT_MIN(minCoords.x, b.minCoords.x);
		minCoords.y = PVRT_MIN(minCoords.y, b.minCoords.y);
		maxCoords.x = PVRT_MAX(maxCoords.x, b.maxCoords.x);
		maxCoords.y = PVRT_MAX(maxCoords.y, b.maxCoords.y);
	}

	/*!****************************************************************************
	 @Function		Subdivide
	 @Input         upperLeft       The new bounding box in the upper left corner.
                    lowerLeft       The new bounding box in the lower left corner.
					lowerRight      The new bounding box in the lower right corner.
					upperRight      The new bounding box in the upper right corner.
	 @Description	Subdivides the bounding box by splitting it into equally sized quads.
	******************************************************************************/
	inline
	void Subdivide(PVRTBoundingBox2D &upperLeft, PVRTBoundingBox2D &lowerLeft, PVRTBoundingBox2D &lowerRight, PVRTBoundingBox2D &upperRight) const
	{
		PVRTVec2 middle = (maxCoords - minCoords) * 0.5f + minCoords;
		
		upperLeft.minCoords = PVRTVec2(minCoords.x, middle.y);
		upperLeft.maxCoords = PVRTVec2(middle.x, maxCoords.y);

		lowerLeft.minCoords = minCoords;
		lowerLeft.maxCoords = middle;

		lowerRight.minCoords = PVRTVec2(middle.x, minCoords.y);
		lowerRight.maxCoords = PVRTVec2(maxCoords.x, middle.y);		

		upperRight.minCoords = middle;
		upperRight.maxCoords = maxCoords;		
	}
};

/*!***********************************************************************
 *	@Struct PVRTBoundingCircle
 *	@Brief  Structure describing a 2D bounding circle. 
 ************************************************************************/
struct PVRTBoundingCircle
{
	PVRTVec2 center;
	float radius;

	PVRTBoundingCircle()
	{
		center = PVRTVec2(0.0f);
		radius = 0.0f;
	}

	PVRTBoundingCircle(const PVRTBoundingCircle &bc)
	{
		center = bc.center;
		radius = bc.radius;
	}

	PVRTBoundingCircle(const PVRTVec2 &c, const float r)
	{
		center = c;
		radius = r;
	}

	PVRTBoundingCircle(const PVRTVec3 &c, const float r)
	{
		center = PVRTVec2(c.x, c.y);
		radius = r;
	}

	inline
	bool Contains(const PVRTVec2 &v) const 
	{ 
		// Compare squared distance to squared radius
		PVRTVec2 dist = v - center;
		return (dist.dot(dist) <= radius * radius);
	}
};

};

#endif // _PVRTBOUNDINGPRIMITIVES__H_

/******************************************************************************
 End of file (PVRTBoundingPrimitives.h)
******************************************************************************/

