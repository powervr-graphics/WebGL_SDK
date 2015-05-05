/******************************************************************************

 @File         PVRTriangulateIMG.cpp

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#include "PVRNavigation.h"

#ifdef ENABLE_IMG_TRIANGULATION

#include "IMGTriangulation.h"
#include "PVRTGlobal.h"
#include "float.h"

#include <iostream>
using namespace std;

namespace pvrnavigation
{

bool AnalyzeTriangulationError(TRI_ERROR_TYPES status)
{
	switch (status)
	{
	case TRI_OK:
		{
			return true;
		}
	case TRI_SUBPATHS_TOO_SHORT:
		{
			cerr << "Error, subpaths are too short!" << endl;
			break;
		}
	case TRI_ERROR_INSUFFICIENT_MEMORY:
		{
			cerr << "Error, operation failed due to lack of memory!" << endl;
			break;
		}
	default:
		{
			cerr << "Error, operation failed!" << endl;
			break;
		}
	}

	return false;
}

bool TriangulatePolygon(const PVRTCoordinateVector &coordinates, const PVRTPolygon &polygon, PVRTCoordinateVector &triangle_coords, PVRTTriangleVector &triangles)
{
	unsigned int numPoints = polygon.indices.size();

	InitialiseTriangulationModule(numPoints,
								  2*numPoints,
								  NULL);

	int paths = 1;
	int pathlens[1] = { polygon.indices.size() };
	float maxDimension = -FLT_MAX;
	float *pCoordinates = new float[polygon.indices.size()*2];

	for (unsigned int i=0; i < polygon.indices.size(); i++)
	{
		PVRTVec3 coord = coordinates[polygon.indices[i]].position;
		pCoordinates[i*2] = coord.x;
		pCoordinates[i*2+1] = coord.y;

		maxDimension = PVRT_MAX(coord.x, maxDimension);
		maxDimension = PVRT_MAX(coord.y, maxDimension);
	}

	ExternalTrapStruct TrapezoidsResult;

	TRI_ERROR_TYPES status = BuildPolygonTrapeziation(NULL, //do all subpaths at once
									                  maxDimension,
											          // path data
											          paths,
											          pathlens,
											          pCoordinates,
											          // Specify a seed for the random number generator
											          // This isn't critcal if the processing is offline so just use 0
											          0,											 
											          // the resulting trap structure											 
											          &TrapezoidsResult);
	delete [] pCoordinates;
	if (!AnalyzeTriangulationError(status))
	{
		FreeTriangulationModuleMemory();
		return false;
	}

	int MaxFFRecursionDepth = 10000;
	int FillModeIsOddEven = 0;
	int numVertices = 0;
	float *pVertices = NULL;
	int numTriangles = 0;
	TriIndicesType *pTriangleIndices = NULL;

	numTriangles = OutputIndexedTriangles(&TrapezoidsResult,
										  MaxFFRecursionDepth,
										  FillModeIsOddEven,
										  true, 
										  &numVertices,
										  &pVertices,
										  &pTriangleIndices);

	for (int i=0; i < numTriangles; i++)
	{
		TriIndicesType triangle = pTriangleIndices[i];		
		PVRTVertex a = { PVRTVec3(pVertices[triangle.Ind[0]*2], pVertices[triangle.Ind[0]*2+1], 0.0f), PVRTVec2(0.0f, 0.0f) };
		PVRTVertex b = { PVRTVec3(pVertices[triangle.Ind[1]*2], pVertices[triangle.Ind[1]*2+1], 0.0f), PVRTVec2(0.0f, 0.0f) };
		PVRTVertex c = { PVRTVec3(pVertices[triangle.Ind[2]*2], pVertices[triangle.Ind[2]*2+1], 0.0f), PVRTVec2(0.0f, 0.0f) };

		const unsigned int index_start = triangle_coords.size();
		triangle_coords.push_back(a);
		triangle_coords.push_back(b);
		triangle_coords.push_back(c);

		PVRTTriangle tri = { index_start, index_start+1, index_start+2 };
		triangles.push_back(tri);
	}

	FreeTriangulationModuleMemory();

	return true;
}

bool TriangulatePolygon(const PVRTCoordinateVector &coordinates, const PVRTMultiPolygon &polygons, PVRTCoordinateVector &triangle_coords, PVRTTriangleVector &triangles)
{
	const int paths = polygons.polygons.size();
	unsigned int numPoints = 0;
	for (int i=0; i < paths; i++)
		numPoints += polygons.polygons[i].indices.size();

	InitialiseTriangulationModule(numPoints,
								  2*numPoints,
								  NULL);

	int *pPathLengths = new int[paths];
	for (int i=0; i < paths; i++)
		pPathLengths[i] = polygons.polygons[i].indices.size();
		
	float maxDimension = -FLT_MAX;
	float *pCoordinates = new float[numPoints*2];

	unsigned int coord_index = 0;
	for (int i=0; i < paths; i++)
	{
		const PVRTPolygon &polygon = polygons.polygons[i];

		for (unsigned int j=0; j < polygon.indices.size(); j++)
		{
			PVRTVec3 coord = coordinates[polygon.indices[j]].position;
			pCoordinates[coord_index++] = coord.x;
			pCoordinates[coord_index++] = coord.y;

			maxDimension = PVRT_MAX(coord.x, maxDimension);
			maxDimension = PVRT_MAX(coord.y, maxDimension);
		}
	}

	ExternalTrapStruct TrapezoidsResult;

	TRI_ERROR_TYPES status = BuildPolygonTrapeziation(NULL, //do all subpaths at once
									                  maxDimension,
											          // path data
											          paths,
											          pPathLengths,
											          pCoordinates,
											          // Specify a seed for the random number generator
											          // This isn't critcal if the processing is offline so just use 0
											          0,											 
											          // the resulting trap structure											 
											          &TrapezoidsResult);
	delete [] pPathLengths;
	delete [] pCoordinates;
	if (!AnalyzeTriangulationError(status))
		return false;

	int MaxFFRecursionDepth = 10000;
	int FillModeIsOddEven = 1;
	int numVertices = 0;
	float *pVertices = NULL;
	int numTriangles = 0;
	TriIndicesType *pTriangleIndices = NULL;

	numTriangles = OutputIndexedTriangles(&TrapezoidsResult,
										  MaxFFRecursionDepth,
										  FillModeIsOddEven,
										  true, 
										  &numVertices,
										  &pVertices,
										  &pTriangleIndices);

	for (int i=0; i < numTriangles; i++)
	{
		TriIndicesType triangle = pTriangleIndices[i];		
		PVRTVertex a = { PVRTVec3(pVertices[triangle.Ind[0]*2], pVertices[triangle.Ind[0]*2+1], 0.0f), PVRTVec2(0.0f, 0.0f) };
		PVRTVertex b = { PVRTVec3(pVertices[triangle.Ind[1]*2], pVertices[triangle.Ind[1]*2+1], 0.0f), PVRTVec2(0.0f, 0.0f) };
		PVRTVertex c = { PVRTVec3(pVertices[triangle.Ind[2]*2], pVertices[triangle.Ind[2]*2+1], 0.0f), PVRTVec2(0.0f, 0.0f) };

		const unsigned int index_start = triangle_coords.size();
		triangle_coords.push_back(a);
		triangle_coords.push_back(b);
		triangle_coords.push_back(c);

		PVRTTriangle tri = { index_start, index_start+1, index_start+2 };
		triangles.push_back(tri);
	}


	FreeTriangulationModuleMemory();

	return true;
}

};

#endif // ENABLE_IMG_TRIANGULATION

/******************************************************************************
 End of file (PVRTriangulateIMG.cpp)
******************************************************************************/

