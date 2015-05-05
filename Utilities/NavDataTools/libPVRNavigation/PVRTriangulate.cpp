/******************************************************************************

 @File         PVRTriangulate.cpp

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#include "PVRNavigation.h"

#ifndef ENABLE_IMG_TRIANGULATION

#include <math.h>
using namespace std;

namespace pvrnavigation
{

/******************************************************************************
 Function declarations
******************************************************************************/
bool IsPolygonEar(const PVRTCoordinateVector &coordinates, const int u, const int v, const int w, const int n, const index_t *V);
float CalculatePolygonArea(const PVRTCoordinateVector &coordinates, const PVRTPolygon &polygon);

/*!********************************************************************************************
 @Function		TriangulatePolygon
 @Input			coordinates         Coordinate array for the polygon.
 @Input			polygons            The polygon definitions.
 @Output        triangle_coords     The resulting coordinates of the triangulation.
 @Output        triangle_indices    The resulting triangle indices of the polygon.
 @Return        True if the polygon could be triangulated, false otherwise.
 @Description	Triangulates the exterior polygon of a set of non-self-intersecting polygons.
                Note that this will not be able to deal with holes etc.
***********************************************************************************************/
bool TriangulatePolygon(const PVRTCoordinateVector &coordinates, const PVRTMultiPolygon &polygons, PVRTCoordinateVector &triangle_coords, PVRTTriangleVector &triangle_indices)
{
	// There must be at least one
	if (polygons.polygons.empty())
		return false;

	// Only triangulate the exterior polygon. 
	// For information on how to handle it properly, please have a look at the polygon triangulation section in the whitepaper.
	return TriangulatePolygon(coordinates, polygons.polygons.front(), triangle_coords, triangle_indices);
}


/*!********************************************************************************************
 @Function		TriangulatePolygon
 @Input			coordinates         Coordinate array for the polygon.
 @Input			polygon             The polygon definition.
 @Output        triangle_coords     The resulting coordinates of the triangulation.
 @Output        triangle_indices    The resulting triangle indices of the polygon.
 @Return        True if the polygon could be triangulated, false otherwise.
 @Description	Triangulates a non-self-intersecting polygon.
***********************************************************************************************/
bool TriangulatePolygon(const PVRTCoordinateVector &coordinates, const PVRTPolygon &polygon, PVRTCoordinateVector &triangle_coords, PVRTTriangleVector &triangle_indices)
{
	// Copy the vertices, the index structure will be built on top of that set
	// without modification of the vertices
	triangle_coords = coordinates;

	// allocate and initialize list of Vertices in polygon 
	int num_vertices = (int)polygon.indices.size();
	if (num_vertices < 3) 
		return false;

	// Create a temporary storage area for the indices
	index_t *V = new index_t[num_vertices];

	// The polygon should be defined in counter-clockwise order
	if (CalculatePolygonArea(coordinates, polygon) > 0.0f)
	{
		for (int v=0; v < num_vertices; v++) 
			V[v] = polygon.indices[v];
	}
	// if not, reverse the index array
	else
	{
		for(int v=0; v < num_vertices; v++) 
			V[v] = polygon.indices[(num_vertices-1) - v];
	}

	// This counter should prevent endless loops (which only should happen in degenerate polygon cases)
	int loop_counter = num_vertices * 2; 

	// Remove nv-2 vertices, creating a triangle every iteration
	for (int v=num_vertices-1; num_vertices > 2; loop_counter--)
	{
		// We looped, there is an error in this polygon
		if (loop_counter <= 0)
			return false;

		// Get the indices for three consecutive vertices in the polygon forming a triangle
		int u = v % num_vertices; 
		v = (u + 1) % num_vertices; 
		int w = (v + 1) % num_vertices; 

		// Check if there is no point which lies within this triangle
		if (IsPolygonEar(coordinates, u, v, w, num_vertices, V))
		{			
			// No point found, that means it's an ear
			PVRTTriangle t = { V[u], V[v], V[w] };			
			triangle_indices.push_back(t);
			
			// Remove the triangle from the polygon by removing v
			for (int s=v; s < num_vertices-1; s++) 
				V[s] = V[s+1]; 
			num_vertices--;

			// Re-initialize the loop counter
			loop_counter = num_vertices * 2;
		}
	}

	delete [] V;

	return true;
}


/*!********************************************************************************************
 @Function		CalculatePolygonArea
 @Input			coordinates      Coordinate array for the polygon.
 @Input			polygon          The polygon definition.
 @Return        The area of the polygon. Depending on the winding order this can be negative
                but correct in absolute value.
 @Description	Calculates the area of a non-self-intersecting polygon.
***********************************************************************************************/
float CalculatePolygonArea(const PVRTCoordinateVector &coordinates, const PVRTPolygon &polygon)
{
	const unsigned int n = (unsigned int)polygon.indices.size();
	float area = 0.0f;

	for (unsigned int p=n-1,q=0; q < n; p=q++)
	{
		const PVRTVec3 &P = coordinates[polygon.indices[p]].position;
		const PVRTVec3 &Q = coordinates[polygon.indices[q]].position;
		area += (P.x * Q.y) - (P.y * Q.x);
	}

	return (area * 0.5f);
}

/*!********************************************************************************************
 @Function		PointInsideTriangle
 @Input			A          First corner point of the triangle.
 @Input			B          Second corner point of the triangle.
 @Output		C          Third corner point of the triangle.
 @Output		P          The point to test.
 @Return        True if the point P is in the triangle, false otherwise.
 @Description	Tests whether a point is inside a triangle.
***********************************************************************************************/
bool PointInsideTriangle(const PVRTVec3 &A, const PVRTVec3 &B, const PVRTVec3 &C, const PVRTVec3 &P)
{
	float a = (C.x - B.x) * (P.y - B.y) - (C.y - B.y) * (P.x - B.x);
	float b = (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
	float c = (A.x - C.x) * (P.y - C.y) - (A.y - C.y) * (P.x - C.x);
		
	return ((a >= 0.0f) && (b >= 0.0f) && (c >= 0.0f));
}


/*!********************************************************************************************
 @Function		IsPolygonEar
 @Input			A          First corner point of the triangle.
 @Input			B          Second corner point of the triangle.
 @Output		C          Third corner point of the triangle.
 @Output		P          The point to test.
 @Return        True if the point P is in the triangle, false otherwise.
 @Description	Tests whether a point is inside a triangle.
***********************************************************************************************/
bool IsPolygonEar(const PVRTCoordinateVector &coordinates, const int u, const int v, const int w, const int n, const index_t *V)
{
	const PVRTVec3 &A = coordinates[V[u]].position;
	const PVRTVec3 &B = coordinates[V[v]].position;
	const PVRTVec3 &C = coordinates[V[w]].position;

	if (0.0000000001f > (((B.x-A.x)*(C.y-A.y)) - ((B.y-A.y)*(C.x-A.x))) ) 
		return false;

	for (int p=0; p < n; p++)
	{
		if((p == u) || (p == v) || (p == w)) 
			continue;

		if (PointInsideTriangle(A, B, C, coordinates[V[p]].position)) 
			return false;
	}

	return true;
}

};

#endif // ENABLE_IMG_TRIANGULATION

/******************************************************************************
 End of file (Triangulate.cpp)
******************************************************************************/

