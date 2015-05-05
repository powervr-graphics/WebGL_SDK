/******************************************************************************

 @File         bucket_converter.cpp

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Functionality to split map layers into smaller regions called
               buckets for fine-grained culling.

******************************************************************************/

#include "common.h"

#include <limits.h>

#include <iostream>
#include <map>
using namespace std;

#include "PVRNavigation.h"
using namespace pvrnavigation;

//********************************************
//*  Function declarations
//********************************************
void fill_coordinate_bucket(const PVRTMapLayer &layer, const PVRTIndexSet &indexset, PVRTCoordinateBucket &bucket, PVRTRenderIndexSet &mappedindexset);
void subdivide_indexset(const PVRTBucketIndexSet &indexset, const PVRTCoordinateBucket &coordbucket, PVRTBucketIndexSetVector &result);
void extract_triangles_intersecting_boundingbox(const PVRTBoundingBox2D &bbox, const PVRTTriangleVector &triangles, const PVRTCoordinateVector &coordinates, PVRTTriangleVector &result);
void extract_pivotquads_intersecting_boundingbox(const PVRTBoundingBox2D &bbox, const PVRTTriangleVector &triangles, const PVRTPivotQuadVertexVector &pivotquads, PVRTTriangleVector &result);
bool triangle_intersects_boundingbox(const PVRTBoundingBox2D &bbox, const PVRTTriangle &triangle, const PVRTCoordinateVector &coordinates);

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
bool create_buckets(const PVRTMapLayer &layer, const unsigned int numBucketRec, const unsigned int numIndexSetRec, 
					const unsigned int minPrimCnt, PVRTBucketMapLayer &bucketlayer)
{
	const unsigned int numSubdivs = (2 << (numBucketRec - 1)) + 1;
	const unsigned int numBuckets = numSubdivs * numSubdivs;
	unsigned int emptyBuckets = 0;
	unsigned int nonSubdivBuckets = 0;

	// This is just a guess to prevent some fragmentation due to reallocations
	bucketlayer.coordinatebuckets.reserve(numBuckets/2);
	bucketlayer.bucketindexsets.reserve(numBuckets/2);
	
	// Calculate boundingbox coord increments for the buckets
	PVRTVec2 inc = bucketlayer.boundingbox.Dimensions() * (1.0f/(float)numSubdivs);
	PVRTVec2 offset(0.0f, 0.0f);

	vector<PVRTBoundingBox2D> bboxes;

	for (unsigned int y=0; y < numSubdivs; y++)
	{
		// Set offset of bounding box to beginning of line
		offset.x = 0.0f;		
		
		// Loop through all horizontal buckets
		for (unsigned int x=0; x < numSubdivs; x++)
		{
			// Calculate bounding box for current bucket
			PVRTBoundingBox2D bbox;
			bbox.minCoords = bucketlayer.boundingbox.minCoords + offset;
			bbox.maxCoords = bbox.minCoords + inc;
			bboxes.push_back(bbox);
			// Move the bounding box to the next location horizontally
			offset.x += inc.x;
		}
		// Move the bounding box to the next location vertically
		offset.y += inc.y;
	}

	// Loop through all bounding boxes
	for (unsigned int i=0; i < bboxes.size(); i++)
	{
		cout << "\rProcessing bucket [" << i+1 << " / " << bboxes.size() << "]";		

		// Set bounding boxes for the indexset and coordinates
		PVRTBucketIndexSet indexset;
		PVRTCoordinateBucket coordbucket;
		indexset.boundingbox = bboxes[i];
		coordbucket.boundingbox = bboxes[i];

		// Extract all coordinates and primitives which intersect the bounding box of the bucket
		fill_coordinate_bucket(layer, layer.indexset, coordbucket, indexset.indexset);

		if (coordbucket.coordinates.size() > USHRT_MAX)
		{
			cerr << "Bounding bucket [" << i+1 << "] has more than " << USHRT_MAX << " elements." << endl;
			cerr << "Too many elements for 16bit indices -> " << coordbucket.coordinates.size() << endl;
			cerr << "Subdividing and trying again ... " << endl;
			PVRTBoundingBox2D subdivbboxes[4];
			bboxes[i].Subdivide(subdivbboxes[0], subdivbboxes[1], subdivbboxes[2], subdivbboxes[3]);
			bboxes.push_back(subdivbboxes[0]);
			bboxes.push_back(subdivbboxes[1]);
			bboxes.push_back(subdivbboxes[2]);
			bboxes.push_back(subdivbboxes[3]);
			continue;
		}

		// If the current bucket is not empty
		if (!(coordbucket.coordinates.empty() && coordbucket.pivotquads.empty()) && !indexset.indexset.IsEmpty())
		{
			// Store the bucket index inside the indexset to build relationship
			bucketlayer.coordinatebuckets.push_back(coordbucket);
			indexset.bucketindex = bucketlayer.coordinatebuckets.size() - 1;

			// Now subdivide the indexset for the bucket to be able to cull on a more fine-grained level
			PVRTBucketIndexSetVector subdivBuckets;
			subdivBuckets.push_back(indexset);

			// Subdivide 
			for (unsigned int j=0; j < numIndexSetRec; j++)
			{
				// This will store all subdivided indexsets
				PVRTBucketIndexSetVector tmp_subdivBuckets;

				for (unsigned int i=0; i < subdivBuckets.size(); i++)
				{
					// Check if there are enough primitives left in this indexset
					if (subdivBuckets[i].indexset.PrimitiveCount() > minPrimCnt)
					{
						subdivide_indexset(subdivBuckets[i], coordbucket, tmp_subdivBuckets);	
					}
					else
					{
						// no, so simply push back the old one
						tmp_subdivBuckets.push_back(subdivBuckets[i]);
						nonSubdivBuckets++;
					}
				}

				// Clear the old ones 
				subdivBuckets.clear();
				// and store the subdivided ones for the next iteration
				subdivBuckets = tmp_subdivBuckets;
			}

			// Copy the results to the list containing all indexsets of the bucket
			bucketlayer.bucketindexsets.reserve(bucketlayer.bucketindexsets.size() + subdivBuckets.size());
			bucketlayer.bucketindexsets.insert(bucketlayer.bucketindexsets.end(), subdivBuckets.begin(), subdivBuckets.end());
		}
		else
		{
			emptyBuckets++;
		}
	}
	
	// Repeat last statement to produce a nicer log output
	cout << "\rProcessing bucket [" << bboxes.size() << " / " << bboxes.size() << "]" << endl;			
	if (emptyBuckets > 0) cout << "Skipped " << emptyBuckets << " empty buckets." << endl;
	if (nonSubdivBuckets > 0) cout << "Skipped " << nonSubdivBuckets << " subdivision steps due to too less primitives." << endl;
	cout << "Finished building buckets." << endl;

	return true;
}


/*!********************************************************************************************
 @Function		fill_coordinate_bucket
 @Input			layer                 Layer containing navigation primitives.  
 @Input         indexset              Set of indices describing roads, names, etc.
 @Input			bucket                All primitives within the bucket bounding box are added to
				                      this bucket.
 @Input			mappedindexset        The mapped indices (from original layer to bucket) are stored 
				                      within this indexset.
 @Description	Iterates over the original map data and extracts all primitives within the buckets
                bounding box. Copied vertex data will get new, mapped indices which are stored 
				within the mapped indexset.
***********************************************************************************************/
void fill_coordinate_bucket(const PVRTMapLayer &layer, const PVRTIndexSet &indexset, PVRTCoordinateBucket &bucket, PVRTRenderIndexSet &mappedindexset)
{
	// For each primitive type:
	//   - Check if a primitive is contained within the boundingbox of the bucket
	//     -> insert element == insert vertices and record mapping from old mapping to new one
	
	map<unsigned int, unsigned int> index_mapping;
	
	// Triangles
	const size_t trianglecount = indexset.triangles.size();
	mappedindexset.triangles.reserve(mappedindexset.triangles.size() + trianglecount);
	for (size_t i=0; i < trianglecount; i++)
	{
		const PVRTTriangle &triangle = indexset.triangles[i];
		if (triangle_intersects_boundingbox(bucket.boundingbox, triangle, layer.coordinates))
		{
			if (index_mapping.find(triangle.a) == index_mapping.end())
			{
				index_mapping[triangle.a] = bucket.coordinates.size();
				bucket.coordinates.push_back(layer.coordinates[triangle.a]);
			}

			if (index_mapping.find(triangle.b) == index_mapping.end())
			{
				index_mapping[triangle.b] = bucket.coordinates.size();
				bucket.coordinates.push_back(layer.coordinates[triangle.b]);
			}

			if (index_mapping.find(triangle.c) == index_mapping.end())
			{
				index_mapping[triangle.c] = bucket.coordinates.size();
				bucket.coordinates.push_back(layer.coordinates[triangle.c]);
			}
							
			PVRTTriangle mappedtriangle = { index_mapping[triangle.a], index_mapping[triangle.b], index_mapping[triangle.c] };	
			mappedindexset.triangles.push_back(mappedtriangle);
		}
	}

	// Pivot quads
	const size_t pivotquads = indexset.pivotquadtriangles.size();
	mappedindexset.pivotquadtriangles.reserve(mappedindexset.pivotquadtriangles.size() + pivotquads);
	for (size_t i=0; i < pivotquads; i++)
	{
		const PVRTTriangle &triangle = indexset.pivotquadtriangles[i];		
		
		if (bucket.boundingbox.Contains(layer.pivotquads[triangle.a].origin))
		{			
			const unsigned int index = bucket.pivotquads.size();			
			bucket.pivotquads.push_back(layer.pivotquads[triangle.a]);			
			bucket.pivotquads.push_back(layer.pivotquads[triangle.b]);
			bucket.pivotquads.push_back(layer.pivotquads[triangle.c]);			
						
			PVRTTriangle mapped_triangle = { index, index+1, index+2 };	
			mappedindexset.pivotquadtriangles.push_back(mapped_triangle);					
		}
	}
}

/*!********************************************************************************************
 @Function		extract_triangles_intersecting_boundingbox
 @Input			bbox           Bounding box to test against.
 @Input			triangles      Triangle indices for the triangles
 @Input			coordinates    Vector of vertices.
 @Output        result         All triangles which intersect that bounding box.
 @Description	Scans through the vector of triangles and adds those to the result which
                intersect the bounding box.
***********************************************************************************************/
void extract_triangles_intersecting_boundingbox(const PVRTBoundingBox2D &bbox, const PVRTTriangleVector &triangles, const PVRTCoordinateVector &coordinates, PVRTTriangleVector &result)
{
	const size_t size = triangles.size();
	
	for (size_t i=0; i < size; i++)
	{
		const PVRTTriangle &t = triangles[i];
		if (triangle_intersects_boundingbox(bbox, t, coordinates))
			result.push_back(t);
	}
}

/*!********************************************************************************************
 @Function		extract_pivotquads_intersecting_boundingbox
 @Input			bbox           Bounding box to test against.
 @Input			triangles      Triangle indices for the pivotquads
 @Input			pivotquads     Vector of pivotquad geometry data.
 @Output        result         All pivotquads which intersect that bounding box.
 @Description	Scans through the vector of pivotquads and adds those to the result which
                intersect the bounding box.
***********************************************************************************************/
void extract_pivotquads_intersecting_boundingbox(const PVRTBoundingBox2D &bbox, const PVRTTriangleVector &triangles, const PVRTPivotQuadVertexVector &pivotquads, PVRTTriangleVector &result)
{
	const size_t size = triangles.size();
	
	for (size_t i=0; i < size; i++)
	{
		if (bbox.Contains(pivotquads[triangles[i].a].origin))
			result.push_back(triangles[i]);			
	}
}


/*!********************************************************************************************
 @Function		subdivide_indexset
 @Input			bucketindexset        Set of indices describing roads, names, etc plus bounding box and bucket index.
 @Input			bucket                Set of coordinates which are all within a certain bounding box.
 @Input			result                Vector of subdivided bucket indexsets.
 @Description	Recursively splits the bucket indexsets into smaller bucket indexsets, adjusting bounding
                box coordinates.
***********************************************************************************************/
void subdivide_indexset(const PVRTBucketIndexSet &indexset, const PVRTCoordinateBucket &coordbucket, PVRTBucketIndexSetVector &result)
{
	PVRTBoundingBox2D bboxes[4];
	indexset.boundingbox.Subdivide(bboxes[0], bboxes[1], bboxes[2], bboxes[3]);

	for (unsigned int i=0; i < 4; i++)
	{
		PVRTBucketIndexSet bucketindexset;		
		bucketindexset.boundingbox = bboxes[i];
		bucketindexset.bucketindex = indexset.bucketindex;
		extract_triangles_intersecting_boundingbox(bucketindexset.boundingbox, indexset.indexset.triangles, coordbucket.coordinates, bucketindexset.indexset.triangles);
		extract_pivotquads_intersecting_boundingbox(bucketindexset.boundingbox, indexset.indexset.pivotquadtriangles, coordbucket.pivotquads, bucketindexset.indexset.pivotquadtriangles);		
		if (!bucketindexset.indexset.IsEmpty())
			result.push_back(bucketindexset);
	}
}

/*!********************************************************************************************
 @Function		triangle_intersects_boundingbox
 @Input			bbox               The bounding box to test for.
 @Input			triangle           The triangle indices.
 @Input			coordinates        The coordinate vector.
 @Return        True if the triangle is contained within or intersects the bounding box.
 @Description	Tests whether a triangle intersects a bounding box. This test is not 100% accurate
                but good enough for the use-case. The only thing it does not handle correctly is 
				triangles near the corners of the bounding box and might give false positives in
				some cases.
***********************************************************************************************/
bool triangle_intersects_boundingbox(const PVRTBoundingBox2D &bbox, const PVRTTriangle &triangle, const PVRTCoordinateVector &coordinates)
{
	const PVRTVec3 &p0 = coordinates[triangle.a].position;
	const PVRTVec3 &p1 = coordinates[triangle.b].position;
	const PVRTVec3 &p2 = coordinates[triangle.c].position;
	
	// If one point is within the bounding box, the triangle is too
	if (bbox.Contains(p0) || bbox.Contains(p1) || bbox.Contains(p2))
		return true;

	// If all points on one axis are outside of the min/max bounds, then the triangle is outside too
	if (((p0.x < bbox.minCoords.x) && (p1.x < bbox.minCoords.x) && (p2.x < bbox.minCoords.x)) ||
		((p0.x > bbox.maxCoords.x) && (p1.x > bbox.maxCoords.x) && (p2.x > bbox.maxCoords.x)) ||
		((p0.y < bbox.minCoords.y) && (p1.y < bbox.minCoords.y) && (p2.y < bbox.minCoords.y)) ||
		((p0.y > bbox.maxCoords.y) && (p1.y > bbox.maxCoords.y) && (p2.y < bbox.maxCoords.y)))
		return false;

	// This is the last resort. As the triangles are tiny in comparison to the bounding box, 
	// create a bounding box for the triangle and make an overlap test
	PVRTBoundingBox2D tri_bbox(p0);			
	tri_bbox.Extend(p1);
	tri_bbox.Extend(p2);
	if (tri_bbox.Overlaps(bbox))
		return true;
		
	return false;
}

